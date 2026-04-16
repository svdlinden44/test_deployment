import s from './Cocktails.module.scss'

export function Cocktails() {
  return (
    <div className={s.page}>
      <div className={s.inner}>
        <span className={s.label}>Recipe Vault</span>
        <h2 className={s.title}>
          The Classics &amp; Beyond<br />
          <em>Coming Soon</em>
        </h2>
        <p className={s.sub}>
          Thousands of meticulously curated recipes are on their way.
          Join the waitlist to be the first to explore them.
        </p>
        <div className={s.grid}>
          {['Negroni', 'Old Fashioned', 'Dry Martini', 'Daiquiri', 'Mojito', 'Espresso Martini'].map((name) => (
            <div key={name} className={s.placeholder}>
              {name}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
