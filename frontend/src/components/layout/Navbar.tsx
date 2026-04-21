import { Link, NavLink } from 'react-router-dom'
import { PersonalNavDropdown } from '@/components/layout/PersonalNavDropdown'
import { useScrolledNav } from '@/hooks/useScrolledNav'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthUser } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import s from './Navbar.module.scss'

function initialsFromUser(user: AuthUser): string {
  const raw = user.name?.trim() || user.email?.split('@')[0] || '?'
  const parts = raw.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0]![0]! + parts[1]![0]!).toUpperCase()
  }
  return raw.slice(0, 2).toUpperCase()
}

function NavbarAvatar({ user }: { user: AuthUser }) {
  const url = user.avatar_url
  const initials = initialsFromUser(user)
  return (
    <span className={s.avatarChip}>
      {url ? (
        <img src={url} alt="" className={s.avatarImg} />
      ) : (
        <span className={s.avatarFallback}>{initials}</span>
      )}
    </span>
  )
}

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

      <div className={s.navRight}>
        <div className={s.linkRow}>
          <ul className={s.links}>
            {!user ? (
              <li>
                <NavLink to="/#features" className={s.link}>
                  Features
                </NavLink>
              </li>
            ) : null}
            <li>
              <NavLink
                to="/recipes"
                end={false}
                className={({ isActive }) => cn(s.link, isActive && s.linkActive)}
              >
                Recipe Vault
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/origin-stories"
                className={({ isActive }) => cn(s.link, isActive && s.linkActive)}
              >
                Origin Stories
              </NavLink>
            </li>
          </ul>
          {user ? (
            <ul className={s.linksTail}>
              <PersonalNavDropdown />
              <li>
                <button type="button" onClick={logout} className={s.cta}>
                  Sign Out
                </button>
              </li>
            </ul>
          ) : (
            <ul className={s.linksTail}>
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
            </ul>
          )}
        </div>

        {user ? (
          <Link to="/profile" className={s.avatarLink} aria-label="My Profile">
            <NavbarAvatar user={user} />
          </Link>
        ) : null}
      </div>
    </nav>
  )
}
