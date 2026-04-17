import { useScrollReveal } from '@/hooks/useScrollReveal'
import { cn } from '@/lib/utils'
import s from './Features.module.scss'

const FEATURES = [
  {
    num: '01',
    icon: '📖',
    title: 'The Recipe Vault',
    desc: 'Thousands of meticulously tested cocktail recipes — from the timeless classics to the bold avant-garde. Filter by spirit, flavour profile, difficulty, era, or occasion.',
    slide: 'left' as const,
  },
  {
    num: '02',
    icon: '🗺️',
    title: 'Origin Stories',
    desc: "Every great cocktail has a history worth knowing. Discover the legend of the Negroni, the mythology of the Martini, and the colourful characters who shaped what we pour today.",
    slide: null,
    delay: s.delayTwo,
  },
  {
    num: '03',
    icon: '🧭',
    title: 'Collections & moods',
    desc: 'Group recipes by spirit, occasion, or flavour profile. Save sets you love and return when the moment calls for something shaken, stirred, or straight up.',
    slide: null,
    delay: s.delayThree,
  },
  {
    num: '04',
    icon: '🔮',
    title: 'Your Personal Bar',
    desc: 'Log what\'s in your cabinet. Get personalised recommendations based on your bottles, your palate, and your mood. Create your own recipes and share them with the community.',
    slide: 'right' as const,
  },
]

function FeatureCard({ feature }: { feature: typeof FEATURES[number] }) {
  const { ref, visible } = useScrollReveal()

  const slideClass =
    feature.slide === 'left'
      ? s.cardSlideLeft
      : feature.slide === 'right'
      ? s.cardSlideRight
      : s.cardReveal

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        s.card,
        slideClass,
        feature.delay,
        visible && s.cardVisible
      )}
    >
      <span className={s.num}>{feature.num}</span>
      <span className={s.icon}>{feature.icon}</span>
      <h3 className={s.cardTitle}>{feature.title}</h3>
      <p className={s.cardDesc}>{feature.desc}</p>
    </div>
  )
}

export function Features() {
  const { ref: headerRef, visible: headerVisible } = useScrollReveal()

  return (
    <section id="features" className={s.section}>
      <div
        ref={headerRef as React.RefObject<HTMLDivElement>}
        className={cn(s.header, s.headerReveal, headerVisible && s.headerVisible)}
      >
        <span className={s.label}>What Awaits You</span>
        <h2 className={s.title}>
          A World of <em>Fine Craft</em><br />
          At Your Fingertips
        </h2>
      </div>

      <div className={s.grid}>
        {FEATURES.map((f) => (
          <FeatureCard key={f.num} feature={f} />
        ))}
      </div>
    </section>
  )
}
