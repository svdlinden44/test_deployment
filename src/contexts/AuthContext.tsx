import { createContext, useContext, useState, useEffect } from 'react'
import { useAuthStore, type AuthUser } from '@/store/authStore'

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, name: string) => Promise<void>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)

const STORAGE_KEY = 'distillist_auth'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const { setAuth, clearAuth } = useAuthStore()

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const { user: storedUser, token } = JSON.parse(stored) as { user: AuthUser; token: string }
        setUser(storedUser)
        setAuth(storedUser, token)
      }
    } catch {
      localStorage.removeItem(STORAGE_KEY)
    } finally {
      setLoading(false)
    }
  }, [setAuth])

  function persist(user: AuthUser, token: string) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user, token }))
    setUser(user)
    setAuth(user, token)
  }

  async function login(email: string, _password: string) {
    await new Promise((r) => setTimeout(r, 600))
    const fakeUser: AuthUser = {
      id: crypto.randomUUID(),
      email,
      name: email.split('@')[0],
    }
    const fakeToken = btoa(JSON.stringify({ ...fakeUser, exp: Date.now() + 86400000 }))
    persist(fakeUser, fakeToken)
  }

  async function signup(email: string, _password: string, name: string) {
    await new Promise((r) => setTimeout(r, 600))
    const fakeUser: AuthUser = {
      id: crypto.randomUUID(),
      email,
      name,
    }
    const fakeToken = btoa(JSON.stringify({ ...fakeUser, exp: Date.now() + 86400000 }))
    persist(fakeUser, fakeToken)
  }

  function logout() {
    localStorage.removeItem(STORAGE_KEY)
    setUser(null)
    clearAuth()
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
