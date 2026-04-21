import { create } from 'zustand'

import type { AuthUser } from '@/lib/api/types'

export type { AuthUser }

interface AuthState {
  token: string | null
  refreshToken: string | null
  user: AuthUser | null
  setAuth: (user: AuthUser, access: string, refresh: string) => void
  setAccessToken: (access: string) => void
  clearAuth: () => void
}

export const useAuthStore = create<AuthState>()((set) => ({
  token: null,
  refreshToken: null,
  user: null,
  setAuth: (user, access, refresh) => set({ user, token: access, refreshToken: refresh }),
  setAccessToken: (access) => set({ token: access }),
  clearAuth: () => set({ user: null, token: null, refreshToken: null }),
}))
