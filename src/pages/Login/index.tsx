import { useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import s from './Login.module.scss'

export function Login() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from = (location.state as { from?: Location })?.from?.pathname ?? '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await login(email, password)
      navigate(from, { replace: true })
    } catch {
      setError('Invalid credentials. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={s.page}>
      <div className={s.wrapper}>
        <Link to="/" className={s.logo}>
          <span>🥃</span> The Distillist
        </Link>

        <div className={s.card}>
          <h1 className={s.heading}>Welcome back</h1>
          <p className={s.sub}>Sign in to your account</p>

          {error && <p className={s.error}>{error}</p>}

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
              />
            </div>

            <button type="submit" disabled={loading} className={s.submitBtn}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className={s.footer}>
            No account?{' '}
            <Link to="/signup" className={s.footerLink}>Create one</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
