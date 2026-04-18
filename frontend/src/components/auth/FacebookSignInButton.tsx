import { useCallback, useEffect, useRef, useState } from 'react'
import { FacebookMark } from './FacebookMark'
import s from './SocialOAuthButton.module.scss'

type Props = {
  onSuccess: (payload: { access_token: string }) => void
  disabled?: boolean
  mode: 'signup' | 'signin'
}

const FB_SDK_VERSION = 'v21.0'
const FB_WAIT_MS = 15000

type FbLoginResponse = {
  status?: string
  authResponse?: { accessToken?: string }
}

declare global {
  interface Window {
    FB?: {
      init: (params: { appId: string; cookie: boolean; xfbml: boolean; version: string }) => void
      login: (cb: (r: FbLoginResponse) => void, opts?: { scope: string }) => void
    }
    fbAsyncInit?: () => void
  }
}

export function FacebookSignInButton({ onSuccess, disabled, mode }: Props) {
  const appId = (import.meta.env.VITE_FACEBOOK_APP_ID ?? '').trim()

  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const initDoneRef = useRef(false)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const label = mode === 'signup' ? 'Sign up with Facebook' : 'Sign in with Facebook'

  useEffect(() => {
    if (!appId || disabled) {
      setReady(false)
      setError(null)
      initDoneRef.current = false
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
    }

    const finishInit = () => {
      if (cancelled || initDoneRef.current) return
      if (!window.FB) return
      clearTimers()
      try {
        window.FB.init({
          appId,
          cookie: true,
          xfbml: false,
          version: FB_SDK_VERSION,
        })
        initDoneRef.current = true
        setError(null)
        setReady(true)
      } catch {
        fail('Could not initialize Facebook login.')
      }
    }

    const waitForFb = () => {
      waitTimer = setInterval(() => {
        if (cancelled) return
        if (window.FB) finishInit()
      }, 50)
      failTimer = setTimeout(() => {
        fail(
          'Facebook login did not load (blocked script or network). Try another browser or disable extensions.',
        )
      }, FB_WAIT_MS)
    }

    const prevAsync = window.fbAsyncInit
    window.fbAsyncInit = () => {
      prevAsync?.()
      finishInit()
    }

    const existing = document.getElementById('facebook-jssdk')
    if (existing) {
      if (window.FB) finishInit()
      else waitForFb()
      return () => {
        cancelled = true
        clearTimers()
        window.fbAsyncInit = prevAsync
        initDoneRef.current = false
        setReady(false)
        setError(null)
      }
    }

    const script = document.createElement('script')
    script.id = 'facebook-jssdk'
    script.async = true
    script.defer = true
    script.crossOrigin = 'anonymous'
    script.src = 'https://connect.facebook.net/en_US/sdk.js'
    script.onload = () => {
      /* fbAsyncInit runs when SDK is ready */
    }
    script.onerror = () => {
      fail('Could not load Facebook SDK. Check your network and that connect.facebook.net is allowed.')
    }
    document.body.appendChild(script)
    waitForFb()

    return () => {
      cancelled = true
      clearTimers()
      window.fbAsyncInit = prevAsync
      initDoneRef.current = false
      setReady(false)
      setError(null)
    }
  }, [appId, disabled])

  const handleClick = useCallback(() => {
    if (!appId || !ready || disabled || !window.FB) return
    window.FB.login(
      (r: FbLoginResponse) => {
        const at = r.authResponse?.accessToken?.trim()
        if (at) {
          onSuccessRef.current({ access_token: at })
          return
        }
        if (r.status === 'not_authorized' || r.status === 'unknown') {
          setError('Facebook login was cancelled or email permission was not granted.')
        }
      },
      { scope: 'public_profile,email' },
    )
  }, [appId, disabled, ready])

  const btnDisabled = disabled || !appId || !ready

  return (
    <div className={s.wrap}>
      <button
        type="button"
        className={s.oauthBtn}
        onClick={handleClick}
        disabled={btnDisabled}
        aria-busy={!!appId && !ready}
      >
        <FacebookMark className={s.mark} />
        <span>{label}</span>
      </button>
      {!appId ? (
        <p className={s.hint}>
          Set <code className={s.code}>VITE_FACEBOOK_APP_ID</code> and{' '}
          <code className={s.code}>FACEBOOK_APP_ID</code> /{' '}
          <code className={s.code}>FACEBOOK_APP_SECRET</code> on the API for token validation.
        </p>
      ) : error ? (
        <p className={s.hint}>{error}</p>
      ) : !ready ? (
        <p className={s.hintMuted}>Loading Facebook login…</p>
      ) : null}
    </div>
  )
}
