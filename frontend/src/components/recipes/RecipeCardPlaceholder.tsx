import s from './RecipeCard.module.scss'

/** Decorative cocktail glass when a recipe has no image — matches site gold / dark tones. */
export function RecipeCardPlaceholder() {
  return (
    <div className={s.placeholderWrap} aria-hidden>
      <svg
        className={s.placeholderSvg}
        viewBox="0 0 88 112"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <title>Cocktail glass</title>
        {/* Coupe bowl */}
        <path
          d="M14 18c0-6 12-12 30-12s30 6 30 12c0 16-18 36-22 56h-16c-4-20-22-40-22-56Z"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinejoin="round"
        />
        <path
          d="M44 74v28"
          stroke="currentColor"
          strokeWidth="2.25"
          strokeLinecap="round"
        />
        <ellipse cx="44" cy="106" rx="18" ry="5" stroke="currentColor" strokeWidth="2" />
        {/* Rim highlight */}
        <ellipse
          cx="44"
          cy="18"
          rx="28"
          ry="10"
          stroke="currentColor"
          strokeWidth="1.25"
          opacity={0.45}
        />
      </svg>
    </div>
  )
}
