import { request } from './client'
import type {
  CategoryDto,
  IngredientMini,
  PaginatedResults,
  RecipeDetail,
  RecipeFilters,
  RecipeListItem,
  Bottle,
} from './types'

function filtersToParams(f?: RecipeFilters): Record<string, string | number | string[] | undefined> {
  if (!f) return {}
  const { ingredient, page, per_page, ...rest } = f
  return {
    ...rest,
    page: page ?? undefined,
    per_page: per_page ?? undefined,
    ingredient: ingredient?.length ? ingredient : undefined,
  }
}

export const getRecipes = (filters?: RecipeFilters) =>
  request<PaginatedResults<RecipeListItem>>('/api/recipes/', {
    params: filtersToParams(filters),
    auth: false,
  })

export const getRecipeBySlug = (slug: string) =>
  request<RecipeDetail>(`/api/recipes/${slug}/`, { auth: false })

export const getCategories = () =>
  request<CategoryDto[]>('/api/categories/', { auth: false })

export const searchIngredients = (search: string, page = 1) =>
  request<PaginatedResults<IngredientMini>>('/api/ingredients/', {
    params: { search: search || undefined, page },
    auth: false,
  })

export const getCabinet = () => request<Bottle[]>('/api/me/cabinet')

export const updateCabinet = (bottles: Bottle[]) =>
  request<Bottle[]>('/api/me/cabinet', {
    method: 'PUT',
    body: JSON.stringify(bottles),
  })
