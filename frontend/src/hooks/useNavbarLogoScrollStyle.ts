import { useLayoutEffect, useState, type CSSProperties } from 'react'

const MOBILE_MQ = '(max-width: 768px)'
/** Scroll distance (px) over which logo + bar settle from expanded → compact. */
const SCROLL_RANGE = 96

type Dim = { h: number; mwPx: number; vw: number }

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function scrollT(y: number) {
  return Math.min(1, Math.max(0, y / SCROLL_RANGE))
}

function logoDims(isMobile: boolean): { expanded: Dim; collapsed: Dim } {
  if (isMobile) {
    return {
      expanded: { h: 66, mwPx: 268, vw: 72 },
      collapsed: { h: 46, mwPx: 200, vw: 56 },
    }
  }
  return {
    expanded: { h: 64, mwPx: 280, vw: 44 },
    collapsed: { h: 52, mwPx: 220, vw: 42 },
  }
}

function logoStyle(scrollY: number, isMobile: boolean): CSSProperties {
  const t = scrollT(scrollY)
  const { expanded: e, collapsed: c } = logoDims(isMobile)
  const h = lerp(e.h, c.h, t)
  const mwPx = lerp(e.mwPx, c.mwPx, t)
  const vw = lerp(e.vw, c.vw, t)
  return {
    height: `${Math.round(h * 10) / 10}px`,
    maxWidth: `min(${Math.round(mwPx)}px, ${Math.round(vw * 10) / 10}vw)`,
  }
}

/** Glass bar: stays see-through; opacity rises slightly as you scroll for readability. */
function navShellStyle(scrollY: number, isMobile: boolean): CSSProperties {
  const t = scrollT(scrollY)
  const padY = lerp(isMobile ? 1.15 : 1.55, isMobile ? 0.78 : 1.0, t)
  const bgA = lerp(0.28, 0.52, t)
  const edgeA = lerp(0.12, 0.22, t)
  return {
    paddingTop: `${padY}rem`,
    paddingBottom: `${padY}rem`,
    backgroundColor: `rgba(8, 5, 3, ${bgA})`,
    backdropFilter: 'blur(14px)',
    WebkitBackdropFilter: 'blur(14px)',
    borderBottomColor: `rgba(201, 168, 76, ${edgeA})`,
  }
}

/** Profile avatar — same scroll span / easing as logo (grow at top, shrink while scrolling). */
function avatarStyleFromScroll(scrollY: number, isMobile: boolean): CSSProperties {
  const t = scrollT(scrollY)
  const px = isMobile ? lerp(48, 34, t) : lerp(46, 36, t)
  const rounded = Math.round(px * 10) / 10
  const s = `${rounded}px`
  return {
    width: s,
    height: s,
    minWidth: s,
    minHeight: s,
  }
}

function initialStyles(): { logo: CSSProperties; nav: CSSProperties; avatar: CSSProperties } {
  if (typeof window === 'undefined') {
    return { logo: {}, nav: {}, avatar: {} }
  }
  const isMobile = window.matchMedia(MOBILE_MQ).matches
  const y = window.scrollY
  return {
    logo: logoStyle(y, isMobile),
    nav: navShellStyle(y, isMobile),
    avatar: avatarStyleFromScroll(y, isMobile),
  }
}

/**
 * Scroll-linked navbar: logo + avatar size + translucent glass shell on all breakpoints.
 */
export function useNavbarLogoScrollStyle(): {
  logoStyle: CSSProperties
  navShellStyle: CSSProperties
  avatarChipStyle: CSSProperties
} {
  const [styles, setStyles] = useState(initialStyles)

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)

    const compute = () => {
      const isMobile = mq.matches
      const y = window.scrollY
      setStyles({
        logo: logoStyle(y, isMobile),
        nav: navShellStyle(y, isMobile),
        avatar: avatarStyleFromScroll(y, isMobile),
      })
    }

    compute()
    window.addEventListener('scroll', compute, { passive: true })
    window.addEventListener('resize', compute, { passive: true })
    mq.addEventListener('change', compute)
    return () => {
      window.removeEventListener('scroll', compute)
      window.removeEventListener('resize', compute)
      mq.removeEventListener('change', compute)
    }
  }, [])

  return {
    logoStyle: styles.logo,
    navShellStyle: styles.nav,
    avatarChipStyle: styles.avatar,
  }
}
