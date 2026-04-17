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

export function GoogleSignInButton({ onSuccess, disabled, mode }: Props) {
  const clientId = (import.meta.env.VITE_GOOGLE_CLIENT_ID ?? '').trim()
  const [gsiReady, setGsiReady] = useState(false)
  const tokenClientRef = useRef<TokenClient | null>(null)
  const onSuccessRef = useRef(onSuccess)
  onSuccessRef.current = onSuccess

  const label = mode === 'signup' ? 'Sign up with Google' : 'Sign in with Google'

  useEffect(() => {
    if (!clientId || disabled) {
      setGsiReady(false)
      tokenClientRef.current = null
      return
    }

    const init = () => {
      if (!window.google?.accounts?.oauth2) return
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

    const existing = document.querySelector<HTMLScriptElement>(`script[src="${GSI_SRC}"]`)
    if (existing) {
      if (window.google?.accounts?.oauth2) init()
      else existing.addEventListener('load', init, { once: true })
      return () => {
        setGsiReady(false)
        tokenClientRef.current = null
      }
    }

    const script = document.createElement('script')
    script.src = GSI_SRC
    script.async = true
    script.defer = true
    script.onload = () => init()
    document.body.appendChild(script)

    return () => {
      setGsiReady(false)
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
          Zet <code className={s.code}>VITE_GOOGLE_CLIENT_ID</code> in je frontend{' '}
          <code className={s.code}>.env</code> en dezelfde waarde als{' '}
          <code className={s.code}>GOOGLE_OAUTH_CLIENT_ID</code> in de Django-omgeving (zie
          stappen hieronder).
        </p>
      ) : !gsiReady ? (
        <p className={s.hintMuted}>Google laden…</p>
      ) : null}
    </div>
  )
}
