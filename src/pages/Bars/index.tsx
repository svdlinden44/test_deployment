import s from './Bars.module.scss'

export function Bars() {
  return (
    <div className={s.page}>
      <div className={s.inner}>
        <span className={s.label}>Bar Finder</span>
        <h2 className={s.title}>
          The World's Finest Bars<br />
          <em>Coming Soon</em>
        </h2>
        <p className={s.sub}>
          500+ hand-curated bar profiles from speakeasies to legendary hotel bars.
          Every city. Every continent. Always with you.
        </p>
        <div className={s.grid}>
          {['New York', 'London', 'Tokyo', 'Paris', 'Barcelona', 'Sydney'].map((city) => (
            <div key={city} className={s.placeholder}>
              {city}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
