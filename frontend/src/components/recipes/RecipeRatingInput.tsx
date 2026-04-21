import { useCallback, useId, useMemo, useRef, useState } from 'react'
import { deleteRecipeRating, upsertRecipeRating } from '@/lib/api/endpoints'
import type { RatingMutationResponse } from '@/lib/api/types'
import { ApiError } from '@/lib/api/types'
import { useAuth } from '@/contexts/AuthContext'
import { RecipeStarFace } from '@/components/recipes/RecipeStarFace'
import { fillForStar, STAR_COUNT } from '@/components/recipes/recipeStarsShared'
import { cn } from '@/lib/utils'
import s from './RecipeRatingInput.module.scss'

const STAR_SLOT_PX = 32

function snapScore(left: boolean, star1Based: number): number {
  if (left) return star1Based
  return star1Based < STAR_COUNT ? star1Based + 0.5 : STAR_COUNT
}

/** Pointer X vs this slot’s geometry — matches painted star (no ghost hit layers). */
function scoreFromPointerInSlot(
  clientX: number,
  slotEl: HTMLElement | null,
  starIndex0: number,
): number | null {
  if (!slotEl || starIndex0 < 0 || starIndex0 >= STAR_COUNT) return null
  const r = slotEl.getBoundingClientRect()
  if (clientX < r.left || clientX > r.right) return null
  const mid = r.left + r.width / 2
  return snapScore(clientX < mid, starIndex0 + 1)
}

function CommunityStars({ score, idPrefix }: { score: number; idPrefix: string }) {
  return (
    <div className={s.starRow} aria-hidden>
      {Array.from({ length: STAR_COUNT }, (_, i) => (
        <span key={i} className={s.starSlotStatic}>
          <RecipeStarFace
            fill01={fillForStar(score, i)}
            clipId={`${idPrefix}-c-${i}`}
            sizePx={STAR_SLOT_PX}
          />
        </span>
      ))}
    </div>
  )
}

export type RecipeRatingChangeDetail = {
  myRating: number | null
  averageRating: number | null
  ratingCount: number
}

type Props = {
  slug: string
  value: number | null | undefined
  averageRating?: number | null
  ratingCount?: number
  onChange?: (detail: RecipeRatingChangeDetail) => void
}

export function RecipeRatingInput({ slug, value, averageRating, ratingCount, onChange }: Props) {
  const { user } = useAuth()
  const reactId = useId().replace(/:/g, '')
  const idPrefix = useMemo(() => `r${reactId}`, [reactId])

  const slotRefs = useRef<(HTMLButtonElement | null)[]>([])
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState('')
  const [hoverScore, setHoverScore] = useState<number | null>(null)

  const previewScore = hoverScore ?? value ?? null

  const mergeResponse = useCallback(
    (myRating: number | null, payload: RatingMutationResponse) => {
      onChange?.({
        myRating,
        averageRating: payload.average_rating,
        ratingCount: payload.rating_count,
      })
    },
    [onChange],
  )

  const applyHoverFromClientX = useCallback((clientX: number) => {
    for (let i = 0; i < STAR_COUNT; i++) {
      const el = slotRefs.current[i]
      const s0 = scoreFromPointerInSlot(clientX, el, i)
      if (s0 != null) {
        setHoverScore(s0)
        return
      }
    }
    setHoverScore(null)
  }, [])

  const setRating = useCallback(
    async (score: number | null) => {
      if (!user) return
      setErr('')
      setLoading(true)
      try {
        if (score === null) {
          const payload = await deleteRecipeRating(slug)
          mergeResponse(null, payload)
        } else {
          const payload = await upsertRecipeRating(slug, score)
          mergeResponse(score, payload)
        }
      } catch (e) {
        setErr(e instanceof ApiError ? e.message : 'Could not save rating.')
      } finally {
        setLoading(false)
      }
    },
    [user, slug, mergeResponse],
  )

  const avgForStars = useMemo(() => {
    if (averageRating == null || Number.isNaN(averageRating)) return null
    const n = Number(averageRating)
    if (n < 1 || n > 5) return null
    return n
  }, [averageRating])

  const showCommunity =
    avgForStars != null && ratingCount != null && ratingCount > 0 && !Number.isNaN(avgForStars)

  if (!user) return null

  return (
    <div className={s.wrap}>
      <div className={s.toolbar}>
        <p className={s.label}>Your rating</p>
        {value != null && (
          <button
            type="button"
            className={s.clearIcon}
            disabled={loading}
            onClick={() => void setRating(null)}
            aria-label="Clear my rating"
            title="Clear rating"
          >
            <span aria-hidden className={s.clearX}>
              ×
            </span>
          </button>
        )}
      </div>

      <div
        className={s.starRowWrap}
        onPointerLeave={() => setHoverScore(null)}
        role="group"
        aria-label="Rate from 1 to 5 stars in half-star steps"
      >
        <div
          className={cn(s.starRow, s.starRowInteractive)}
          onPointerMove={(e) => applyHoverFromClientX(e.clientX)}
        >
          {Array.from({ length: STAR_COUNT }, (_, i) => {
            const star = i + 1
            const fill01 =
              previewScore != null ? fillForStar(previewScore, i) : 0
            return (
              <button
                key={`rating-star-${star}`}
                type="button"
                ref={(el) => {
                  slotRefs.current[i] = el
                }}
                className={s.starSlotBtn}
                disabled={loading}
                aria-label={`${star} stars`}
                onClick={(e) => {
                  const picked = scoreFromPointerInSlot(e.clientX, e.currentTarget, i)
                  if (picked != null) void setRating(picked)
                }}
              >
                <RecipeStarFace
                  fill01={fill01}
                  clipId={`${idPrefix}-i-${i}`}
                  sizePx={STAR_SLOT_PX}
                  variant="interactive"
                />
              </button>
            )
          })}
        </div>
      </div>

      {showCommunity ? (
        <div className={s.community}>
          <span className={s.communityLabel}>Community</span>
          <CommunityStars score={avgForStars} idPrefix={`${idPrefix}-co`} />
          <span className={s.srOnly}>
            Average {avgForStars?.toFixed(2)}, {ratingCount} ratings
          </span>
        </div>
      ) : null}

      {err ? <p className={s.err}>{err}</p> : null}
    </div>
  )
}
