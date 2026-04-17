import { Link } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import s from './Waitlist.module.scss'

export function Waitlist() {
  const { ref, visible } = useScrollReveal()

  return (
    <section id="get-started" className={s.section}>
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(s.inner, s.reveal, visible && s.visible)}
      >
        <span className={s.label}>Get started</span>
        <h2 className={s.title}>
          Build your<br />
          <em>cabinet &amp; library</em>
        </h2>
        <p className={s.sub}>
          Create a free account to save recipes, track bottles, and pick up where you left off
          on any device.
        </p>

        <div className={s.actions}>
          <Link to="/signup">
            <Button variant="primary">Sign up free</Button>
          </Link>
          <Link to="/recipes">
            <Button variant="ghost">Browse recipes</Button>
          </Link>
        </div>
      </div>
    </section>
  )
}
