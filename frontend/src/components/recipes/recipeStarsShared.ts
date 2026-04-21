export const STAR_COUNT = 5
export const STAR_VB = 24

export const STAR_PATH =
  'M12 2.2l2.76 5.6 6.2.9-4.48 4.36 1.06 6.17L12 16.9l-5.54 2.92 1.06-6.17L3.04 8.7l6.2-.9L12 2.2z'

/** Fill 0–1 within star index for overall score in [1, 5]. */
export function fillForStar(score: number, starIndex: number): number {
  const k = starIndex + 1
  return Math.min(1, Math.max(0, score - (k - 1)))
}
