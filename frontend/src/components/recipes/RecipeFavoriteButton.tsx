import { useCallback, useState } from 'react'
import { addRecipeFavorite, removeRecipeFavorite } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/types'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import s from './RecipeFavoriteButton.module.scss'

type Props = {
  slug: string
  isFavorited: boolean
  onChange?: (favorited: boolean) => void
  className?: string
  small?: boolean
}

export function RecipeFavoriteButton({
  slug,
  isFavorited,
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
      const next = !isFavorited
      try {
        if (next) {
          await addRecipeFavorite(slug)
        } else {
          await removeRecipeFavorite(slug)
        }
        onChange?.(next)
      } catch (err) {
        console.warn(err instanceof ApiError ? err.message : err)
      } finally {
        setLoading(false)
      }
    },
    [user, loading, slug, isFavorited, onChange],
  )

  if (!user) return null

  return (
    <button
      type="button"
      className={cn(s.btn, small && s.small, isFavorited && s.active, className)}
      onClick={toggle}
      disabled={loading}
      aria-pressed={isFavorited}
      aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
      title={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
    >
      <span aria-hidden>{isFavorited ? '♥' : '♡'}</span>
    </button>
  )
}
