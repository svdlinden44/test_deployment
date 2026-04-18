import { useCallback, useEffect, useRef, useState } from 'react'
import { AppleMark } from './AppleMark'
import s from './SocialOAuthButton.module.scss'

type Props = {
  onSuccess: (payload: { id_token: string }) => void
  disabled?: boolean
  mode: 'signup' | 'signin'
}

const APPLE_SCRIPT =
  'https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js'
const APPLE_WAIT_MS = 15000

declare global {
  interface Window {
    AppleID?: {
      auth: {
        init: (config: {
          clientId: string
          scope?: string
          redirectURI: string
          state?: string
          nonce?: string
          usePopup?: boolean
        }) => void
        signIn: () => Promise<{
          authorization?: { id_token?: string; code?: string }
        }>
      }
    }
  }
}

export function AppleSignInButton({ onSuccess, disabled, mode }: Props) {
  const clientId = (import.meta.env.VITE_APPLE_CLIENT_ID ?? '').trim()
  const redirectFromEnv = (import.meta.env.VITE_APPLE_REDIRECT_URI ?? '').trim()
  const redirectURI = redirectFromEnv || `${window.location.origin}${window.location.pathname}`

  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initOnceRef = useRef(false)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const label = mode === 'signup' ? 'Sign up with Apple' : 'Sign in with Apple'

  useEffect(() => {
    if (!clientId || disabled) {
      setReady(false)
      setError(null)
      initOnceRef.current = false
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
      setError(message)
      setReady(false)
      initOnceRef.current = false
    }

    const init = () => {
      if (cancelled) return
      if (!window.AppleID?.auth) return
      if (initOnceRef.current) {
        setReady(true)
        return
      }
      clearTimers()
      try {
        const nonce =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`
        const state =
          typeof crypto !== 'undefined' && 'randomUUID' in crypto
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2)}`

        window.AppleID!.auth.init({
          clientId,
          scope: 'name email',
          redirectURI,
          state,
          nonce,
          usePopup: true,
        })
        initOnceRef.current = true
        setError(null)
        setReady(true)
      } catch {
        fail('Could not initialize Apple sign-in.')
      }
    }

    const waitForApple = () => {
      waitTimer = setInterval(() => {
        if (cancelled) return
        if (window.AppleID?.auth) init()
      }, 50)
      failTimer = setTimeout(() => {
        fail(
          'Apple sign-in did not load (blocked script, network, or browser restrictions). Try again or use email.',
        )
      }, APPLE_WAIT_MS)
    }

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${APPLE_SCRIPT}"]`)
    if (existing) {
      if (window.AppleID?.auth) init()
      else if (existing.dataset.appleError === '1') {
        fail('Could not load Apple sign-in. Check your network and allow appleid.cdn-apple.com.')
      } else {
        existing.addEventListener('load', () => init(), { once: true })
        existing.addEventListener(
          'error',
          () => {
            existing.dataset.appleError = '1'
            fail('Could not load Apple sign-in. Check your network and allow appleid.cdn-apple.com.')
          },
          { once: true },
        )
        waitForApple()
      }
      return () => {
        cancelled = true
        clearTimers()
        setReady(false)
        setError(null)
        initOnceRef.current = false
      }
    }

    const script = document.createElement('script')
    script.src = APPLE_SCRIPT
    script.async = true
    script.crossOrigin = 'anonymous'
    script.onload = () => init()
    script.onerror = () => {
      script.dataset.appleError = '1'
      fail('Could not load Apple sign-in. Check your network and allow appleid.cdn-apple.com.')
    }
    document.body.appendChild(script)
    waitForApple()

    return () => {
      cancelled = true
      clearTimers()
      setReady(false)
      setError(null)
      initOnceRef.current = false
    }
  }, [clientId, disabled, redirectURI])

  const handleClick = useCallback(async () => {
    if (!clientId || !ready || disabled || !window.AppleID?.auth) return
    try {
      const res = await window.AppleID.auth.signIn()
      const token = res.authorization?.id_token?.trim()
      if (token) {
        onSuccessRef.current({ id_token: token })
      }
    } catch {
      setError('Apple sign-in was cancelled or failed.')
    }
  }, [clientId, disabled, ready])

  const btnDisabled = disabled || !clientId || !ready

  return (
    <div className={s.wrap}>
      <button
        type="button"
        className={s.oauthBtn}
        onClick={() => void handleClick()}
        disabled={btnDisabled}
        aria-busy={!!clientId && !ready}
      >
        <AppleMark className={s.mark} />
        <span>{label}</span>
      </button>
      {!clientId ? (
        <p className={s.hint}>
          Set <code className={s.code}>VITE_APPLE_CLIENT_ID</code> (Services ID) and{' '}
          <code className={s.code}>APPLE_CLIENT_ID</code> on the API. Register{' '}
          <code className={s.code}>VITE_APPLE_REDIRECT_URI</code> or this page URL as a Return URL in
          Apple Developer.
        </p>
      ) : error ? (
        <p className={s.hint}>{error}</p>
      ) : !ready ? (
        <p className={s.hintMuted}>Loading Apple sign-in…</p>
      ) : null}
    </div>
  )
}
