import { useAuthStore } from '@/store/authStore'
import { ApiError } from './types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function parseApiErrorMessage(body: Record<string, unknown>, fallback: string): string {
  const d = body.detail
  if (typeof d === 'string') return d
  if (Array.isArray(d) && d.length) {
    const first = d[0] as Record<string, unknown>
    if (typeof first?.msg === 'string') return first.msg as string
  }
  if (typeof body.message === 'string') return body.message
  const keys = Object.keys(body).filter((k) => k !== 'detail')
  for (const k of keys) {
    const v = body[k]
    if (Array.isArray(v) && typeof v[0] === 'string') return `${k}: ${v[0]}`
    if (typeof v === 'string') return v
  }
  return fallback
}

type QueryPrimitive = string | number | boolean | undefined

export async function request<T>(
  path: string,
  init: RequestInit & {
    params?: Record<string, QueryPrimitive | QueryPrimitive[]>
    auth?: boolean
  } = {},
): Promise<T> {
  const { params, auth = true, ...fetchInit } = init

  const url = new URL(BASE_URL + path, window.location.origin)
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v === undefined) return
      if (Array.isArray(v)) {
        v.forEach((item) => {
          if (item === undefined || item === '') return
          url.searchParams.append(k, String(item))
        })
      } else {
        url.searchParams.set(k, String(v))
      }
    })
  }

  const token = useAuthStore.getState().token
  const headers = new Headers(fetchInit.headers)
  headers.set('Content-Type', 'application/json')
  if (auth && token) headers.set('Authorization', `Bearer ${token}`)

  const res = await fetch(url.toString(), { ...fetchInit, headers })

  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>
    const message = parseApiErrorMessage(body, res.statusText)
    const code =
      typeof body.code === 'string'
        ? body.code
        : typeof body.detail === 'string'
          ? 'DETAIL'
          : 'UNKNOWN'
    throw new ApiError(res.status, code, message)
  }

  return res.json() as Promise<T>
}
