import { useScrollReveal } from '@/hooks/useScrollReveal'
import { cn } from '@/lib/utils'
import s from './Philosophy.module.scss'

export function Philosophy() {
  const { ref, visible } = useScrollReveal()

  return (
    <section id="philosophy" className={s.section}>
      <div
        ref={ref as React.RefObject<HTMLDivElement>}
        className={cn(s.reveal, visible && s.visible)}
      >
        <span className={s.label}>Our Philosophy</span>
        <blockquote className={s.quote}>
          "A cocktail is not merely a drink. It is a{' '}
          <span className={s.highlight}>ritual</span>, a story,
          a tradition passed between generations — and we are here to preserve
          every last drop of it."
        </blockquote>
        <p className={s.attr}>— The Distillist</p>
      </div>
    </section>
  )
}
