import { request } from './client'
import type { AuthUser } from './types'

export type AuthTokensResponse = {
  user: AuthUser
  access: string
  refresh: string
}

export async function apiRegister(
  email: string,
  password: string,
  name: string,
): Promise<AuthTokensResponse> {
  return request<AuthTokensResponse>('/api/auth/register/', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
    auth: false,
  })
}

export async function apiLogin(email: string, password: string): Promise<AuthTokensResponse> {
  return request<AuthTokensResponse>('/api/auth/login/', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
    auth: false,
  })
}

export async function apiGoogleAuth(
  payload: { credential: string } | { access_token: string },
): Promise<AuthTokensResponse> {
  return request<AuthTokensResponse>('/api/auth/google/', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: false,
  })
}

export async function apiFacebookAuth(payload: {
  access_token: string
}): Promise<AuthTokensResponse> {
  return request<AuthTokensResponse>('/api/auth/facebook/', {
    method: 'POST',
    body: JSON.stringify(payload),
    auth: false,
  })
}

export async function apiRefreshToken(refresh: string): Promise<{ access: string }> {
  return request<{ access: string }>('/api/auth/token/refresh/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
    auth: false,
  })
}
