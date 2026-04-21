import { useCallback, useState } from 'react'
import { addWishlistItem, removeWishlistItem } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/types'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import s from './RecipeWishlistButton.module.scss'

function WishlistListIcon({ active }: { active: boolean }) {
  return (
    <svg className={s.icon} viewBox="0 0 24 24" aria-hidden focusable="false">
      {/* Bullets */}
      <circle cx="6" cy="7" r="1.35" className={cn(s.dot, active && s.dotActive)} />
      <circle cx="6" cy="12" r="1.35" className={cn(s.dot, active && s.dotActive)} />
      <circle cx="6" cy="17" r="1.35" className={cn(s.dot, active && s.dotActive)} />
      {/* Lines — “saved for later” list */}
      <path
        className={s.lines}
        d="M10 7h11M10 12h11M10 17h8"
        fill="none"
        strokeLinecap="round"
        strokeWidth="1.85"
      />
    </svg>
  )
}

type Props = {
  slug: string
  isWishlisted: boolean
  onChange?: (wishlisted: boolean) => void
  className?: string
  small?: boolean
}

export function RecipeWishlistButton({
  slug,
  isWishlisted,
  onChange,
  className,
  small,
}: Props) {
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)

  const toggle = useCallback(
    async (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (!user || loading) return
      setLoading(true)
      const next = !isWishlisted
      try {
        if (next) {
          await addWishlistItem(slug)
        } else {
          await removeWishlistItem(slug)
        }
        onChange?.(next)
      } catch (err) {
        console.warn(err instanceof ApiError ? err.message : err)
      } finally {
        setLoading(false)
      }
    },
    [user, loading, slug, isWishlisted, onChange],
  )

  if (!user) return null

  return (
    <button
      type="button"
      className={cn(s.btn, small && s.small, isWishlisted && s.active, className)}
      onClick={toggle}
      disabled={loading}
      aria-pressed={isWishlisted}
      aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
      title={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
    >
      <WishlistListIcon active={isWishlisted} />
    </button>
  )
}
