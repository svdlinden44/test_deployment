import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement>

const common: IconProps = {
  width: 18,
  height: 18,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.65,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

/** Saved / favorites — heart (warm gold via parent color). */
export function IconHeartNav(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M12 20.5s-7.25-5.15-7.25-10.25A4.25 4.25 0 0 1 12 6.8a4.25 4.25 0 0 1 7.25 3.45c0 5.1-7.25 10.25-7.25 10.25Z" />
    </svg>
  )
}

/** Wishlist — list + bullets (distinct from favorites). */
export function IconListNav(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <circle cx="6.25" cy="8" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="6.25" cy="12" r="1.25" fill="currentColor" stroke="none" />
      <circle cx="6.25" cy="16" r="1.25" fill="currentColor" stroke="none" />
      <path d="M10 8h11M10 12h11M10 16h8" />
    </svg>
  )
}

/** Your recipes — journal / recipe card. */
export function IconJournalNav(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M8 4h10a2 2 0 0 1 2 2v14H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M8 4v16" opacity={0.45} />
      <path d="M11 9h6M11 12.5h4.5" opacity={0.75} strokeWidth={1.35} />
    </svg>
  )
}

/** Cabinet — bottle silhouette. */
export function IconBottleNav(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <path d="M11 3h2v2l1.5 2.5v3a4 4 0 0 1-8 0v-3L8 5V3Z" />
      <path d="M9 21h6v-4a3 3 0 0 1-6 0v4Z" opacity={0.9} />
    </svg>
  )
}

/** Profile — user outline. */
export function IconUserNav(props: IconProps) {
  return (
    <svg {...common} {...props}>
      <circle cx="12" cy="9.5" r="3.25" />
      <path d="M6 19.25c0-3.2 2.65-5 6-5s6 1.8 6 5" />
    </svg>
  )
}
