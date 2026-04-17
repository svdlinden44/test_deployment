export interface AuthUser {
  id: string
  email: string
  name: string
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
}

export interface RecipeIngredientLine {
  quantity: string
  unit: string
  notes: string
  sort_order: number
  ingredient_name: string
  ingredient_slug: string
}

export interface RecipeDetail extends RecipeListItem {
  instructions: string
  history: string
  ingredients: RecipeIngredientLine[]
}

export interface IngredientMini {
  id: number
  slug: string
  name: string
  type: string
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

export interface Bottle {
  id: string
  name: string
  category: string
  emoji: string
  active: boolean
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
