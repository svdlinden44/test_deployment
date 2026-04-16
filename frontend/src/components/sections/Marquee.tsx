import s from './Marquee.module.scss'

const ITEMS = [
  'Thousands of Recipes',
  'Origin Stories',
  'Bar Finder',
  'Personal Cabinet',
  'Smart Recommendations',
  'Custom Creations',
  'Rare Spirits',
  'Classic Techniques',
]

export function Marquee() {
  const doubled = [...ITEMS, ...ITEMS]

  return (
    <div className={s.section}>
      <div className={s.track}>
        {doubled.map((item, i) => (
          <div key={i} className={s.item}>
            {item}
          </div>
        ))}
      </div>
    </div>
  )
}
