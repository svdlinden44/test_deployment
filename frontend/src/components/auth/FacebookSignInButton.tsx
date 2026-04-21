import { useCallback, useEffect, useRef, useState } from 'react'
import { ensureFacebookSdk } from '@/lib/facebookSdk'
import { FacebookMark } from './FacebookMark'
import s from './SocialOAuthButton.module.scss'

type Props = {
  onSuccess: (payload: { access_token: string }) => void
  disabled?: boolean
  mode: 'signup' | 'signin'
}

type FbLoginResponse = {
  status?: string
  authResponse?: { accessToken?: string }
}

export function FacebookSignInButton({ onSuccess, disabled, mode }: Props) {
  const appId = (import.meta.env.VITE_FACEBOOK_APP_ID ?? '').trim()

  const [ready, setReady] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const label = mode === 'signup' ? 'Sign up with Facebook' : 'Sign in with Facebook'

  useEffect(() => {
    if (!appId || disabled) {
      setReady(false)
      setError(null)
      return
    }

    let cancelled = false
    setReady(false)
    setError(null)

    void ensureFacebookSdk(appId)
      .then(() => {
        if (!cancelled) {
          setReady(true)
        }
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Facebook login could not start.')
          setReady(false)
        }
      })

    return () => {
      cancelled = true
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
          setError('Facebook login was cancelled or not fully authorized.')
        } else if (r.status === 'connected' && !at) {
          setError('Facebook did not return a token. Check app settings and try again.')
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
          Set <code className={s.code}>VITE_FACEBOOK_APP_ID</code> and restart the dev server, and
          the same <code className={s.code}>FACEBOOK_APP_ID</code> on the API.
        </p>
      ) : error ? (
        <p className={s.hint}>{error}</p>
      ) : !ready ? (
        <p className={s.hintMuted}>Loading Facebook login…</p>
      ) : null}
    </div>
  )
}
