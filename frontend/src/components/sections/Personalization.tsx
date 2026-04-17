import { Link } from 'react-router-dom'
import { useScrollReveal } from '@/hooks/useScrollReveal'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'
import s from './Personalization.module.scss'

const BOTTLES = [
  { emoji: '✦', label: 'Bourbon', active: true },
  { emoji: '🍸', label: 'Dry Gin', active: true },
  { emoji: '🌿', label: 'Campari', active: true },
  { emoji: '🍋', label: 'Limoncello', active: false },
  { emoji: '🍊', label: 'Triple Sec', active: true },
  { emoji: '🌶️', label: 'Mezcal', active: false },
  { emoji: '🫧', label: 'Vermouth', active: true },
  { emoji: '🍹', label: 'Rum', active: false },
]

const PERKS = [
  'Log every bottle in your home bar — spirits, liqueurs, bitters, and mixers',
  'Get personalised recipe recommendations based on what you actually have',
  'Save your favourite recipes and build personal collections',
  'Create and share your own recipes with the community',
  "Track what you've tried and discover what to explore next",
]

export function Personalization() {
  const { ref: textRef, visible: textVisible } = useScrollReveal()
  const { ref: mockupRef, visible: mockupVisible } = useScrollReveal()

  return (
    <section id="personal" className={s.section}>
      <div className={s.inner}>
        <div
          ref={textRef as React.RefObject<HTMLDivElement>}
          className={cn(s.text, textVisible && s.textVisible)}
        >
          <span className={s.label}>Your Personal Bar</span>
          <h2 className={s.title}>
            Cocktails Tailored<br />
            <em>To Your Cabinet</em>
          </h2>

          <div className={s.divider}>
            <span className={s.dividerStar}>✦</span>
            <div className={s.dividerLine} />
          </div>

          <p className={s.body}>
            Tell us what's on your shelf and we'll tell you what to pour.
            The Distillist learns your palate, tracks your collection,
            and suggests what to make next — whether you're entertaining
            guests or perfecting a quiet Friday night ritual.
          </p>

          <ul className={s.perksList}>
            {PERKS.map((perk) => (
              <li key={perk} className={s.perkItem}>
                <span className={s.perkDot} />
                {perk}
              </li>
            ))}
          </ul>

          <Link to="/signup">
            <Button variant="primary">Sign up free</Button>
          </Link>
        </div>

        <div
          ref={mockupRef as React.RefObject<HTMLDivElement>}
          className={cn(s.mockup, s.mockupReveal, mockupVisible && s.mockupVisible)}
        >
          <div className={s.mockupHeader}>
            <div className={s.mockupDot} style={{ background: '#5c1a0e' }} />
            <div className={s.mockupDot} style={{ background: '#8a6e30' }} />
            <div className={s.mockupDot} style={{ background: '#3a6e30' }} />
            <span className={s.mockupTitle}>My Cabinet</span>
          </div>

          <div className={s.bottleGrid}>
            {BOTTLES.map((bottle) => (
              <div
                key={bottle.label}
                className={cn(s.bottleItem, bottle.active && s.bottleActive)}
              >
                {bottle.emoji}
                <span className={s.bottleLabel}>{bottle.label}</span>
              </div>
            ))}
          </div>

          <div className={s.rec}>
            <p className={s.recLabel}>✦ Recommended for you tonight</p>
            <p className={s.recTitle}>The Negroni — you have everything</p>
          </div>
        </div>
      </div>
    </section>
  )
}
