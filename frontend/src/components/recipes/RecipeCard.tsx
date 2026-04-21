import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { RecipeListItem } from '@/lib/api/types'
import { RecipeStarsMini } from '@/components/recipes/RecipeStarsMini'
import { RecipeCardPlaceholder } from '@/components/recipes/RecipeCardPlaceholder'
import s from './RecipeCard.module.scss'

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

  return (
    <div className={s.cardOuter}>
      <Link className={s.card} to={`/recipes/${recipe.slug}`}>
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
          <h2 className={s.cardTitle}>{recipe.title}</h2>
          <p className={s.cardDesc}>{recipe.description}</p>
          <span className={s.cardMeta}>
            {recipe.category?.name ?? 'Uncategorized'}
            {recipe.is_alcoholic ? '' : ' · Alcohol-free'}
          </span>
        </div>
      </Link>
    </div>
  )
}
