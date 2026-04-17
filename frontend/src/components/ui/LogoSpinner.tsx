import s from './LogoSpinner.module.scss'

type Props = {
  label?: string
}

/** Animated site logo for loading states (infinite scroll, etc.). */
export function LogoSpinner({ label = 'Loading more recipes' }: Props) {
  return (
    <div className={s.wrap} role="status" aria-live="polite" aria-busy="true">
      <div className={s.ring}>
        <img
          src="/images/logo-small.png"
          alt=""
          className={s.logo}
          width={56}
          height={56}
        />
      </div>
      <span className={s.sr}>{label}</span>
    </div>
  )
}
