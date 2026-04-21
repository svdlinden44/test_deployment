import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import rc from '@/components/recipes/RecipeCard.module.scss'
import { IngredientCard } from '@/components/ingredients/IngredientCard'
import { LogoSpinner } from '@/components/ui/LogoSpinner'
import { useAuth } from '@/contexts/AuthContext'
import { getIngredients } from '@/lib/api/endpoints'
import type { IngredientBrowseItem } from '@/lib/api/types'
import { ApiError } from '@/lib/api/types'
import { INGREDIENT_TYPE_OPTIONS } from '@/pages/Ingredients/ingredientMeta'
import vault from '@/pages/Recipes/Recipes.module.scss'

const PER_PAGE = 24

function readParams(sp: URLSearchParams) {
  return {
    search: sp.get('search') ?? '',
    type: sp.get('type') ?? '',
  }
}

export function IngredientsExplore() {
  const { user } = useAuth()
  const [searchParams, setSearchParams] = useSearchParams()
  const initial = useMemo(() => readParams(searchParams), []) // eslint-disable-line react-hooks/exhaustive-deps

  const [search, setSearch] = useState(initial.search)
  const [typeFilter, setTypeFilter] = useState(initial.type)
  const [items, setItems] = useState<IngredientBrowseItem[]>([])
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

  const apiFilters = useMemo(
    () => ({
      search: search.trim() || undefined,
      type: typeFilter || undefined,
    }),
    [search, typeFilter],
  )

  const syncUrl = useCallback(() => {
    const p = new URLSearchParams()
    if (search.trim()) p.set('search', search.trim())
    if (typeFilter) p.set('type', typeFilter)
    setSearchParams(p, { replace: true })
  }, [search, typeFilter, setSearchParams])

  useEffect(() => {
    syncUrl()
  }, [syncUrl])

  useEffect(() => {
    const epoch = ++filterEpoch.current
    let cancelled = false

    ;(async () => {
      setLoadingInitial(true)
      setError(null)
      setItems([])
      setHasMore(false)
      hasMoreRef.current = false
      nextFetchRef.current = 1
      try {
        const res = await getIngredients({ ...apiFilters, page: 1, per_page: PER_PAGE }, { auth: !!user })
        if (cancelled || epoch !== filterEpoch.current) return
        setItems(res.results)
        setTotalCount(res.count)
        const more = Boolean(res.next)
        setHasMore(more)
        hasMoreRef.current = more
        nextFetchRef.current = more ? 2 : 1
      } catch (e) {
        if (cancelled || epoch !== filterEpoch.current) return
        setItems([])
        setTotalCount(0)
        setHasMore(false)
        hasMoreRef.current = false
        setError(e instanceof ApiError ? e.message : 'Could not load ingredients.')
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
    try {
      const res = await getIngredients({ ...apiFilters, page, per_page: PER_PAGE }, { auth: !!user })
      setItems((prev) => [...prev, ...res.results])
      setTotalCount(res.count)
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

  const onCabinetChange = useCallback((slug: string, inCabinet: boolean) => {
    setItems((prev) =>
      prev.map((it) => (it.slug === slug ? { ...it, is_in_cabinet: inCabinet } : it)),
    )
  }, [])

  return (
    <div className={vault.page}>
      <div className={vault.hero}>
        <span className={vault.label}>Ingredient Library</span>
        <h1 className={vault.title}>Spirits, Syrups &amp; Garnishes</h1>
        <p className={vault.sub}>
          Explore everything in our catalog — filter by name and type, then save bottles to{' '}
          <strong>My Cabinet</strong>.
        </p>
      </div>

      <div className={vault.stack}>
        <section className={vault.filtersBar} aria-label="Ingredient filters">
          <div className={vault.filtersRow}>
            <div className={`${vault.field} ${vault.fieldGrow}`}>
              <label htmlFor="ing-search">Search</label>
              <input
                id="ing-search"
                className={vault.input}
                value={search}
                placeholder="Name…"
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className={vault.field}>
              <label htmlFor="ing-type">Type</label>
              <select
                id="ing-type"
                className={vault.select}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              >
                {INGREDIENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value || 'all'} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </section>

        <div className={vault.main}>
          <p className={vault.meta} role="status">
            {loadingInitial ? 'Loading…' : `${totalCount} ingredient${totalCount === 1 ? '' : 's'}`}
          </p>
          {error ? <p className={vault.err}>{error}</p> : null}

          {!loadingInitial && !error && items.length === 0 ? (
            <p className={vault.empty}>No ingredients match those filters.</p>
          ) : null}

          <ul className={rc.grid}>
            {items.map((item) => (
              <li key={item.id}>
                <IngredientCard item={item} onCabinetChange={onCabinetChange} />
              </li>
            ))}
          </ul>

          <div ref={sentinelRef} className={rc.sentinel} aria-hidden />
          {loadingMore ? <LogoSpinner label="Loading more" /> : null}
          {!hasMore && items.length > 0 && !loadingInitial ? (
            <p className={rc.endHint}>You&apos;ve reached the end of the list.</p>
          ) : null}
        </div>
      </div>
    </div>
  )
}
