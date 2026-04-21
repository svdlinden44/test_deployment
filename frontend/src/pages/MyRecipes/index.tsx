import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import rc from '@/components/recipes/RecipeCard.module.scss'
import { RecipeFavoriteButton } from '@/components/recipes/RecipeFavoriteButton'
import { RecipeWishlistButton } from '@/components/recipes/RecipeWishlistButton'
import { LogoSpinner } from '@/components/ui/LogoSpinner'
import { getMemberRecipes } from '@/lib/api/endpoints'
import type { RecipeListItem } from '@/lib/api/types'
import { ApiError } from '@/lib/api/types'
import s from './MyRecipes.module.scss'

const PER_PAGE = 24

export function MyRecipes() {
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const loadingMoreGuard = useRef(false)
  const nextFetchRef = useRef(1)
  const hasMoreRef = useRef(false)

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoadingInitial(true)
      setError(null)
      try {
        const res = await getMemberRecipes(1, PER_PAGE)
        if (cancelled) return
        setRecipes(res.results)
        setTotalCount(res.count)
        const more = Boolean(res.next)
        setHasMore(more)
        hasMoreRef.current = more
        nextFetchRef.current = more ? 2 : 1
      } catch (e) {
        if (!cancelled) {
          setRecipes([])
          setTotalCount(0)
          setError(e instanceof ApiError ? e.message : 'Could not load your recipes.')
        }
      } finally {
        if (!cancelled) setLoadingInitial(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || loadingInitial || loadingMoreGuard.current) return
    const page = nextFetchRef.current
    if (page < 2) return
    loadingMoreGuard.current = true
    setLoadingMore(true)
    try {
      const res = await getMemberRecipes(page, PER_PAGE)
      setRecipes((prev) => [...prev, ...res.results])
      const more = Boolean(res.next)
      setHasMore(more)
      hasMoreRef.current = more
      nextFetchRef.current = more ? page + 1 : page
    } catch {
      setHasMore(false)
      hasMoreRef.current = false
    } finally {
      setLoadingMore(false)
      loadingMoreGuard.current = false
    }
  }, [loadingInitial])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) void loadMore()
      },
      { rootMargin: '240px', threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  function patchRecipe(id: number, patch: Partial<RecipeListItem>) {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <span className={s.label}>Personal</span>
        <h1 className={s.title}>My Recipes</h1>
        <p className={s.sub}>
          Recipes you authored — private by default; sharing controls will land later.
        </p>
        <p className={s.heroActions}>
          <Link to="/my-recipes/new" className={s.heroLink}>
            Create a recipe
          </Link>
        </p>
      </div>

      <div className={s.main}>
        <p className={s.meta} role="status">
          {loadingInitial ? 'Loading…' : `${totalCount} recipe${totalCount === 1 ? '' : 's'}`}
        </p>
        {error ? <p className={s.err}>{error}</p> : null}

        {!loadingInitial && !error && recipes.length === 0 && (
          <p className={s.empty}>
            You haven&apos;t created a recipe yet.{' '}
            <Link to="/my-recipes/new">Write your first</Link>
            {' · '}
            or browse the <Link to="/recipes">Recipe Vault</Link> for inspiration.
          </p>
        )}

        <ul className={rc.grid}>
          {recipes.map((r) => (
            <li key={r.id}>
              <RecipeCard
                recipe={r}
                actions={
                  <>
                    <RecipeFavoriteButton
                      slug={r.slug}
                      isFavorited={!!r.is_favorited}
                      onChange={(next) => patchRecipe(r.id, { is_favorited: next })}
                      className={rc.cardFavorite}
                      small
                    />
                    <RecipeWishlistButton
                      slug={r.slug}
                      isWishlisted={!!r.is_wishlisted}
                      onChange={(next) => patchRecipe(r.id, { is_wishlisted: next })}
                      className={rc.cardWish}
                      small
                    />
                  </>
                }
              />
            </li>
          ))}
        </ul>

        <div ref={sentinelRef} className={rc.sentinel} aria-hidden />
        {loadingMore ? <LogoSpinner /> : null}
        {!hasMore && recipes.length > 0 && !loadingInitial ? (
          <p className={rc.endHint}>You&apos;ve reached the end of your list.</p>
        ) : null}
      </div>
    </div>
  )
}
