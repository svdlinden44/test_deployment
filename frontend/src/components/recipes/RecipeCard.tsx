import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { RecipeCardIngredientLine, RecipeListItem } from '@/lib/api/types'
import { RecipeStarsMini } from '@/components/recipes/RecipeStarsMini'
import { RecipeCardPlaceholder } from '@/components/recipes/RecipeCardPlaceholder'
import s from './RecipeCard.module.scss'

/** Spirits + liqueurs on the left column; everything else on the right. */
const SPIRIT_TYPES = new Set(['spirit', 'liqueur'])

function partitionCardIngredients(lines: RecipeCardIngredientLine[] | undefined) {
  const spirits: string[] = []
  const others: string[] = []
  if (!lines?.length) return { spirits, others }
  const ordered = [...lines].sort((a, b) => a.sort_order - b.sort_order)
  const seenSpirit = new Set<string>()
  const seenOther = new Set<string>()
  for (const row of ordered) {
    const name = row.ingredient_name.trim()
    if (!name) continue
    const isSpirit = SPIRIT_TYPES.has(row.ingredient_type)
    const bucket = isSpirit ? spirits : others
    const seen = isSpirit ? seenSpirit : seenOther
    const key = name.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    bucket.push(name)
  }
  return { spirits, others }
}

export type RecipeCardProps = {
  recipe: RecipeListItem
  /** Favorite + wishlist controls (rendered in top-right). */
  actions?: ReactNode
  /** Show vault-style community stars when ratings exist (default true). */
  showCommunityStars?: boolean
}

export function RecipeCard({
  recipe,
  actions,
  showCommunityStars = true,
}: RecipeCardProps) {
  const showStars =
    showCommunityStars &&
    typeof recipe.average_rating === 'number' &&
    !Number.isNaN(recipe.average_rating) &&
    (recipe.rating_count ?? 0) > 0

  const hasToolbar = Boolean(actions) || showStars
  const { spirits, others } = partitionCardIngredients(recipe.ingredients)
  const showIngredients = spirits.length > 0 || others.length > 0

  return (
    <div className={s.cardOuter}>
      <Link className={s.card} to={`/recipes/${recipe.slug}`}>
        <div className={s.cardHeader}>
          <h2 className={s.cardTitle}>{recipe.title}</h2>
        </div>
        <div className={s.cardImgWrap}>
          <div className={s.cardImgSubject}>
            {recipe.image_url ? (
              <img src={recipe.image_url} alt="" className={s.cardImg} />
            ) : (
              <RecipeCardPlaceholder />
            )}
          </div>
        </div>
        {hasToolbar ? (
          <div className={s.cardToolbar}>
            <div className={s.cardToolbarLeft}>
              {showStars ? (
                <RecipeStarsMini averageScore={recipe.average_rating!} className={s.cardToolbarStars} />
              ) : null}
            </div>
            {actions ? <div className={s.cardToolbarActions}>{actions}</div> : null}
          </div>
        ) : null}
        <div className={s.cardBody}>
          <p className={s.cardDesc}>{recipe.description}</p>
          <span className={s.cardMeta}>
            {recipe.category?.name ?? 'Uncategorized'}
            {recipe.is_alcoholic ? '' : ' · Alcohol-free'}
          </span>
          {showIngredients ? (
            <div className={s.cardIngredients} aria-label="Ingredients">
              <div className={s.cardIngredientCol}>
                <ul className={s.cardIngredientList}>
                  {spirits.map((name) => (
                    <li key={`s-${name}`}>{name}</li>
                  ))}
                </ul>
              </div>
              <div className={s.cardIngredientCol}>
                <ul className={s.cardIngredientList}>
                  {others.map((name) => (
                    <li key={`o-${name}`}>{name}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : null}
        </div>
      </Link>
    </div>
  )
}
