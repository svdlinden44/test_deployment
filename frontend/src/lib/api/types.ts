export interface AuthUser {
  id: string
  email: string
  name: string
}

export interface Cocktail {
  id: string
  name: string
  origin: string
  description: string
  ingredients: string[]
  instructions: string[]
  emoji: string
  era?: string
  difficulty?: 'easy' | 'medium' | 'hard'
}

export interface Bar {
  id: string
  name: string
  city: string
  country: string
  description: string
  type: 'speakeasy' | 'hotel' | 'neighborhood' | 'cocktail-bar'
  emoji: string
}

export interface Bottle {
  id: string
  name: string
  category: string
  emoji: string
  active: boolean
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  perPage: number
}

export interface CocktailFilters {
  spirit?: string
  difficulty?: string
  era?: string
  search?: string
  page?: string
}

export interface BarFilters {
  city?: string
  country?: string
  type?: string
  search?: string
  page?: string
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}
