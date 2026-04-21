import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { RecipeFavoriteButton } from '@/components/recipes/RecipeFavoriteButton'
import { RecipeWishlistButton } from '@/components/recipes/RecipeWishlistButton'
import { RecipeRatingInput } from '@/components/recipes/RecipeRatingInput'
import { getRecipeBySlug } from '@/lib/api/endpoints'
import type { RecipeDetail as RecipeDetailType } from '@/lib/api/types'
import { ApiError } from '@/lib/api/types'
import { DIFFICULTY_OPTIONS, GLASS_OPTIONS } from '@/pages/Recipes/recipeMeta'
import s from './RecipeDetail.module.scss'

function humanUnit(u: string): string {
  if (!u) return ''
  const map: Record<string, string> = {
    oz: 'oz',
    ml: 'ml',
    cl: 'cl',
    dash: 'dash',
    drop: 'drop',
    tsp: 'tsp',
    tbsp: 'tbsp',
    cup: 'cup',
    piece: 'piece',
    slice: 'slice',
    sprig: 'sprig',
    wedge: 'wedge',
    whole: 'whole',
    barspoon: 'barspoon',
    rinse: 'rinse',
    top: 'top',
    to_taste: 'to taste',
  }
  return map[u] ?? u
}

function formatIngredientLine(row: RecipeDetailType['ingredients'][number]): string {
  const parts = [
    row.quantity?.trim(),
    row.unit ? humanUnit(row.unit) : '',
    row.ingredient_name,
  ].filter(Boolean)
  let line = parts.join(' ')
  if (row.notes?.trim()) line += ` (${row.notes.trim()})`
  return line
}

export function RecipeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const [recipe, setRecipe] = useState<RecipeDetailType | null>(null)
  const [favorite, setFavorite] = useState(false)
  const [wishlist, setWishlist] = useState(false)
  const [myRating, setMyRating] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!slug) return
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await getRecipeBySlug(slug)
        if (!cancelled) {
          setRecipe(data)
          setFavorite(!!data.is_favorited)
          setWishlist(!!data.is_wishlisted)
          setMyRating(data.my_rating ?? null)
        }
      } catch (e) {
        if (!cancelled) {
          setRecipe(null)
          setError(e instanceof ApiError ? e.message : 'Recipe not found.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [slug])

  const diffLabel = DIFFICULTY_OPTIONS.find((o) => o.value === recipe?.difficulty)?.label
  const glassLabel = GLASS_OPTIONS.find((o) => o.value === recipe?.glass_type)?.label

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <Link to="/recipes" className={s.back}>
          ← Back to Recipe Vault
        </Link>

        {loading && <p className={s.muted}>Loading…</p>}
        {error && <p className={s.err}>{error}</p>}

        {recipe && (
          <>
            <header className={s.header}>
              {recipe.image_url && (
                <div className={s.heroImg}>
                  <div className={s.heroImgSubject}>
                    <img src={recipe.image_url} alt="" />
                  </div>
                </div>
              )}
              <div className={s.titleBlock}>
                <h1 className={s.title}>{recipe.title}</h1>
                <div className={s.actionRow}>
                  <RecipeFavoriteButton
                    slug={recipe.slug}
                    isFavorited={favorite}
                    onChange={setFavorite}
                    className={s.favBtn}
                  />
                  <RecipeWishlistButton
                    slug={recipe.slug}
                    isWishlisted={wishlist}
                    onChange={setWishlist}
                    className={s.wishBtn}
                  />
                </div>
                <RecipeRatingInput
                  slug={recipe.slug}
                  value={myRating}
                  averageRating={recipe.average_rating}
                  ratingCount={recipe.rating_count}
                  onChange={(detail) => {
                    setMyRating(detail.myRating)
                    setRecipe((prev) =>
                      prev && prev.slug === recipe.slug
                        ? {
                            ...prev,
                            my_rating: detail.myRating,
                            average_rating: detail.averageRating,
                            rating_count: detail.ratingCount,
                          }
                        : prev,
                    )
                  }}
                />
              </div>
              <p className={s.lede}>{recipe.description}</p>
              <ul className={s.meta}>
                {recipe.category && <li>{recipe.category.name}</li>}
                {diffLabel && diffLabel !== 'Any difficulty' && <li>{diffLabel}</li>}
                {glassLabel && glassLabel !== 'Any glass' && <li>{glassLabel}</li>}
                <li>{recipe.is_alcoholic ? 'Alcoholic' : 'Non-alcoholic'}</li>
                <li>{recipe.prep_time_minutes} min</li>
              </ul>
            </header>

            <section className={s.section} aria-labelledby="ing-heading">
              <h2 id="ing-heading" className={s.h2}>
                Ingredients
              </h2>
              <ul className={s.ingList}>
                {recipe.ingredients.map((row, i) => (
                  <li key={`${row.ingredient_slug}-${i}`}>{formatIngredientLine(row)}</li>
                ))}
              </ul>
            </section>

            <section className={s.section} aria-labelledby="inst-heading">
              <h2 id="inst-heading" className={s.h2}>
                Preparation
              </h2>
              <div className={s.prose}>
                {recipe.instructions.split(/\n+/).map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>
            </section>

            {recipe.history?.trim() && (
              <section className={s.section} aria-labelledby="hist-heading">
                <h2 id="hist-heading" className={s.h2}>
                  History
                </h2>
                <div className={s.prose}>
                  {recipe.history.split(/\n+/).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  )
}
