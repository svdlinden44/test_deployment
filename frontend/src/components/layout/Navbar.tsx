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
        <img
          src="/images/logo-banner.png"
          alt="The Distillist"
          className={s.logoImg}
        />
      </Link>

      <ul className={s.links}>
        <li>
          <NavLink to="/#features" className={s.link}>
            Features
          </NavLink>
        </li>
        <li>
          <NavLink
            to="/recipes"
            className={({ isActive }) => cn(s.link, isActive && s.linkActive)}
          >
            Recipes
          </NavLink>
        </li>
        {user ? (
          <>
            <li>
              <NavLink
                to="/profile"
                className={({ isActive }) => cn(s.link, isActive && s.linkActive)}
              >
                Your Bar
              </NavLink>
            </li>
            <li>
              <button type="button" onClick={logout} className={s.cta}>
                Sign Out
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <NavLink to="/signup" className={s.link}>
                Join
              </NavLink>
            </li>
            <li>
              <NavLink to="/login" className={s.cta}>
                Log in
              </NavLink>
            </li>
          </>
        )}
      </ul>
    </nav>
  )
}
