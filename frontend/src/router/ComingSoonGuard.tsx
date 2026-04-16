import { useLayoutEffect } from 'react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'thedistillist:comingSoonBypass'
const QUERY_PARAM = 'csbypass'

function comingSoonModeEnabled(): boolean {
  const v = import.meta.env.VITE_COMING_SOON_MODE?.toLowerCase().trim()
  return v === 'true' || v === '1'
}

function bypassSecret(): string {
  return (import.meta.env.VITE_COMING_SOON_BYPASS_SECRET ?? '').trim()
}

/** Call during render (client) so the first paint respects a valid ?csbypass= token. */
function persistBypassFromQuery(enabled: boolean, secret: string): void {
  if (!enabled || !secret || typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (params.get(QUERY_PARAM) === secret) {
    sessionStorage.setItem(STORAGE_KEY, '1')
  }
}

function hasBypass(): boolean {
  if (typeof sessionStorage === 'undefined') return false
  return sessionStorage.getItem(STORAGE_KEY) === '1'
}

export function ComingSoonGuard() {
  const location = useLocation()
  const navigate = useNavigate()
  const enabled = comingSoonModeEnabled()
  const secret = bypassSecret()

  if (typeof window !== 'undefined') {
    persistBypassFromQuery(enabled, secret)
  }

  const bypassed = hasBypass()

  useLayoutEffect(() => {
    if (!enabled || !secret) return
    const params = new URLSearchParams(location.search)
    if (params.get(QUERY_PARAM) !== secret) return
    params.delete(QUERY_PARAM)
    const search = params.toString()
    navigate(
      {
        pathname: location.pathname,
        search: search ? `?${search}` : '',
        hash: location.hash,
      },
      { replace: true },
    )
  }, [enabled, secret, location.pathname, location.search, location.hash, navigate])

  if (!enabled) {
    return <Outlet />
  }

  if (bypassed || location.pathname === '/coming-soon') {
    return <Outlet />
  }

  return <Navigate to="/coming-soon" replace />
}
