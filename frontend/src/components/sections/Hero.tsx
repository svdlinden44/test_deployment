import { Link } from 'react-router-dom'
import { CinematicLoopVideo } from '@/components/video/CinematicLoopVideo'
import { Button } from '@/components/ui/Button'
import s from './Hero.module.scss'

const HERO_VIDEO_SRC = '/video/hero-high-res-with-sound-v2.mp4'

export function Hero() {
  return (
    <section id="hero" className={s.hero}>
      <CinematicLoopVideo src={HERO_VIDEO_SRC} />

      <div className={s.inner}>
        <p className={s.eyebrow}>
          Est. 2025 &nbsp;·&nbsp; The Art of Fine Cocktails
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
          The Distillist is where cocktail culture comes alive: curated recipes, the stories
          behind every glass, and a personal cabinet built around what you already love.
        </p>

        <div className={s.actions}>
          <Link to="/signup">
            <Button variant="primary">Sign up free</Button>
          </Link>
          <Link to="/recipes">
            <Button variant="ghost">Browse recipes</Button>
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
