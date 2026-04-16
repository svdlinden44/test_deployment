import { useScrollReveal } from '@/hooks/useScrollReveal'
import { cn } from '@/lib/utils'
import s from './CocktailShowcase.module.scss'

const COCKTAILS = [
  {
    id: 'negroni',
    emoji: '🍷',
    origin: 'Florence, Italy — 1919',
    name: 'The Negroni',
    desc: "Born of Count Camillo Negroni's bold demand for something stronger than an Americano, this bittersweet jewel became one of the world's most beloved cocktails.",
    ingredients: ['Gin', 'Campari', 'Sweet Vermouth'],
    bgColor: 'radial-gradient(circle at 50% 80%, rgba(180,60,30,.6) 0%, rgba(60,10,5,.9) 60%, #080503 100%)',
    slide: 'left' as const,
  },
  {
    id: 'old-fashioned',
    emoji: '🍸',
    origin: 'New York, USA — 1880s',
    name: 'The Old Fashioned',
    desc: 'The original cocktail — a gentleman\'s drink, refined over centuries. Simply spirit, sweetness, and bitters. A monument to the philosophy that less is always more.',
    ingredients: ['Bourbon', 'Angostura', 'Demerara'],
    bgColor: 'radial-gradient(circle at 50% 80%, rgba(201,168,76,.5) 0%, rgba(80,40,5,.9) 60%, #080503 100%)',
    slide: null,
    delay: s.delayTwo,
  },
  {
    id: 'dry-martini',
    emoji: '🫙',
    origin: 'London, UK — 1890s',
    name: 'The Dry Martini',
    desc: 'Subject of more debate than any other cocktail in history. Shaken or stirred? How dry? Olive or twist? There is no wrong answer — only your answer.',
    ingredients: ['Dry Gin', 'Dry Vermouth', 'Lemon Twist'],
    bgColor: 'radial-gradient(circle at 50% 80%, rgba(40,80,120,.6) 0%, rgba(5,15,40,.9) 60%, #080503 100%)',
    slide: 'right' as const,
  },
]

function CocktailCard({ cocktail }: { cocktail: typeof COCKTAILS[number] }) {
  const { ref, visible } = useScrollReveal()

  const slideClass =
    cocktail.slide === 'left'
      ? s.cardSlideLeft
      : cocktail.slide === 'right'
      ? s.cardSlideRight
      : s.cardReveal

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(
        s.card,
        slideClass,
        'delay' in cocktail ? (cocktail as { delay?: string }).delay : '',
        visible && s.cardVisible
      )}
    >
      <div className={s.visual}>
        <div className={s.visualBg} style={{ background: cocktail.bgColor }} />
        <span className={s.emoji}>{cocktail.emoji}</span>
        <div className={s.blurOverlay}>
          <span className={s.badge}>Coming Soon</span>
        </div>
      </div>

      <div className={s.body}>
        <p className={s.origin}>{cocktail.origin}</p>
        <h3 className={s.name}>{cocktail.name}</h3>
        <p className={s.desc}>{cocktail.desc}</p>
        <div className={s.ingredients}>
          {cocktail.ingredients.map((ing) => (
            <span key={ing} className={s.ingredientTag}>{ing}</span>
          ))}
        </div>
      </div>
    </div>
  )
}

export function CocktailShowcase() {
  const { ref: headerRef, visible: headerVisible } = useScrollReveal()

  return (
    <section id="showcase" className={s.section}>
      <div
        ref={headerRef as React.RefObject<HTMLDivElement>}
        className={cn(s.header, s.headerReveal, headerVisible && s.headerVisible)}
      >
        <span className={s.label}>A Taste of What's Coming</span>
        <h2 className={s.title}>
          The Classics,<br />
          <em>Rediscovered</em>
        </h2>
        <p className={s.sub}>Hover to peek behind the curtain</p>
      </div>

      <div className={s.grid}>
        {COCKTAILS.map((c) => (
          <CocktailCard key={c.id} cocktail={c} />
        ))}
      </div>
    </section>
  )
}
