import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import s from './MemberHome.module.scss'

const ACTIONS = [
  {
    to: '/recipes',
    eyebrow: 'Recipe Vault',
    title: 'Browse every cocktail',
    body: 'Search by spirit, glass, ingredients, and difficulty — the full catalog.',
    cta: 'Open Recipe Vault →',
  },
  {
    to: '/favorites',
    eyebrow: 'Favorites',
    title: 'Recipes you’ve hearted',
    body: 'Saved from the vault — independent from wishlist and your authored recipes.',
    cta: 'View favorites →',
  },
  {
    to: '/wishlist',
    eyebrow: 'Wishlist',
    title: 'Want to try later',
    body: 'A separate list from favorites — track cocktails you’re curious about.',
    cta: 'Open wishlist →',
  },
  {
    to: '/my-recipes',
    eyebrow: 'My Recipes',
    title: 'Your own creations',
    body: 'Member-authored recipes — private by default; sharing comes later.',
    cta: 'See my recipes →',
  },
  {
    to: '/cabinet',
    eyebrow: 'My Cabinet',
    title: 'What’s on your bar',
    body: 'Toggle bottles and bitters so pours match what you actually stock.',
    cta: 'Edit cabinet →',
  },
  {
    to: '/profile',
    eyebrow: 'My Profile',
    title: 'Account & photo',
    body: 'Display name, password, and profile picture.',
    cta: 'Edit profile →',
  },
  {
    to: '/origin-stories',
    eyebrow: 'Origin Stories',
    title: 'History & lore',
    body: 'Essays on the classics — editorial pages landing soon.',
    cta: 'Read Origin Stories →',
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
          Pick a destination below — naming matches the menu in the nav so you always know where you
          are.
        </p>
      </header>

      <section className={s.gridSection} aria-label="Member destinations">
        <div className={s.grid}>
          {ACTIONS.map((item) => (
            <Link key={item.title + item.to} to={item.to} className={s.card}>
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
