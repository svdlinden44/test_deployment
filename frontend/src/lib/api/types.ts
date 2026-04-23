export interface AuthUser {
  id: string
  email: string
  name: string
  /** Absolute URL to the profile image, or undefined if none. */
  avatar_url?: string | null
}

/** GET /api/auth/profile/ and PATCH response body. */
export interface MemberProfile {
  email: string
  name: string
  avatar_url: string | null
}

/** DRF page-number pagination */
export interface PaginatedResults<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface CategoryDto {
  slug: string
  name: string
  sort_order: number
  recipe_count?: number
}

/** List/card payload: enough to split spirits vs other ingredients on the UI. */
export interface RecipeCardIngredientLine {
  sort_order: number
  ingredient_name: string
  ingredient_type: string
}

export interface RecipeListItem {
  id: number
  slug: string
  title: string
  description: string
  category: CategoryDto | null
  difficulty: string
  glass_type: string
  prep_time_minutes: number
  is_alcoholic: boolean
  image_url: string | null
  /** Present when logged in; from API annotation or explicit field. */
  is_favorited?: boolean
  is_wishlisted?: boolean
  /** `catalog` = Recipe Vault import; `member` = your own recipe. */
  recipe_source?: 'catalog' | 'member'
  /** Community average 1–5 when ratings exist (list/detail). */
  average_rating?: number | null
  rating_count?: number
  /** Present on list endpoints for recipe cards. */
  ingredients?: RecipeCardIngredientLine[]
}

/** PUT/PATCH/DELETE /api/me/ratings/:slug/ */
export interface RatingMutationResponse {
  score: number | null
  average_rating: number | null
  rating_count: number
}

export interface RecipeIngredientLine {
  quantity: string
  unit: string
  notes: string
  sort_order: number
  ingredient_name: string
  ingredient_slug: string
}

export interface RecipeDetail extends Omit<RecipeListItem, 'ingredients'> {
  instructions: string
  history: string
  ingredients: RecipeIngredientLine[]
  /** Logged-in user's saved rating (half stars), or null. */
  my_rating?: number | null
  average_rating?: number | null
  rating_count?: number
}

export interface MemberRecipeCreatePayload {
  title: string
  description: string
  instructions: string
}

export interface IngredientMini {
  id: number
  slug: string
  name: string
  type: string
}

/** GET /api/ingredients/ (browse) — includes optional cabinet flag when authenticated. */
export interface IngredientBrowseItem extends IngredientMini {
  description?: string
  image_url?: string | null
  /** Present when authenticated; omitted or false otherwise. */
  is_in_cabinet?: boolean
}

export interface IngredientFilters {
  search?: string
  type?: string
  page?: number
  per_page?: number
}

export interface RecipeFilters {
  search?: string
  category?: string
  difficulty?: string
  glass?: string
  alcoholic?: '' | '1' | '0'
  ingredient?: string[]
  ingredient_match?: 'any' | 'all'
  page?: number
  per_page?: number
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
