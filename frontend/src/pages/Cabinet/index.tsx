import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import rc from '@/components/recipes/RecipeCard.module.scss'
import { IngredientCard } from '@/components/ingredients/IngredientCard'
import { LogoSpinner } from '@/components/ui/LogoSpinner'
import { getMyCabinetIngredients } from '@/lib/api/endpoints'
import type { IngredientBrowseItem } from '@/lib/api/types'
import { ApiError } from '@/lib/api/types'
import p from '@/pages/Profile/Profile.module.scss'

const PER_PAGE = 48

export function Cabinet() {
  const [items, setItems] = useState<IngredientBrowseItem[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loadingInitial, setLoadingInitial] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
        const res = await getMyCabinetIngredients(1, PER_PAGE)
        if (cancelled) return
        setItems(res.results.map((r) => ({ ...r, is_in_cabinet: true })))
        setTotalCount(res.count)
        const more = Boolean(res.next)
        setHasMore(more)
        hasMoreRef.current = more
        nextFetchRef.current = more ? 2 : 1
      } catch (e) {
        if (!cancelled) {
          setItems([])
          setTotalCount(0)
          setError(e instanceof ApiError ? e.message : 'Could not load your cabinet.')
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
      const res = await getMyCabinetIngredients(page, PER_PAGE)
      setItems((prev) => [...prev, ...res.results.map((r) => ({ ...r, is_in_cabinet: true }))])
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
  }, [loadingInitial])

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
    if (!inCabinet) {
      setItems((prev) => prev.filter((it) => it.slug !== slug))
      setTotalCount((c) => Math.max(0, c - 1))
    }
  }, [])

  return (
    <div className={p.page}>
      <div className={p.inner}>
        <header className={p.header}>
          <span className={p.label}>My Cabinet</span>
          <h1 className={p.heading}>
            What&apos;s on your <em>bar</em>
          </h1>
          <p className={p.email}>
            Ingredients you save from the{' '}
            <Link to="/ingredients" className={p.inlineLink}>
              Ingredient Library
            </Link>{' '}
            appear here — remove with the check control on each card.
          </p>
          <p className={p.fieldHint}>
            Account settings live under{' '}
            <Link to="/profile" className={p.inlineLink}>
              My Profile
            </Link>
            .
          </p>
        </header>

        {loadingInitial ? (
          <LogoSpinner label="Loading cabinet" />
        ) : error ? (
          <p className={p.email}>{error}</p>
        ) : items.length === 0 ? (
          <p className={p.email}>
            Your cabinet is empty. Browse the{' '}
            <Link to="/ingredients" className={p.inlineLink}>
              Ingredient Library
            </Link>{' '}
            and tap <strong>+</strong> on bottles you keep at home.
          </p>
        ) : (
          <>
            <p className={p.email} style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
              {totalCount === 1 ? '1 ingredient saved' : `${totalCount} ingredients saved`}
            </p>
            <ul className={rc.grid}>
              {items.map((item) => (
                <li key={item.id}>
                  <IngredientCard item={item} onCabinetChange={onCabinetChange} />
                </li>
              ))}
            </ul>
            <div ref={sentinelRef} className={rc.sentinel} aria-hidden />
            {loadingMore ? <LogoSpinner label="Loading more" /> : null}
            {!hasMore && items.length > 0 ? (
              <p className={rc.endHint}>That&apos;s everything in your cabinet.</p>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
