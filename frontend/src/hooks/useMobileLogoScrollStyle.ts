import { useLayoutEffect, useState, type CSSProperties } from 'react'

const MOBILE_MQ = '(max-width: 768px)'
/** Scroll distance (px) over which the logo shrinks from expanded → collapsed. */
const SCROLL_RANGE = 96

const H_COLLAPSED = 46
const MW_PX_COLLAPSED = 200
const VW_COLLAPSED = 56

const H_EXPANDED = 66
const MW_PX_EXPANDED = 268
const VW_EXPANDED = 72

function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t
}

function styleForScrollY(scrollY: number): CSSProperties {
  const t = Math.min(1, Math.max(0, scrollY / SCROLL_RANGE))
  const h = lerp(H_EXPANDED, H_COLLAPSED, t)
  const mwPx = lerp(MW_PX_EXPANDED, MW_PX_COLLAPSED, t)
  const vw = lerp(VW_EXPANDED, VW_COLLAPSED, t)
  return {
    height: `${Math.round(h * 10) / 10}px`,
    maxWidth: `min(${Math.round(mwPx)}px, ${Math.round(vw * 10) / 10}vw)`,
  }
}

function initialStyle(): CSSProperties | undefined {
  if (typeof window === 'undefined') return undefined
  const mq = window.matchMedia(MOBILE_MQ)
  if (!mq.matches) return undefined
  return styleForScrollY(window.scrollY)
}

/**
 * Mobile only: scroll-linked logo size — larger at the top, interpolates to the compact bar size
 * while scrolling down, and expands again when scrolling back up.
 */
export function useMobileLogoScrollStyle(): CSSProperties | undefined {
  const [style, setStyle] = useState<CSSProperties | undefined>(initialStyle)

  useLayoutEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ)

    const compute = () => {
      if (!mq.matches) {
        setStyle(undefined)
        return
      }
      setStyle(styleForScrollY(window.scrollY))
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

  return style
}
