import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface Bottle {
  id: string
  name: string
  category: string
  emoji: string
  active: boolean
}

const DEFAULT_BOTTLES: Bottle[] = [
  { id: 'bourbon', name: 'Bourbon', category: 'Whiskey', emoji: '✦', active: true },
  { id: 'dry-gin', name: 'Dry Gin', category: 'Gin', emoji: '🍸', active: true },
  { id: 'campari', name: 'Campari', category: 'Liqueur', emoji: '🌿', active: true },
  { id: 'limoncello', name: 'Limoncello', category: 'Liqueur', emoji: '🍋', active: false },
  { id: 'triple-sec', name: 'Triple Sec', category: 'Liqueur', emoji: '🍊', active: true },
  { id: 'mezcal', name: 'Mezcal', category: 'Spirits', emoji: '🌶️', active: false },
  { id: 'vermouth', name: 'Vermouth', category: 'Fortified', emoji: '🫧', active: true },
  { id: 'rum', name: 'Rum', category: 'Spirits', emoji: '🍹', active: false },
]

interface CabinetState {
  bottles: Bottle[]
  toggleBottle: (id: string) => void
  addBottle: (bottle: Omit<Bottle, 'active'>) => void
  removeBottle: (id: string) => void
}

export const useCabinetStore = create<CabinetState>()(
  persist(
    (set) => ({
      bottles: DEFAULT_BOTTLES,
      toggleBottle: (id) =>
        set((state) => ({
          bottles: state.bottles.map((b) => (b.id === id ? { ...b, active: !b.active } : b)),
        })),
      addBottle: (bottle) =>
        set((state) => ({
          bottles: [...state.bottles, { ...bottle, active: true }],
        })),
      removeBottle: (id) =>
        set((state) => ({
          bottles: state.bottles.filter((b) => b.id !== id),
        })),
    }),
    { name: 'distillist-cabinet' }
  )
)
