import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  apiFacebookAuth,
  apiGetProfile,
  apiGoogleAuth,
  apiLogin,
  apiRegister,
  apiRefreshToken,
  mergeProfileIntoUser,
} from '@/lib/api/auth'
import { ApiError, type MemberProfile } from '@/lib/api/types'
import { useAuthStore, type AuthUser } from '@/store/authStore'

export type GoogleAuthPayload = { credential: string } | { access_token: string }
export type FacebookAuthPayload = { access_token: string }

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  /** Re-fetch profile from the server and merge into stored user (avatar, name). */
  refreshUser: () => Promise<void>
  /** Apply an API profile payload without an extra GET (e.g. after PATCH profile). */
  applyMemberProfile: (profile: MemberProfile) => void
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  loginWithGoogle: (payload: GoogleAuthPayload) => Promise<void>
  loginWithFacebook: (payload: FacebookAuthPayload) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'distillist_auth'

type StoredAuth = {
  user: AuthUser
  access: string
  refresh: string
}

/** Legacy shape before JWT refresh */
type LegacyStoredAuth = {
  user: AuthUser
  token: string
}

function isStoredAuth(v: unknown): v is StoredAuth {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  const u = o.user
  return (
    typeof o.access === 'string' &&
    typeof o.refresh === 'string' &&
    !!u &&
    typeof u === 'object'
  )
}

function isLegacyStoredAuth(v: unknown): v is LegacyStoredAuth {
  if (!v || typeof v !== 'object') return false
  const o = v as Record<string, unknown>
  const u = o.user
  return typeof o.token === 'string' && !!u && typeof u === 'object'
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { setAuth, clearAuth, setAccessToken } = useAuthStore()

  useEffect(() => {
    const hydrate = async () => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY)
        if (!raw) return
        const parsed = JSON.parse(raw) as unknown

        if (isStoredAuth(parsed)) {
          setUser(parsed.user)
          setAuth(parsed.user, parsed.access, parsed.refresh)
          try {
            const { access } = await apiRefreshToken(parsed.refresh)
            setAccessToken(access)
            let mergedUser = parsed.user
            try {
              const profile = await apiGetProfile()
              mergedUser = mergeProfileIntoUser(parsed.user, profile)
              setUser(mergedUser)
              setAuth(mergedUser, access, parsed.refresh)
            } catch {
              /* profile fetch optional */
            }
            const next: StoredAuth = { user: mergedUser, access, refresh: parsed.refresh }
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
          } catch {
            /* keep existing access until first 401 */
          }
          return
        }

        if (isLegacyStoredAuth(parsed)) {
          localStorage.removeItem(STORAGE_KEY)
          return
        }
        localStorage.removeItem(STORAGE_KEY)
      } catch {
        localStorage.removeItem(STORAGE_KEY)
      } finally {
        setLoading(false)
      }
    }
    void hydrate()
  }, [setAuth, setAccessToken])

  function persist(next: StoredAuth) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    setUser(next.user)
    setAuth(next.user, next.access, next.refresh)
  }

  const login = useCallback(async (email: string, password: string) => {
    const { user: u, access, refresh } = await apiLogin(email, password)
    persist({ user: u, access, refresh })
  }, [])

  const signup = useCallback(async (email: string, password: string, name: string) => {
    const { user: u, access, refresh } = await apiRegister(email, password, name)
    persist({ user: u, access, refresh })
  }, [])

  const loginWithGoogle = useCallback(async (payload: GoogleAuthPayload) => {
    const { user: u, access, refresh } = await apiGoogleAuth(payload)
    persist({ user: u, access, refresh })
  }, [])

  const loginWithFacebook = useCallback(async (payload: FacebookAuthPayload) => {
    const { user: u, access, refresh } = await apiFacebookAuth(payload)
    persist({ user: u, access, refresh })
  }, [])

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    clearAuth()
  }

  const refreshUser = useCallback(async () => {
    const token = useAuthStore.getState().token
    const refreshTok = useAuthStore.getState().refreshToken
    const u = useAuthStore.getState().user
    if (!token || !refreshTok || !u) return
    try {
      const profile = await apiGetProfile()
      persist({ user: mergeProfileIntoUser(u, profile), access: token, refresh: refreshTok })
    } catch {
      /* ignore */
    }
  }, [])

  const applyMemberProfile = useCallback((profile: MemberProfile) => {
    const token = useAuthStore.getState().token
    const refreshTok = useAuthStore.getState().refreshToken
    const u = useAuthStore.getState().user
    if (!token || !refreshTok || !u) return
    persist({ user: mergeProfileIntoUser(u, profile), access: token, refresh: refreshTok })
  }, [])

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        refreshUser,
        applyMemberProfile,
        login,
        signup,
        loginWithGoogle,
        loginWithFacebook,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

export function getAuthErrorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message
  if (err instanceof Error) return err.message
  return 'Something went wrong. Please try again.'
}
