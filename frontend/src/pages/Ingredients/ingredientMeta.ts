/** Mirrors `Ingredient.IngredientType` (`backend/cocktails/models.py`) for filters and labels. */
export const INGREDIENT_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All types' },
  { value: 'spirit', label: 'Spirit' },
  { value: 'liqueur', label: 'Liqueur' },
  { value: 'wine', label: 'Wine / Vermouth' },
  { value: 'beer', label: 'Beer / Cider' },
  { value: 'mixer', label: 'Mixer / Soda' },
  { value: 'juice', label: 'Juice' },
  { value: 'syrup', label: 'Syrup / Sweetener' },
  { value: 'bitter', label: 'Bitters' },
  { value: 'garnish', label: 'Garnish' },
  { value: 'dairy', label: 'Dairy / Egg' },
  { value: 'other', label: 'Other' },
]

export function ingredientTypeLabel(type: string): string {
  const hit = INGREDIENT_TYPE_OPTIONS.find((o) => o.value === type)
  return hit?.label ?? type.replace(/-/g, ' ')
}
