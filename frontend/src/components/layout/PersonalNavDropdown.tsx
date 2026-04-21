import { useEffect, useRef, useState } from 'react'
import type { ComponentType } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  IconBottleNav,
  IconHeartNav,
  IconJournalNav,
  IconListNav,
  IconUserNav,
} from '@/components/layout/PersonalMenuIcons'
import { cn } from '@/lib/utils'
import s from './PersonalNavDropdown.module.scss'

type LinkDef = {
  to: string
  label: string
  Icon: ComponentType<{ className?: string }>
  iconClass: string
}

const LINKS: readonly LinkDef[] = [
  { to: '/favorites', label: 'Favorites', Icon: IconHeartNav, iconClass: s.iconFavorites },
  { to: '/wishlist', label: 'Wishlist', Icon: IconListNav, iconClass: s.iconWishlist },
  { to: '/my-recipes', label: 'My Recipes', Icon: IconJournalNav, iconClass: s.iconRecipes },
  { to: '/cabinet', label: 'My Cabinet', Icon: IconBottleNav, iconClass: s.iconCabinet },
  { to: '/profile', label: 'My Profile', Icon: IconUserNav, iconClass: s.iconProfile },
] as const

function personalSectionActive(pathname: string): boolean {
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

  const active = personalSectionActive(pathname)

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
        onClick={() => setOpen((v) => !v)}
      >
        Personal
        <span className={s.chev} aria-hidden>
          ▾
        </span>
      </button>
      <ul className={s.menu} role="menu">
        {LINKS.map((item) => {
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
                <IconComp className={cn(s.menuIcon, item.iconClass)} />
                <span className={s.menuLabel}>{item.label}</span>
              </NavLink>
            </li>
          )
        })}
      </ul>
    </li>
  )
}
