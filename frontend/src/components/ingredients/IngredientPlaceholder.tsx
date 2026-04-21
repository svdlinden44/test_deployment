import type { IngredientMini } from '@/lib/api/types'
import s from './IngredientPlaceholder.module.scss'

type Props = {
  /** `Ingredient.type` slug from API */
  ingredientType: IngredientMini['type']
}

/** Gold line-art placeholders by ingredient category — stylistically aligned with recipe card coupe. */
export function IngredientPlaceholder({ ingredientType }: Props) {
  const t = ingredientType || 'other'
  return (
    <div className={s.wrap} aria-hidden>
      <svg className={s.svg} viewBox="0 0 88 112" fill="none" xmlns="http://www.w3.org/2000/svg">
        {t === 'spirit' || t === 'liqueur' || t === 'wine' ? (
          <title>Bottle</title>
        ) : t === 'beer' ? (
          <title>Beer glass</title>
        ) : t === 'mixer' || t === 'juice' ? (
          <title>Highball</title>
        ) : t === 'syrup' ? (
          <title>Syrup pour</title>
        ) : t === 'bitter' ? (
          <title>Dropper</title>
        ) : t === 'garnish' ? (
          <title>Leaf</title>
        ) : t === 'dairy' ? (
          <title>Pitcher</title>
        ) : (
          <title>Ingredient</title>
        )}
        {t === 'spirit' || t === 'liqueur' || t === 'wine' ? (
          <>
            <path
              d="M38 18h12l4 12v52c0 8-6 14-14 14s-14-6-14-14V30l4-12Z"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinejoin="round"
            />
            <path d="M34 30h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="44" cy="100" rx="18" ry="5" stroke="currentColor" strokeWidth="2" />
          </>
        ) : t === 'beer' ? (
          <>
            <path
              d="M28 28h32l-2 56H30L28 28Z"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinejoin="round"
            />
            <path d="M60 36h8v16c0 6-4 10-8 10" stroke="currentColor" strokeWidth="2" />
            <path d="M32 44h24" stroke="currentColor" strokeWidth="1.5" opacity={0.45} />
          </>
        ) : t === 'mixer' || t === 'juice' ? (
          <>
            <path
              d="M30 28h28l2 52H28l2-52Z"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinejoin="round"
            />
            <ellipse cx="44" cy="88" rx="16" ry="5" stroke="currentColor" strokeWidth="2" />
            <path d="M36 40h16M36 52h16" stroke="currentColor" strokeWidth="1.25" opacity={0.5} />
          </>
        ) : t === 'syrup' ? (
          <>
            <path
              d="M36 22h16l2 8v58c0 6-5 10-10 10s-10-4-10-10V30l2-8Z"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinejoin="round"
            />
            <path d="M44 22v-8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <path d="M38 44c4 10 12 10 12 22" stroke="currentColor" strokeWidth="1.75" opacity={0.55} />
          </>
        ) : t === 'bitter' ? (
          <>
            <rect
              x="34"
              y="24"
              width="20"
              height="48"
              rx="4"
              stroke="currentColor"
              strokeWidth="2.25"
            />
            <path d="M44 72v28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="44" cy="104" rx="12" ry="4" stroke="currentColor" strokeWidth="1.75" />
            <circle cx="44" cy="40" r="4" stroke="currentColor" strokeWidth="1.75" />
          </>
        ) : t === 'garnish' ? (
          <>
            <path
              d="M44 20c-12 18-22 34-22 52 0 14 10 24 22 24s22-10 22-24c0-18-10-34-22-52Z"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinejoin="round"
            />
            <path d="M44 44v48" stroke="currentColor" strokeWidth="1.75" opacity={0.45} />
          </>
        ) : t === 'dairy' ? (
          <>
            <path
              d="M30 36h28l4 44H26l4-44Z"
              stroke="currentColor"
              strokeWidth="2.25"
              strokeLinejoin="round"
            />
            <path d="M34 36c2-8 8-12 18-12" stroke="currentColor" strokeWidth="2" />
            <ellipse cx="44" cy="88" rx="18" ry="5" stroke="currentColor" strokeWidth="2" />
          </>
        ) : (
          <>
            <circle cx="44" cy="44" r="22" stroke="currentColor" strokeWidth="2.25" />
            <path d="M44 66v36" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            <ellipse cx="44" cy="106" rx="18" ry="5" stroke="currentColor" strokeWidth="2" />
          </>
        )}
      </svg>
    </div>
  )
}
