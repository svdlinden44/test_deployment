import { CinematicLoopVideo } from '@/components/video/CinematicLoopVideo'
import s from './ComingSoon.module.scss'

const VIDEO_SRC = '/video/cocktail-wide-shot.mp4'

export function ComingSoon() {
  return (
    <div className={s.page}>
      <CinematicLoopVideo src={VIDEO_SRC} />

      <div className={s.content}>
        <img
          src="/images/logo-hero.png"
          alt="The Distillist"
          className={s.heroLogo}
        />

        <h1 className={s.title}>
          Something Exquisite<br />
          <em>Is Being Poured</em>
        </h1>

        <div className={s.goldLine} />

        <p className={s.quote}>
          "The best cocktails are the ones<br />
          worth waiting for."
        </p>

        <div className={s.features}>
          <div className={s.feature}>
            <span className={s.featureIcon}>&#9878;</span>
            <span className={s.featureText}>Thousands of Curated Recipes</span>
          </div>
          <div className={s.divider} />
          <div className={s.feature}>
            <span className={s.featureIcon}>&#9826;</span>
            <span className={s.featureText}>The World's Finest Bars</span>
          </div>
          <div className={s.divider} />
          <div className={s.feature}>
            <span className={s.featureIcon}>&#9733;</span>
            <span className={s.featureText}>Your Personal Cabinet</span>
          </div>
        </div>

        <div className={s.badge}>
          <span className={s.badgeLabel}>Arriving Soon</span>
        </div>

        <p className={s.footnote}>
          Est. 2025 &nbsp;&middot;&nbsp; The Art of Fine Cocktails
        </p>
      </div>
    </div>
  )
}
