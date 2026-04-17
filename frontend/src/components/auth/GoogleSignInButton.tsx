import { useCallback, useEffect, useRef, useState } from 'react'
import { GoogleGMark } from './GoogleGMark'
import s from './GoogleSignInButton.module.scss'

type TokenResponse = {
  access_token?: string
  error?: string
  error_description?: string
}

type TokenClient = {
  requestAccessToken: (overrideConfig?: Record<string, unknown>) => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string
            scope: string
            callback: (resp: TokenResponse) => void
          }) => TokenClient
        }
      }
    }
  }
}

type Props = {
  onSuccess: (payload: { access_token: string } | { credential: string }) => void
  disabled?: boolean
  mode: 'signup' | 'signin'
}

const GSI_SRC = 'https://accounts.google.com/gsi/client'
const SCOPE = 'openid email profile'
const GSI_WAIT_MS = 15000

export function GoogleSignInButton({ onSuccess, disabled, mode }: Props) {
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
  const [gsiReady, setGsiReady] = useState(false)
  const [gsiError, setGsiError] = useState<string | null>(null)
  const tokenClientRef = useRef<TokenClient | null>(null)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const label = mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'

  useEffect(() => {
    if (!clientId || disabled) {
      setGsiReady(false)
      setGsiError(null)
      tokenClientRef.current = null
      return
    }

    let cancelled = false
    let waitTimer: ReturnType<typeof setInterval> | null = null
    let failTimer: ReturnType<typeof setTimeout> | null = null

    const clearTimers = () => {
      if (waitTimer !== null) clearInterval(waitTimer)
      waitTimer = null
      if (failTimer !== null) clearTimeout(failTimer)
      failTimer = null
    }

    const fail = (message: string) => {
      if (cancelled) return
      clearTimers()
      setGsiError(message)
      setGsiReady(false)
      tokenClientRef.current = null
    }

    const init = () => {
      if (cancelled) return
      if (!window.google?.accounts?.oauth2) return
      clearTimers()
      setGsiError(null)
      tokenClientRef.current = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPE,
        callback: (resp: TokenResponse) => {
          if (resp.access_token) {
            onSuccessRef.current({ access_token: resp.access_token })
            return
          }
          if (resp.error) {
            console.warn('Google OAuth:', resp.error, resp.error_description)
          }
        },
      })
      setGsiReady(true)
    }

    const waitForGoogle = () => {
      waitTimer = setInterval(() => {
        if (cancelled) return
        if (window.google?.accounts?.oauth2) {
          init()
        }
      }, 50)
      failTimer = setTimeout(() => {
        fail(
          'Google sign-in did not load (blocked script, network, or ad blocker). Try another browser or disable extensions.',
        )
      }, GSI_WAIT_MS)
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    if (existing) {
      if (window.google?.accounts?.oauth2) init()
      else if (existing.dataset.gsiError === '1') {
        fail(
          'Could not load Google sign-in. Check your network and that accounts.google.com is allowed.',
        )
      } else {
        existing.addEventListener('load', () => init(), { once: true })
        existing.addEventListener(
          'error',
          () => {
            existing.dataset.gsiError = '1'
            fail(
              'Could not load Google sign-in. Check your network and that accounts.google.com is allowed.',
            )
          },
          { once: true },
        )
        waitForGoogle()
      }
      return () => {
        cancelled = true
        clearTimers()
        setGsiReady(false)
        setGsiError(null)
        tokenClientRef.current = null
      }
    }

    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = () => init()
    script.onerror = () => {
      script.dataset.gsiError = '1'
      fail(
        'Could not load Google sign-in. Check your network and that accounts.google.com is allowed.',
      )
    }
    document.body.appendChild(script)
    waitForGoogle()

    return () => {
      cancelled = true
      clearTimers()
      setGsiReady(false)
      setGsiError(null)
      tokenClientRef.current = null
    }
  }, [clientId, disabled])

  const handleClick = useCallback(() => {
    if (!clientId || !gsiReady || disabled) return
    tokenClientRef.current?.requestAccessToken()
  }, [clientId, disabled, gsiReady])

  const btnDisabled = disabled || !clientId || !gsiReady

  return (
    <div className={s.wrap}>
      <button
        type="button"
        className={s.googleBtn}
        onClick={handleClick}
        disabled={btnDisabled}
        aria-busy={!!clientId && !gsiReady}
      >
        <GoogleGMark className={s.mark} />
        <span>{label}</span>
      </button>
      {!clientId ? (
        <p className={s.hint}>
          Set <code className={s.code}>VITE_GOOGLE_CLIENT_ID</code> for the frontend build and{' '}
          <code className={s.code}>GOOGLE_OAUTH_CLIENT_ID</code> on the API (same Web client ID). In
          Google Cloud Console, add this site under Authorized JavaScript origins.
        </p>
      ) : gsiError ? (
        <p className={s.hint}>{gsiError}</p>
      ) : !gsiReady ? (
        <p className={s.hintMuted}>Loading Google sign-in…</p>
      ) : null}
    </div>
  )
}
