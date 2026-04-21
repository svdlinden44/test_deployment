import { Link } from 'react-router-dom'
import { useCabinetStore } from '@/store/cabinetStore'
import { cn } from '@/lib/utils'
import p from '@/pages/Profile/Profile.module.scss'

export function Cabinet() {
  const { bottles, toggleBottle } = useCabinetStore()
  const activeBottles = bottles.filter((b) => b.active)

  return (
    <div className={p.page}>
      <div className={p.inner}>
        <header className={p.header}>
          <span className={p.label}>My Cabinet</span>
          <h1 className={p.heading}>
            What&apos;s on your <em>bar</em>
          </h1>
          <p className={p.email}>
            Toggle bottles so we can shape recommendations and pairings around what you pour at home.
          </p>
          <p className={p.fieldHint}>
            Account settings live under{' '}
            <Link to="/profile" className={p.inlineLink}>
              My Profile
            </Link>
            .
          </p>
        </header>

        <div className={p.cabinet}>
          <div className={p.cabinetHeader}>
            <h2 className={p.cabinetTitle}>Bottles</h2>
            <span className={p.cabinetCount}>
              {activeBottles.length} of {bottles.length} bottles active
            </span>
          </div>

          <div className={p.bottleGrid}>
            {bottles.map((bottle) => (
              <button
                key={bottle.id}
                type="button"
                onClick={() => toggleBottle(bottle.id)}
                className={cn(p.bottleBtn, bottle.active && p.bottleActive)}
              >
                <span className={p.bottleEmoji}>{bottle.emoji}</span>
                <span className={p.bottleName}>{bottle.name}</span>
                <span className={p.bottleCategory}>{bottle.category}</span>
              </button>
            ))}
          </div>

          {activeBottles.length >= 3 && (
            <div className={p.rec}>
              <p className={p.recLabel}>✦ Recommended for you tonight</p>
              <p className={p.recTitle}>
                {activeBottles.some((b) => b.id === 'dry-gin') &&
                activeBottles.some((b) => b.id === 'campari') &&
                activeBottles.some((b) => b.id === 'vermouth')
                  ? 'The Negroni — you have everything'
                  : activeBottles.some((b) => b.id === 'bourbon')
                  ? 'Old Fashioned — a classic choice'
                  : `Try something with ${activeBottles[0]?.name}`}
              </p>
            </div>
          )}
        </div>

        <p className={p.hint}>Changes are saved automatically in this browser.</p>
      </div>
    </div>
  )
}
