import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import s from './MemberHome.module.scss'

const ACTIONS = [
  {
    to: '/profile',
    eyebrow: 'Your bar',
    title: 'Build your cabinet',
    body: 'Log bottles, bitters, and mixers so we can tailor what you can pour tonight.',
    cta: 'Open your bar →',
  },
  {
    to: '/recipes',
    eyebrow: 'Explore',
    title: 'Browse the recipe vault',
    body: 'Search by mood, ingredient, glass, or difficulty — then save what you love.',
    cta: 'Browse recipes →',
  },
  {
    to: '/recipes',
    eyebrow: 'Dig in',
    title: 'Dial in what to pour',
    body: 'Search by ingredient, glass, difficulty, or mood — then bookmark recipes for tonight.',
    cta: 'Search recipes →',
  },
] as const

export function MemberHome() {
  const { user } = useAuth()
  const raw = (user?.name ?? '').trim()
  const greeting = raw ? raw.split(/\s+/)[0] : 'mixologist'

  return (
    <div className={s.page}>
      <header className={s.hero}>
        <p className={s.eyebrow}>You&apos;re in</p>
        <h1 className={s.title}>
          Welcome back,
          <br />
          <em>{greeting}</em>
        </h1>
        <p className={s.lead}>
          Start with your cabinet, browse the vault, or experiment with originals — pick one and
          we&apos;ll remember where you left off on any device.
        </p>
      </header>

      <section className={s.gridSection} aria-label="What to do next">
        <div className={s.grid}>
          {ACTIONS.map((item) => (
            <Link key={item.title} to={item.to} className={s.card}>
              <span className={s.cardEyebrow}>{item.eyebrow}</span>
              <h2 className={s.cardTitle}>{item.title}</h2>
              <p className={s.cardBody}>{item.body}</p>
              <span className={s.cardArrow}>{item.cta}</span>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
