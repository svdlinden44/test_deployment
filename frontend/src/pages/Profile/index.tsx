import { useAuth } from '@/contexts/AuthContext'
import { useCabinetStore } from '@/store/cabinetStore'
import { cn } from '@/lib/utils'
import s from './Profile.module.scss'

export function Profile() {
  const { user } = useAuth()
  const { bottles, toggleBottle } = useCabinetStore()
  const activeBottles = bottles.filter((b) => b.active)

  return (
    <div className={s.page}>
      <div className={s.inner}>
        <div className={s.header}>
          <span className={s.label}>Your Profile</span>
          <h1 className={s.heading}>
            Welcome, <em>{user?.name}</em>
          </h1>
          <p className={s.email}>{user?.email}</p>
        </div>

        <div className={s.cabinet}>
          <div className={s.cabinetHeader}>
            <h2 className={s.cabinetTitle}>My Cabinet</h2>
            <span className={s.cabinetCount}>
              {activeBottles.length} of {bottles.length} bottles active
            </span>
          </div>

          <div className={s.bottleGrid}>
            {bottles.map((bottle) => (
              <button
                key={bottle.id}
                onClick={() => toggleBottle(bottle.id)}
                className={cn(s.bottleBtn, bottle.active && s.bottleActive)}
              >
                <span className={s.bottleEmoji}>{bottle.emoji}</span>
                <span className={s.bottleName}>{bottle.name}</span>
                <span className={s.bottleCategory}>{bottle.category}</span>
              </button>
            ))}
          </div>

          {activeBottles.length >= 3 && (
            <div className={s.rec}>
              <p className={s.recLabel}>✦ Recommended for you tonight</p>
              <p className={s.recTitle}>
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

        <p className={s.hint}>
          Toggle bottles to update your cabinet. Changes are saved automatically.
        </p>
      </div>
    </div>
  )
}
