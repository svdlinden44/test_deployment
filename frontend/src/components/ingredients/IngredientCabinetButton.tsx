import { useCallback, useState } from 'react'
import { addCabinetIngredient, removeCabinetIngredient } from '@/lib/api/endpoints'
import { ApiError } from '@/lib/api/types'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'
import s from '@/components/recipes/RecipeFavoriteButton.module.scss'

type Props = {
  slug: string
  inCabinet: boolean
  onChange?: (inCabinet: boolean) => void
  className?: string
  small?: boolean
}

export function IngredientCabinetButton({
  slug,
  inCabinet,
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
      const next = !inCabinet
      try {
        if (next) {
          await addCabinetIngredient(slug)
        } else {
          await removeCabinetIngredient(slug)
        }
        onChange?.(next)
      } catch (err) {
        console.warn(err instanceof ApiError ? err.message : err)
      } finally {
        setLoading(false)
      }
    },
    [user, loading, slug, inCabinet, onChange],
  )

  if (!user) return null

  return (
    <button
      type="button"
      className={cn(s.btn, small && s.small, inCabinet && s.active, className)}
      onClick={toggle}
      disabled={loading}
      aria-pressed={inCabinet}
      aria-label={inCabinet ? 'Remove from my cabinet' : 'Add to my cabinet'}
      title={inCabinet ? 'Remove from my cabinet' : 'Add to my cabinet'}
    >
      <span aria-hidden>{inCabinet ? '✓' : '+'}</span>
    </button>
  )
}
