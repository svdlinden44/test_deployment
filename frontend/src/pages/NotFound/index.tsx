import { Link } from 'react-router-dom'
import { useEffect } from 'react'
import s from './NotFound.module.scss'

export function NotFound() {
  useEffect(() => {
    document.title = 'Lost at the bar — The Distillist'
  }, [])

  return (
    <div className={s.page}>
      <img src="/images/logo-hero.png" alt="The Distillist" className={s.heroLogo} />

      <p className={s.code}>404 — Page not found</p>
      <h1 className={s.title}>
        This round <em>wasn’t on the menu</em>
      </h1>
      <div className={s.goldLine} role="presentation" />
      <p className={s.body}>
        The bartender’s been from St. Helens to Singapore, but this particular URL? Never heard of
        it. Maybe a typo, maybe a drink that’s still in the recipe vault.
      </p>
      <p className={s.punch}>
        (We checked under the citrus. We checked behind the amari. It’s not there.)
      </p>
      <Link to="/" className={s.homeLink}>
        Back to the home bar
      </Link>
    </div>
  )
}
