import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import s from './Signup.module.scss'

export function Signup() {
  const { signup } = useAuth()
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signup(email, password, name)
      navigate('/profile', { replace: true })
    } catch {
      setError('Something went wrong. Please try again.')
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
          <h1 className={s.heading}>Join the club</h1>
          <p className={s.sub}>Create your account</p>

          {error && <p className={s.error}>{error}</p>}

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
              />
            </div>

            <button type="submit" disabled={loading} className={s.submitBtn}>
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className={s.footer}>
            Already have an account?{' '}
            <Link to="/login" className={s.footerLink}>Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
