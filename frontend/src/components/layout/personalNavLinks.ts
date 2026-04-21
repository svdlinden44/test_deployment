import type { ComponentType } from 'react'
import {
  IconBottleNav,
  IconHeartNav,
  IconJournalNav,
  IconListNav,
  IconUserNav,
} from '@/components/layout/PersonalMenuIcons'
import dropdownStyles from './PersonalNavDropdown.module.scss'

export type PersonalNavLinkDef = {
  to: string
  label: string
  Icon: ComponentType<{ className?: string }>
  iconClass: string
}

export const PERSONAL_NAV_LINKS: readonly PersonalNavLinkDef[] = [
  {
    to: '/favorites',
    label: 'Favorites',
    Icon: IconHeartNav,
    iconClass: dropdownStyles.iconFavorites,
  },
  {
    to: '/wishlist',
    label: 'Wishlist',
    Icon: IconListNav,
    iconClass: dropdownStyles.iconWishlist,
  },
  {
    to: '/my-recipes',
    label: 'My Recipes',
    Icon: IconJournalNav,
    iconClass: dropdownStyles.iconRecipes,
  },
  {
    to: '/cabinet',
    label: 'My Cabinet',
    Icon: IconBottleNav,
    iconClass: dropdownStyles.iconCabinet,
  },
  {
    to: '/profile',
    label: 'My Profile',
    Icon: IconUserNav,
    iconClass: dropdownStyles.iconProfile,
  },
] as const
