import type { ComponentType } from 'react'
import {
  IconBottleNav,
  IconHeartNav,
  IconJournalNav,
  IconListNav,
  IconUserNav,
} from '@/components/layout/PersonalMenuIcons'

export type PersonalNavLinkDef = {
  to: string
  label: string
  Icon: ComponentType<{ className?: string }>
}

export const PERSONAL_NAV_LINKS: readonly PersonalNavLinkDef[] = [
  {
    to: '/favorites',
    label: 'Favorites',
    Icon: IconHeartNav,
  },
  {
    to: '/wishlist',
    label: 'Wishlist',
    Icon: IconListNav,
  },
  {
    to: '/my-recipes',
    label: 'My Recipes',
    Icon: IconJournalNav,
  },
  {
    to: '/cabinet',
    label: 'My Cabinet',
    Icon: IconBottleNav,
  },
  {
    to: '/profile',
    label: 'My Profile',
    Icon: IconUserNav,
  },
] as const
