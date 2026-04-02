import { request } from './client'
import type {
  Cocktail,
  Bar,
  Bottle,
  AuthUser,
  PaginatedResponse,
  CocktailFilters,
  BarFilters,
} from './types'

export const joinWaitlist = (email: string) =>
  request<{ message: string }>('/api/waitlist', {
    method: 'POST',
    body: JSON.stringify({ email }),
  })

export const getCocktails = (filters?: CocktailFilters) =>
  request<PaginatedResponse<Cocktail>>('/api/cocktails', {
    params: filters as Record<string, string> | undefined,
  })

export const getCocktailById = (id: string) =>
  request<Cocktail>(`/api/cocktails/${id}`)

export const getBars = (filters?: BarFilters) =>
  request<PaginatedResponse<Bar>>('/api/bars', {
    params: filters as Record<string, string> | undefined,
  })

export const getBarById = (id: string) =>
  request<Bar>(`/api/bars/${id}`)

export const getCabinet = () =>
  request<Bottle[]>('/api/me/cabinet')

export const updateCabinet = (bottles: Bottle[]) =>
  request<Bottle[]>('/api/me/cabinet', {
    method: 'PUT',
    body: JSON.stringify(bottles),
  })

export const authLogin = (email: string, password: string) =>
  request<{ user: AuthUser; token: string }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })

export const authSignup = (email: string, password: string, name: string) =>
  request<{ user: AuthUser; token: string }>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({ email, password, name }),
  })
