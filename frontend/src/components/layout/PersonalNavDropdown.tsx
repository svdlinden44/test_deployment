import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import { PERSONAL_NAV_LINKS } from '@/components/layout/personalNavLinks'
import { cn } from '@/lib/utils'
import s from './PersonalNavDropdown.module.scss'

function accountSectionActive(pathname: string): boolean {
  if (pathname.startsWith('/favorites')) return true
  if (pathname.startsWith('/wishlist')) return true
  if (pathname.startsWith('/my-recipes')) return true
  if (pathname.startsWith('/cabinet')) return true
  if (pathname.startsWith('/profile')) return true
  return false
}

export function PersonalNavDropdown() {
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLLIElement>(null)

  const active = accountSectionActive(pathname)

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  return (
    <li ref={rootRef} className={cn(s.root, open && s.rootOpen, active && s.rootActive)}>
      <button
        type="button"
        className={s.trigger}
        aria-expanded={open}
        aria-haspopup="true"
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
      >
        Account
        <span className={s.chev} aria-hidden>
          ▾
        </span>
      </button>
      <ul className={s.menu} role="menu">
        {PERSONAL_NAV_LINKS.map((item) => {
          const IconComp = item.Icon
          return (
            <li key={item.to} role="none">
              <NavLink
                to={item.to}
                className={({ isActive }) =>
                  cn(s.menuLink, isActive && s.menuLinkActive)
                }
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <IconComp className={s.menuIcon} />
                <span className={s.menuLabel}>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </li>
  )
}
