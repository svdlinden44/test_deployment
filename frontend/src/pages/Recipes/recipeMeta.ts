/** Match backend `Recipe.Difficulty` / `Recipe.GlassType` values */

export const DIFFICULTY_OPTIONS = [
  { value: '', label: 'Any difficulty' },
  { value: 'easy', label: 'Easy' },
  { value: 'medium', label: 'Medium' },
  { value: 'hard', label: 'Hard' },
  { value: 'expert', label: 'Expert' },
]

export const GLASS_OPTIONS = [
  { value: '', label: 'Any glass' },
  { value: 'coupe', label: 'Coupe' },
  { value: 'rocks', label: 'Rocks / Old Fashioned' },
  { value: 'highball', label: 'Highball / Collins' },
  { value: 'martini', label: 'Martini' },
  { value: 'flute', label: 'Champagne flute' },
  { value: 'tiki', label: 'Tiki mug' },
  { value: 'hurricane', label: 'Hurricane' },
  { value: 'copper', label: 'Copper mug' },
  { value: 'wine', label: 'Wine glass' },
  { value: 'shot', label: 'Shot glass' },
  { value: 'snifter', label: 'Snifter' },
  { value: 'other', label: 'Other' },
]

export const ALCOHOL_OPTIONS = [
  { value: '', label: 'Any' },
  { value: '1', label: 'Alcoholic' },
  { value: '0', label: 'Non-alcoholic' },
]
