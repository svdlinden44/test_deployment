import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import s from './Hero.module.scss'

export function Hero() {
  return (
    <section id="hero" className={s.hero}>
      <div className={s.rays} />

      <span className={`${s.deco} ${s.deco1}`}>🍸</span>
      <span className={`${s.deco} ${s.deco2}`}>🥃</span>

      <div className={s.inner}>
        <p className={s.eyebrow}>
          Coming Soon &nbsp;·&nbsp; Est. 2025 &nbsp;·&nbsp; The Art of Fine Cocktails
        </p>

        <h1 className={s.title}>
          Every Sip Has<br />
          <em>A Story</em>
        </h1>

        <div className={s.goldLine} />

        <p className={s.subtitle}>
          "A great cocktail is nothing less than alchemy —<br />
          the transformation of the ordinary into the extraordinary."
        </p>

        <p className={s.desc}>
          The Distillist is where cocktail culture comes alive. Thousands of curated recipes,
          the origin stories behind every glass, the world's finest bars at your fingertips,
          and a personal cabinet built around what you already love.
        </p>

        <div className={s.actions}>
          <Link to="/#waitlist">
            <Button variant="primary">Reserve Your Seat</Button>
          </Link>
          <Link to="/#features">
            <Button variant="ghost">Explore the Vision</Button>
          </Link>
        </div>
      </div>

      <div className={s.scrollHint}>
        <span className={s.scrollLabel}>Scroll</span>
        <div className={s.scrollArrow} />
      </div>
    </section>
  )
}
