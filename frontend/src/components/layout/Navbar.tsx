import { useEffect, useId, useRef, useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { PersonalNavDropdown } from '@/components/layout/PersonalNavDropdown'
import { PERSONAL_NAV_LINKS } from '@/components/layout/personalNavLinks'
import { useMobileLogoScrollStyle } from '@/hooks/useMobileLogoScrollStyle'
import { useScrolledNav } from '@/hooks/useScrolledNav'
import { useAuth } from '@/contexts/AuthContext'
import type { AuthUser } from '@/lib/api/types'
import { cn } from '@/lib/utils'
import pnd from './PersonalNavDropdown.module.scss'
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
  const mobileLogoStyle = useMobileLogoScrollStyle()
  const { user, logout } = useAuth()
  const location = useLocation()
  const [menuOpen, setMenuOpen] = useState(false)
  const drawerId = useId()
  const closeBtnRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    setMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!menuOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [menuOpen])

  return (
    <nav className={cn(s.nav, scrolled && s.scrolled)}>
      <Link to="/" className={s.logo}>
        <img
          src="/images/logo-banner.png"
          alt="The Distillist"
          className={cn(s.logoImg, mobileLogoStyle && s.logoImgDynamic)}
          style={mobileLogoStyle}
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
                to="/ingredients"
                className={({ isActive }) => cn(s.link, isActive && s.linkActive)}
              >
                Ingredient Library
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

        <button
          type="button"
          className={s.menuToggle}
          aria-expanded={menuOpen}
          aria-controls={drawerId}
          aria-label={menuOpen ? 'Close menu' : 'Open menu'}
          onClick={() => setMenuOpen((o) => !o)}
        >
          <span className={s.menuToggleBar} aria-hidden />
          <span className={s.menuToggleBar} aria-hidden />
          <span className={s.menuToggleBar} aria-hidden />
        </button>
      </div>

      {menuOpen ? (
        <div className={s.drawerRoot}>
          <button
            type="button"
            className={s.drawerBackdrop}
            aria-label="Close menu"
            onClick={() => setMenuOpen(false)}
          />
          <aside
            id={drawerId}
            className={s.drawerPanel}
            role="dialog"
            aria-modal="true"
            aria-label="Site navigation"
          >
            <div className={s.drawerHeader}>
              <span className={s.drawerTitle}>Menu</span>
              <button
                ref={closeBtnRef}
                type="button"
                className={s.drawerClose}
                aria-label="Close menu"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>
            </div>
            <nav className={s.drawerNav} aria-label="Main">
              <ul className={s.drawerList}>
                {!user ? (
                  <li>
                    <NavLink
                      to="/#features"
                      className={({ isActive }) =>
                        cn(s.drawerLink, isActive && s.drawerLinkActive)
                      }
                      onClick={() => setMenuOpen(false)}
                    >
                      Features
                    </NavLink>
                  </li>
                ) : null}
                <li>
                  <NavLink
                    to="/recipes"
                    end={false}
                    className={({ isActive }) =>
                      cn(s.drawerLink, isActive && s.drawerLinkActive)
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    Recipe Vault
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/ingredients"
                    className={({ isActive }) =>
                      cn(s.drawerLink, isActive && s.drawerLinkActive)
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    Ingredient Library
                  </NavLink>
                </li>
                <li>
                  <NavLink
                    to="/origin-stories"
                    className={({ isActive }) =>
                      cn(s.drawerLink, isActive && s.drawerLinkActive)
                    }
                    onClick={() => setMenuOpen(false)}
                  >
                    Origin Stories
                  </NavLink>
                </li>
                {user ? (
                  <>
                    <li>
                      <span className={s.drawerSectionLabel}>Personal</span>
                    </li>
                    {PERSONAL_NAV_LINKS.map((item) => {
                      const IconComp = item.Icon
                      return (
                        <li key={item.to}>
                          <NavLink
                            to={item.to}
                            className={({ isActive }) =>
                              cn(pnd.menuLink, isActive && pnd.menuLinkActive)
                            }
                            onClick={() => setMenuOpen(false)}
                          >
                            <IconComp className={cn(pnd.menuIcon, item.iconClass)} />
                            <span className={pnd.menuLabel}>{item.label}</span>
                          </NavLink>
                        </li>
                      )
                    })}
                    <li className={s.drawerDivider} role="presentation" />
                    <li>
                      <button
                        type="button"
                        className={s.drawerButton}
                        onClick={() => {
                          setMenuOpen(false)
                          logout()
                        }}
                      >
                        Sign Out
                      </button>
                    </li>
                  </>
                ) : (
                  <>
                    <li className={s.drawerDivider} role="presentation" />
                    <li>
                      <NavLink
                        to="/signup"
                        className={({ isActive }) =>
                          cn(s.drawerLink, isActive && s.drawerLinkActive)
                        }
                        onClick={() => setMenuOpen(false)}
                      >
                        Join
                      </NavLink>
                    </li>
                    <li>
                      <NavLink
                        to="/login"
                        className={({ isActive }) =>
                          cn(s.drawerLink, s.drawerLinkCta, isActive && s.drawerLinkActive)
                        }
                        onClick={() => setMenuOpen(false)}
                      >
                        Log in
                      </NavLink>
                    </li>
                  </>
                )}
              </ul>
            </nav>
          </aside>
        </div>
      ) : null}
    </nav>
  )
}
