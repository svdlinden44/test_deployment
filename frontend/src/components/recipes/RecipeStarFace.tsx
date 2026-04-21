import { cn } from '@/lib/utils'
import { STAR_PATH, STAR_VB } from '@/components/recipes/recipeStarsShared'
import s from './RecipeStarFace.module.scss'

type Props = {
  fill01: number
  clipId: string
  sizePx: number
  variant?: 'interactive' | 'readonly' | 'mini'
}

export function RecipeStarFace({ fill01, clipId, sizePx, variant = 'readonly' }: Props) {
  const w = Math.min(STAR_VB, Math.max(0, fill01 * STAR_VB))

  return (
    <svg
      className={cn(s.face, variant === 'interactive' && s.faceInteractive, variant === 'mini' && s.faceMini)}
      width={sizePx}
      height={sizePx}
      viewBox={`0 0 ${STAR_VB} ${STAR_VB}`}
      overflow="hidden"
      focusable="false"
      aria-hidden
    >
      <defs>
        <clipPath id={clipId}>
          <rect x="0" y="0" width={w} height={STAR_VB} />
        </clipPath>
      </defs>
      <path d={STAR_PATH} className={s.pathDim} vectorEffect="non-scaling-stroke" />
      {fill01 > 0.02 ? (
        <path
          d={STAR_PATH}
          className={cn(s.pathGold, variant === 'mini' && s.pathGoldMini)}
          clipPath={`url(#${clipId})`}
          vectorEffect="non-scaling-stroke"
        />
      ) : null}
    </svg>
  )
}
