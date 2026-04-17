import { useCallback, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { getAuthErrorMessage, useAuth } from '@/contexts/AuthContext'
import s from './Login.module.scss'

export function Login() {
  const { login, loginWithGoogle } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: Pick<Location, 'pathname'> })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = useCallback(
    async (payload: { access_token: string } | { credential: string }) => {
      setError('')
      setLoading(true)
      try {
        await loginWithGoogle(payload)
        navigate(from, { replace: true })
      } catch (err) {
        setError(getAuthErrorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    [from, loginWithGoogle, navigate],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError(getAuthErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.wrapper}>
        <Link to="/" className={s.brand}>
          <img
            src="/images/logo-hero.png"
            alt="The Distillist"
            className={s.brandImg}
          />
        </Link>

        <div className={s.card}>
          <h1 className={s.heading}>Welcome back</h1>
          <p className={s.sub}>Sign in to your account</p>

          {error && <p className={s.error}>{error}</p>}

          <div className={s.googleSlot}>
            <GoogleSignInButton mode="signin" onSuccess={handleGoogle} disabled={loading} />
          </div>

          <div className={s.divider}>
            <span>or sign in with email</span>
          </div>

          <form onSubmit={handleSubmit} className={s.form}>
            <div>
              <label className={s.fieldLabel}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
                className={s.input}
              />
            </div>
            <div>
              <label className={s.fieldLabel}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className={s.input}
                autoComplete="current-password"
              />
            </div>

            <button type="submit" disabled={loading} className={s.submitBtn}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className={s.footer}>
            No account?{' '}
            <Link to="/signup" className={s.footerLink}>
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
