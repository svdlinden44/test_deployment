import s from './OriginStories.module.scss'

export function OriginStories() {
  return (
    <div className={s.page}>
      <div className={s.inner}>
        <header className={s.hero}>
          <span className={s.label}>Origin Stories</span>
          <h1 className={s.title}>Where legend meets the glass</h1>
          <p className={s.lead}>
            Soon: essays on the drinks, bars, and personalities that shaped cocktail culture — from the
            first printed recipes to the modern revival.
          </p>
        </header>

        <section className={s.section}>
          <h2 className={s.h2}>Coming next</h2>
          <ul className={s.list}>
            <li>
              <strong className={s.topic}>Classic foundations</strong>
              <span className={s.blurb}>Old Fashioned, Manhattan, Martini — how three templates defined a century.</span>
            </li>
            <li>
              <strong className={s.topic}>Lost &amp; rediscovered</strong>
              <span className={s.blurb}>Forgotten specs from hotel bars and Prohibition-era ingenuity.</span>
            </li>
            <li>
              <strong className={s.topic}>People &amp; places</strong>
              <span className={s.blurb}>The bartenders and rooms that bent the arc of taste.</span>
            </li>
          </ul>
          <p className={s.note}>We&apos;re drafting these pieces now. Check back after the next release.</p>
        </section>
      </div>
    </div>
  )
}
