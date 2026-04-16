import { useState } from 'react'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { joinWaitlist } from '@/lib/api/endpoints'
import { cn } from '@/lib/utils'
import s from './Waitlist.module.scss'

export function Waitlist() {
  const { ref, visible } = useScrollReveal()
  const [email, setEmail] = useState('')
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('No spam. Just the finest things, in good time.')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!email) return
    setStatus('loading')
    try {
      await joinWaitlist(email)
      setStatus('success')
      setMessage("✦ You're on the list. We'll be in touch.")
      setEmail('')
    } catch {
      setStatus('error')
      setMessage('Something went wrong. Please try again.')
    }
  }

  return (
    <section id="waitlist" className={s.section}>
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(s.inner, s.reveal, visible && s.visible)}
      >
        <span className={s.label}>Join the Inner Circle</span>
        <h2 className={s.title}>
          Be the First to<br />
          <em>Pour a Glass</em>
        </h2>
        <p className={s.sub}>
          Sign up for early access and receive founding member privileges
          when The Distillist opens its doors.
        </p>

        <form onSubmit={handleSubmit} className={s.form}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            required
            className={s.input}
          />
          <button
            type="submit"
            disabled={status === 'loading'}
            className={s.btn}
          >
            {status === 'loading' ? '...' : 'Reserve Seat'}
          </button>
        </form>

        <p className={cn(
          s.note,
          status === 'success' && s.success,
          status === 'error' && s.error
        )}>
          {message}
        </p>
      </div>
    </section>
  )
}
