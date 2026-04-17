import { useCallback, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { GoogleSignInButton } from '@/components/auth/GoogleSignInButton'
import { getAuthErrorMessage, useAuth } from '@/contexts/AuthContext'
import s from './Signup.module.scss'

export function Signup() {
  const { signup, loginWithGoogle } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [passwordConfirm, setPasswordConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleGoogle = useCallback(
    async (payload: { access_token: string } | { credential: string }) => {
      setError('')
      setLoading(true)
      try {
        await loginWithGoogle(payload)
        navigate('/profile', { replace: true })
      } catch (err) {
        setError(getAuthErrorMessage(err))
      } finally {
        setLoading(false)
      }
    },
    [loginWithGoogle, navigate],
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== passwordConfirm) {
      setError('Passwords do not match.')
      return
    }
    setLoading(true)
    try {
      await signup(email, password, name)
      navigate('/profile', { replace: true })
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
          <h1 className={s.heading}>Create your account</h1>
          <p className={s.sub}>Save recipes and build your cabinet.</p>

          {error && <p className={s.error}>{error}</p>}

          <div className={s.googleSlot}>
            <GoogleSignInButton mode="signup" onSuccess={handleGoogle} disabled={loading} />
          </div>

          <div className={s.divider}>
            <span>or sign up with email</span>
          </div>

          <form onSubmit={handleSubmit} className={s.form}>
            <div>
              <label className={s.fieldLabel}>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your name"
                className={s.input}
              />
            </div>
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
                minLength={8}
                placeholder="Min. 8 characters"
                className={s.input}
                autoComplete="new-password"
              />
            </div>
            <div>
              <label className={s.fieldLabel}>Confirm password</label>
              <input
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
                minLength={8}
                placeholder="Re-enter your password"
                className={s.input}
                autoComplete="new-password"
              />
            </div>

            <button type="submit" disabled={loading} className={s.submitBtn}>
              {loading ? 'Creating account...' : 'Create account'}
            </button>
          </form>

          <p className={s.footer}>
            Already have an account?{' '}
            <Link to="/login" className={s.footerLink}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
