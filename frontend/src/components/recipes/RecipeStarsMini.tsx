import { useId } from 'react'
import { RecipeStarFace } from '@/components/recipes/RecipeStarFace'
import { fillForStar, STAR_COUNT } from '@/components/recipes/recipeStarsShared'
import { cn } from '@/lib/utils'
import s from './RecipeStarsMini.module.scss'

const MINI_PX = 14

type Props = {
  averageScore: number
  className?: string
}

/** Read-only tiny stars for cards (no text). */
export function RecipeStarsMini({ averageScore, className }: Props) {
  const reactId = useId().replace(/:/g, '')
  const prefix = `m${reactId}`

  return (
    <div className={cn(s.row, className)} aria-hidden>
      {Array.from({ length: STAR_COUNT }, (_, i) => (
        <span key={i} className={s.slot}>
          <RecipeStarFace
            fill01={fillForStar(averageScore, i)}
            clipId={`${prefix}-${i}`}
            sizePx={MINI_PX}
            variant="mini"
          />
        </span>
      ))}
    </div>
  )
}
