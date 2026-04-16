import { useAuthStore } from '@/store/authStore'
import { ApiError } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export async function request<T>(
  path: string,
  init: RequestInit & { params?: Record<string, string> } = {}
): Promise<T> {
  const { params, ...fetchInit } = init

  const url = new URL(BASE_URL + path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  }

  const token = useAuthStore.getState().token
  const headers = new Headers(fetchInit.headers)
  headers.set('Content-Type', 'application/json')
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url.toString(), { ...fetchInit, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({})) as { code?: string; message?: string }
    throw new ApiError(res.status, body.code ?? 'UNKNOWN', body.message ?? res.statusText)
  }

  return res.json() as Promise<T>
}
