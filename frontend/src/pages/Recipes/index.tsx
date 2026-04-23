import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { RecipeCard } from '@/components/recipes/RecipeCard'
import rc from '@/components/recipes/RecipeCard.module.scss'
import { RecipeFavoriteButton } from '@/components/recipes/RecipeFavoriteButton'
import { RecipeWishlistButton } from '@/components/recipes/RecipeWishlistButton'
import { useAuth } from '@/contexts/AuthContext'
import { getCategories, getRecipes, searchIngredients } from '@/lib/api/endpoints'
import type { CategoryDto, RecipeFilters, RecipeListItem, IngredientMini } from '@/lib/api/types'
import { ApiError } from '@/lib/api/types'
import { ALCOHOL_OPTIONS, DIFFICULTY_OPTIONS, GLASS_OPTIONS } from '@/pages/Recipes/recipeMeta'
import { LogoSpinner } from '@/components/ui/LogoSpinner'
import { cn } from '@/lib/utils'
import s from './Recipes.module.scss'

type IngPick = { slug: string; name: string }

type InitialFilters = {
  search: string
  category: string
  difficulty: string
  glass: string
  alcoholic: '' | '1' | '0'
  ingredientMatch: 'any' | 'all'
  ingredientSlugs: string[]
}

function readsParams(sp: URLSearchParams): InitialFilters {
  const alc = sp.get('alcoholic')
  const ingredients = sp.getAll('ingredient').filter(Boolean)
  const match = sp.get('ingredient_match')
  return {
    search: sp.get('search') ?? '',
    category: sp.get('category') ?? '',
    difficulty: sp.get('difficulty') ?? '',
    glass: sp.get('glass') ?? '',
    alcoholic:
      alc === '1' || alc === '0' ? (alc as '1' | '0') : ('' as ''),
    ingredientMatch: match === 'all' ? 'all' : 'any',
    ingredientSlugs: ingredients,
  }
}

const PER_PAGE = 24

export function Recipes() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = useMemo(() => readsParams(searchParams), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [search, setSearch] = useState(initial.search)
  const [category, setCategory] = useState(initial.category)
  const [difficulty, setDifficulty] = useState(initial.difficulty)
  const [glass, setGlass] = useState(initial.glass)
  const [alcoholic, setAlcoholic] = useState(initial.alcoholic)
  const [ingredientMatch, setIngredientMatch] = useState<'any' | 'all'>(initial.ingredientMatch)

  const [categories, setCategories] = useState<CategoryDto[]>([])
  const [selectedIngredients, setSelectedIngredients] = useState<IngPick[]>([])
  const [ingSearch, setIngSearch] = useState('')
  const [ingSuggestions, setIngSuggestions] = useState<IngredientMini[]>([])
  const [recipes, setRecipes] = useState<RecipeListItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const sentinelRef = useRef<HTMLDivElement>(null)
  const filterEpoch = useRef(0)
  const loadingMoreGuard = useRef(false)
  const nextFetchRef = useRef(1)
  const hasMoreRef = useRef(false)

  useEffect(() => {
    hasMoreRef.current = hasMore
  }, [hasMore])

  const hydrated = useRef(false)

  const apiFilters = useMemo((): Omit<RecipeFilters, 'page' | 'per_page'> => {
    return {
      search: search.trim() || undefined,
      category: category || undefined,
      difficulty: difficulty || undefined,
      glass: glass || undefined,
      alcoholic: alcoholic || undefined,
      ingredient: selectedIngredients.map((i) => i.slug),
      ingredient_match: ingredientMatch,
    }
  }, [search, category, difficulty, glass, alcoholic, selectedIngredients, ingredientMatch])

  /** Hydrate ingredient chips from URL */
  useEffect(() => {
    if (hydrated.current) return
    hydrated.current = true
    if (!initial.ingredientSlugs.length) return
    let cancelled = false
    ;(async () => {
      const picks: IngPick[] = []
      for (const slug of initial.ingredientSlugs) {
        try {
          const res = await searchIngredients(slug, 1)
          const hit =
            res.results.find((r) => r.slug === slug) ??
            res.results.find((r) => r.slug.includes(slug))
          if (hit) picks.push({ slug: hit.slug, name: hit.name })
          else picks.push({ slug, name: slug })
        } catch {
          picks.push({ slug, name: slug })
        }
      }
      if (!cancelled) setSelectedIngredients(picks)
    })()
    return () => {
      cancelled = true
    }
  }, [initial.ingredientSlugs])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const list = await getCategories()
        if (!cancelled) setCategories(list)
      } catch {
        if (!cancelled) setCategories([])
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const syncUrl = useCallback(() => {
    const p = new URLSearchParams()
    if (search.trim()) p.set('search', search.trim())
    if (category) p.set('category', category)
    if (difficulty) p.set('difficulty', difficulty)
    if (glass) p.set('glass', glass)
    if (alcoholic) p.set('alcoholic', alcoholic)
    if (ingredientMatch === 'all') p.set('ingredient_match', 'all')
    selectedIngredients.forEach((i) => p.append('ingredient', i.slug))
    setSearchParams(p, { replace: true })
  }, [search, category, difficulty, glass, alcoholic, ingredientMatch, selectedIngredients, setSearchParams])

  useEffect(() => {
    syncUrl()
  }, [syncUrl])

  /** Initial / filter-changed fetch (page 1 only) */
  useEffect(() => {
    const epoch = ++filterEpoch.current
    let cancelled = false

    ;(async () => {
      setLoadingInitial(true)
      setError(null)
      setRecipes([])
      setHasMore(false)
      hasMoreRef.current = false
      nextFetchRef.current = 1
      try {
        const res = await getRecipes(
          { ...apiFilters, page: 1, per_page: PER_PAGE },
          { auth: !!user },
        )
        if (cancelled || epoch !== filterEpoch.current) return
        setRecipes(res.results)
        setTotalCount(res.count)
        const more = Boolean(res.next)
        setHasMore(more)
        hasMoreRef.current = more
        nextFetchRef.current = more ? 2 : 1
      } catch (e) {
        if (cancelled || epoch !== filterEpoch.current) return
        setRecipes([])
        setTotalCount(0)
        setHasMore(false)
        hasMoreRef.current = false
        setError(e instanceof ApiError ? e.message : 'Could not load recipes.')
      } finally {
        if (!cancelled && epoch === filterEpoch.current) setLoadingInitial(false)
      }
    })()

    return () => {
      cancelled = true
    }
  }, [apiFilters, user])

  const loadMore = useCallback(async () => {
    if (!hasMoreRef.current || loadingInitial || loadingMoreGuard.current) return

    const page = nextFetchRef.current
    if (page < 2) return

    loadingMoreGuard.current = true
    setLoadingMore(true)
    setError(null)
    try {
      const res = await getRecipes(
        { ...apiFilters, page, per_page: PER_PAGE },
        { auth: !!user },
      )
      setRecipes((prev) => [...prev, ...res.results])
      setTotalCount(res.count)
      const more = Boolean(res.next)
      setHasMore(more)
      hasMoreRef.current = more
      nextFetchRef.current = more ? page + 1 : page
    } catch (e) {
      setHasMore(false)
      hasMoreRef.current = false
      setError(e instanceof ApiError ? e.message : 'Could not load more recipes.')
    } finally {
      setLoadingMore(false)
      loadingMoreGuard.current = false
    }
  }, [apiFilters, loadingInitial, user])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el) return

    const obs = new IntersectionObserver(
      (entries) => {
        const hit = entries.some((e) => e.isIntersecting)
        if (hit) void loadMore()
      },
      { root: null, rootMargin: '240px', threshold: 0 },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [loadMore])

  /* Ingredient typeahead */
  useEffect(() => {
    const q = ingSearch.trim()
    if (q.length < 2) {
      setIngSuggestions([])
      return
    }
    const t = window.setTimeout(() => {
      searchIngredients(q, 1)
        .then((res) => setIngSuggestions(res.results.slice(0, 12)))
        .catch(() => setIngSuggestions([]))
    }, 280)
    return () => window.clearTimeout(t)
  }, [ingSearch])

  function addIngredient(ing: IngredientMini) {
    if (selectedIngredients.some((x) => x.slug === ing.slug)) return
    setSelectedIngredients((prev) => [...prev, { slug: ing.slug, name: ing.name }])
    setIngSearch('')
    setIngSuggestions([])
  }

  function removeIngredient(slug: string) {
    setSelectedIngredients((prev) => prev.filter((i) => i.slug !== slug))
  }

  function updateRecipeFlags(id: number, patch: Partial<RecipeListItem>) {
    setRecipes((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  function clearFilters() {
    setSearch('')
    setCategory('')
    setDifficulty('')
    setGlass('')
    setAlcoholic('')
    setIngredientMatch('any')
    setSelectedIngredients([])
  }

  return (
    <div className={s.page}>
      <div className={s.hero}>
        <span className={s.label}>Recipe Vault</span>
        <h1 className={s.title}>The Classics &amp; Beyond</h1>
        <p className={s.sub}>Browse recipes from our vault — refine by spirit, glass, ingredients, and more.</p>
      </div>

      <div className={s.stack}>
        <section className={s.filtersBar} aria-label="Recipe filters">
          <div className={s.filterPrimary}>
            <div className={`${s.field} ${s.fieldGrow}`}>
              <label htmlFor="rec-search">Search</label>
              <input
                id="rec-search"
                className={s.input}
                value={search}
                placeholder="Name or description…"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={s.clearWrap}>
              <button type="button" className={s.clearBtn} onClick={clearFilters}>
                Clear filters
              </button>
            </div>
          </div>

          <div className={s.filterDims} role="group" aria-label="Recipe attributes">
            <div className={s.field}>
              <label htmlFor="rec-cat">Category</label>
              <select
                id="rec-cat"
                className={cn(s.select, !category && s.selectUnset)}
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Any category</option>
                {categories.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                    {typeof c.recipe_count === 'number' ? ` (${c.recipe_count})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <div className={s.field}>
              <label htmlFor="rec-diff">Difficulty</label>
              <select
                id="rec-diff"
                className={cn(s.select, !difficulty && s.selectUnset)}
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
              >
                {DIFFICULTY_OPTIONS.map((o) => (
                  <option key={o.label + o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={s.field}>
              <label htmlFor="rec-glass">Glass</label>
              <select
                id="rec-glass"
                className={cn(s.select, !glass && s.selectUnset)}
                value={glass}
                onChange={(e) => setGlass(e.target.value)}
              >
                {GLASS_OPTIONS.map((o) => (
                  <option key={o.label + o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className={s.field}>
              <label htmlFor="rec-alc">Style</label>
              <select
                id="rec-alc"
                className={cn(s.select, !alcoholic && s.selectUnset)}
                value={alcoholic}
                onChange={(e) => setAlcoholic(e.target.value as typeof alcoholic)}
              >
                {ALCOHOL_OPTIONS.map((o) => (
                  <option key={o.label + o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className={s.filterIngredients}>
            <div className={`${s.field} ${s.fieldGrow}`}>
              <label htmlFor="rec-ing">Ingredients</label>
              <input
                id="rec-ing"
                className={s.input}
                value={ingSearch}
                placeholder="Type 2+ letters to search…"
                onChange={(e) => setIngSearch(e.target.value)}
                aria-label="Search ingredients by name"
              />
              {ingSuggestions.length > 0 && (
                <ul className={s.suggest}>
                  {ingSuggestions.map((ing) => (
                    <li key={ing.id}>
                      <button type="button" className={s.suggestBtn} onClick={() => addIngredient(ing)}>
                        {ing.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {selectedIngredients.length > 0 && (
                <div className={s.chips}>
                  {selectedIngredients.map((ing) => (
                    <button
                      key={ing.slug}
                      type="button"
                      className={s.chip}
                      onClick={() => removeIngredient(ing.slug)}
                      title="Remove"
                    >
                      {ing.name} ×
                    </button>
                  ))}
                </div>
              )}
              {selectedIngredients.length >= 2 && (
                <label className={s.toggle}>
                  <input
                    type="checkbox"
                    checked={ingredientMatch === 'all'}
                    onChange={(e) => setIngredientMatch(e.target.checked ? 'all' : 'any')}
                  />
                  Match <strong>all</strong> selected ingredients
                </label>
              )}
            </div>
          </div>
        </section>

        <div className={s.main}>
          <p className={s.meta} role="status">
            {loadingInitial ? 'Loading…' : `${totalCount} recipe${totalCount === 1 ? '' : 's'}`}
          </p>
          {error && <p className={s.err}>{error}</p>}

          {!loadingInitial && !error && recipes.length === 0 && (
            <p className={s.empty}>No recipes match these filters.</p>
          )}

          <ul className={rc.grid}>
            {recipes.map((r) => (
              <li key={r.id}>
                <RecipeCard
                  recipe={r}
                  actions={
                    user ? (
                      <>
                        <RecipeFavoriteButton
                          slug={r.slug}
                          isFavorited={!!r.is_favorited}
                          onChange={(next) => updateRecipeFlags(r.id, { is_favorited: next })}
                          className={rc.cardFavorite}
                          small
                        />
                        <RecipeWishlistButton
                          slug={r.slug}
                          isWishlisted={!!r.is_wishlisted}
                          onChange={(next) => updateRecipeFlags(r.id, { is_wishlisted: next })}
                          className={rc.cardWish}
                          small
                        />
                      </>
                    ) : undefined
                  }
                />
              </li>
            ))}
          </ul>

          {/* Sentinel + load-more spinner */}
          <div ref={sentinelRef} className={rc.sentinel} aria-hidden />
          {loadingMore && <LogoSpinner />}
          {!hasMore && recipes.length > 0 && !loadingInitial && (
            <p className={rc.endHint}>You&apos;ve reached the end of the list.</p>
          )}
        </div>
      </div>
    </div>
  )
}
