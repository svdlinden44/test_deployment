import { Link, NavLink } from 'react-router-dom'
import { useScrolledNav } from '@/hooks/useScrolledNav'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import s from './Navbar.module.scss'

export function Navbar() {
  const scrolled = useScrolledNav(60)
  const { user, logout } = useAuth()

  return (
    <nav className={cn(s.nav, scrolled && s.scrolled)}>
      <Link to="/" className={s.logo}>
        <span className={s.logoIcon}>🥃</span>
        The Distillist
      </Link>

      <ul className={s.links}>
        <li>
          <NavLink to="/#features" className={s.link}>
            Features
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/cocktails"
            className={({ isActive }) => cn(s.link, isActive && s.linkActive)}
          >
            Recipes
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/profile"
            className={({ isActive }) => cn(s.link, isActive && s.linkActive)}
          >
            Your Bar
          </NavLink>
        </li>
        {user ? (
          <li>
            <button onClick={logout} className={s.cta}>
              Sign Out
            </button>
          </li>
        ) : (
          <li>
            <NavLink to="/#waitlist" className={s.cta}>
              Early Access
            </NavLink>
          </li>
        )}
      </ul>
    </nav>
  )
}
