import { request } from './client'
import type { AuthUser, MemberProfile } from './types'

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

export async function apiGetProfile(): Promise<MemberProfile> {
  return request<MemberProfile>('/api/auth/profile/', { method: 'GET' })
}

export async function apiUpdateProfile(form: FormData): Promise<MemberProfile> {
  return request<MemberProfile>('/api/auth/profile/', {
    method: 'PATCH',
    body: form,
  })
}

/** JSON-only updates (e.g. clear avatar with `{ avatar: null }`). */
export async function apiUpdateProfileJson(body: Record<string, unknown>): Promise<MemberProfile> {
  return request<MemberProfile>('/api/auth/profile/', {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export async function apiChangePassword(currentPassword: string, newPassword: string): Promise<void> {
  await request<{ detail: string }>('/api/auth/password/', {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })
}

/** Merge server profile fields into the stored member user object. */
export function mergeProfileIntoUser(user: AuthUser, profile: MemberProfile): AuthUser {
  return {
    ...user,
    email: profile.email,
    name: profile.name,
    avatar_url: profile.avatar_url,
  }
}
