import { useScrollReveal } from '@/hooks/useScrollReveal'
import { useCountUp } from '@/hooks/useCountUp'
import { cn } from '@/lib/utils'
import s from './Stats.module.scss'

const STATS = [
  { target: 3000, label: 'Curated Recipes', delay: '' },
  { target: 180, label: 'Countries Covered', delay: s.delayTwo },
  { target: 500, label: 'Saved collections', delay: s.delayThree },
  { target: 250, label: 'Years of History', delay: s.delayFour },
]

function StatItem({ stat }: { stat: typeof STATS[number] }) {
  const { ref, visible } = useScrollReveal({ threshold: 0.5 })
  const count = useCountUp(stat.target, 1800, visible)
  const suffix = stat.target > 100 ? '+' : ''

  return (
    <div
      ref={ref as React.RefObject<HTMLDivElement>}
      className={cn(s.item, stat.delay, visible && s.visible)}
    >
      <span className={s.num}>
        {count.toLocaleString()}{suffix}
      </span>
      <span className={s.label}>
        {stat.label}
      </span>
    </div>
  )
}

export function Stats() {
  return (
    <section id="stats" className={s.section}>
      <div className={s.grid}>
        {STATS.map((stat) => (
          <StatItem key={stat.label} stat={stat} />
        ))}
      </div>
    </section>
  )
}
