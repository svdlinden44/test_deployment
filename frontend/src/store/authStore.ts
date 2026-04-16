import { create } from 'zustand'

export interface AuthUser {
  id: string
  email: string
  name: string
}

interface AuthState {
  token: string | null
  user: AuthUser | null
  setAuth: (user: AuthUser, token: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  user: null,
  setAuth: (user, token) => set({ user, token }),
  clearAuth: () => set({ user: null, token: null }),
}))
