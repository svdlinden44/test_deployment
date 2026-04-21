import { fetchWithAuth, request } from './client'
import type {
  CategoryDto,
  IngredientBrowseItem,
  IngredientFilters,
  IngredientMini,
  MemberRecipeCreatePayload,
  PaginatedResults,
  RatingMutationResponse,
  RecipeDetail,
  RecipeFilters,
  RecipeListItem,
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

function ingredientFiltersToParams(
  f?: IngredientFilters,
): Record<string, string | number | undefined> {
  if (!f) return {}
  const { page, per_page, ...rest } = f
  return {
    ...rest,
    page: page ?? undefined,
    per_page: per_page ?? undefined,
  }
}

export const getRecipes = (filters?: RecipeFilters, opts?: { auth?: boolean }) =>
  request<PaginatedResults<RecipeListItem>>('/api/recipes/', {
    params: filtersToParams(filters),
    auth: opts?.auth ?? false,
  })

export const getRecipeBySlug = (slug: string) =>
  request<RecipeDetail>(`/api/recipes/${slug}/`, { auth: true })

export const getCategories = () =>
  request<CategoryDto[]>('/api/categories/', { auth: false })

/** Compact payload for recipe-filter autocomplete (Recipe Vault filter chips). */
export const searchIngredients = (search: string, page = 1) =>
  request<PaginatedResults<IngredientMini>>('/api/ingredients/', {
    params: { search: search || undefined, page, compact: '1' },
    auth: false,
  })

export const getIngredients = (filters?: IngredientFilters, opts?: { auth?: boolean }) =>
  request<PaginatedResults<IngredientBrowseItem>>('/api/ingredients/', {
    params: ingredientFiltersToParams(filters),
    auth: opts?.auth ?? false,
  })

export const getMyCabinetIngredients = (page = 1, perPage = 24) =>
  request<PaginatedResults<IngredientBrowseItem>>('/api/me/cabinet/', {
    params: { page, per_page: perPage },
    auth: true,
  })

export const addCabinetIngredient = (slug: string) =>
  request<IngredientBrowseItem>(`/api/me/cabinet/${encodeURIComponent(slug)}/`, {
    method: 'POST',
    body: '{}',
    auth: true,
  })

export const removeCabinetIngredient = (slug: string) =>
  request<void>(`/api/me/cabinet/${encodeURIComponent(slug)}/`, {
    method: 'DELETE',
    auth: true,
  })

export const getMyFavoriteRecipes = (page = 1, perPage = 24) =>
  request<PaginatedResults<RecipeListItem>>('/api/me/favorites/', {
    params: { page, per_page: perPage },
  })

export const addRecipeFavorite = (slug: string) =>
  request<RecipeListItem>(`/api/me/favorites/${encodeURIComponent(slug)}/`, {
    method: 'POST',
    body: '{}',
  })

export const removeRecipeFavorite = (slug: string) =>
  request<void>(`/api/me/favorites/${encodeURIComponent(slug)}/`, {
    method: 'DELETE',
  })

export const getWishlistRecipes = (page = 1, perPage = 24) =>
  request<PaginatedResults<RecipeListItem>>('/api/me/wishlist/', {
    params: { page, per_page: perPage },
  })

export const addWishlistItem = (slug: string) =>
  request<RecipeListItem>(`/api/me/wishlist/${encodeURIComponent(slug)}/`, {
    method: 'POST',
    body: '{}',
  })

export const removeWishlistItem = (slug: string) =>
  request<void>(`/api/me/wishlist/${encodeURIComponent(slug)}/`, {
    method: 'DELETE',
  })

export const getMemberRecipes = (page = 1, perPage = 24) =>
  request<PaginatedResults<RecipeListItem>>('/api/me/recipes/', {
    params: { page, per_page: perPage },
  })

export const createMemberRecipe = (payload: MemberRecipeCreatePayload | FormData) =>
  request<RecipeListItem>('/api/me/recipes/', {
    method: 'POST',
    body: payload instanceof FormData ? payload : JSON.stringify(payload),
  })

/** PNG preview processed like the eventual save pipeline (`X-Preview-Pipeline`: rembg | passthrough). */
export const previewRecipeImage = async (file: File, signal?: AbortSignal) => {
  const fd = new FormData()
  fd.append('image', file)
  const res = await fetchWithAuth('/api/me/recipes/preview-image/', {
    method: 'POST',
    body: fd,
    signal,
  })
  const pipeline = (res.headers.get('X-Preview-Pipeline') ?? 'passthrough') as 'rembg' | 'passthrough'
  const blob = await res.blob()
  return { blob, pipeline }
}

export const upsertRecipeRating = (slug: string, score: number) =>
  request<RatingMutationResponse>(`/api/me/ratings/${encodeURIComponent(slug)}/`, {
    method: 'PUT',
    body: JSON.stringify({ score }),
  })

export const deleteRecipeRating = (slug: string) =>
  request<RatingMutationResponse>(`/api/me/ratings/${encodeURIComponent(slug)}/`, {
    method: 'DELETE',
  })
