import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import {
  apiAppleAuth,
  apiFacebookAuth,
  apiGoogleAuth,
  apiLogin,
  apiRegister,
  apiRefreshToken,
} from '@/lib/api/auth'
import { ApiError } from '@/lib/api/types'
import { useAuthStore, type AuthUser } from '@/store/authStore'

export type GoogleAuthPayload = { credential: string } | { access_token: string }
export type AppleAuthPayload = { id_token: string }
export type FacebookAuthPayload = { access_token: string }

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  loginWithGoogle: (payload: GoogleAuthPayload) => Promise<void>
  loginWithApple: (payload: AppleAuthPayload) => Promise<void>
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
            const next: StoredAuth = { ...parsed, access }
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

  const loginWithApple = useCallback(async (payload: AppleAuthPayload) => {
    const { user: u, access, refresh } = await apiAppleAuth(payload)
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

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        signup,
        loginWithGoogle,
        loginWithApple,
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
