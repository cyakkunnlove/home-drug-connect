import { create } from 'zustand'
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Types
export interface PharmacyResult {
  id: string
  name: string
  address: string
  formatted_address?: string
  phone: string
  distance_km: string
  twenty_four_support: boolean
  holiday_support: boolean
  emergency_support: boolean
  has_clean_room: boolean
  handles_narcotics: boolean
  current_capacity: number
  max_capacity: number
  available_spots: number
  lat: number
  lng: number
}

export interface SearchFilters {
  excludeFull: boolean
  showOnly24Hour: boolean
  showOnlyCleanRoom: boolean
  showOnlyNarcotics: boolean
  radius: number
}

export interface SearchLocation {
  lat: number
  lng: number
  address: string
}

interface SearchState {
  // Search parameters
  searchLocation: SearchLocation | null
  searchFilters: SearchFilters
  
  // Results
  searchResults: PharmacyResult[]
  isSearching: boolean
  error: string | null
  
  // UI state
  selectedPharmacyId: string | null
  viewMode: 'map' | 'list'
  showFilters: boolean
  
  // Cache
  lastSearchTimestamp: number | null
  cachedResults: Map<string, { results: PharmacyResult[]; timestamp: number }>
  
  // Actions
  setSearchLocation: (location: SearchLocation) => void
  setSearchFilters: (filters: Partial<SearchFilters>) => void
  setSearchResults: (results: PharmacyResult[]) => void
  setSearching: (isSearching: boolean) => void
  setError: (error: string | null) => void
  setSelectedPharmacy: (id: string | null) => void
  setViewMode: (mode: 'map' | 'list') => void
  toggleFilters: () => void
  
  // Complex actions
  performSearch: (location: SearchLocation, filters?: SearchFilters) => Promise<void>
  clearSearch: () => void
  getCachedResults: (key: string) => PharmacyResult[] | null
}

// Default filters
const defaultFilters: SearchFilters = {
  excludeFull: true,
  showOnly24Hour: false,
  showOnlyCleanRoom: false,
  showOnlyNarcotics: false,
  radius: 5,
}

// Cache duration (5 minutes)
const CACHE_DURATION = 5 * 60 * 1000

// Create search store
export const useSearchStore = create<SearchState>()(
  devtools(
    persist(
      subscribeWithSelector(
        immer((set, get) => ({
          // Initial state
          searchLocation: null,
          searchFilters: defaultFilters,
          searchResults: [],
          isSearching: false,
          error: null,
          selectedPharmacyId: null,
          viewMode: 'map',
          showFilters: false,
          lastSearchTimestamp: null,
          cachedResults: new Map(),

          // Basic setters
          setSearchLocation: (location) =>
            set((state) => {
              state.searchLocation = location
            }),

          setSearchFilters: (filters) =>
            set((state) => {
              state.searchFilters = { ...state.searchFilters, ...filters }
            }),

          setSearchResults: (results) =>
            set((state) => {
              state.searchResults = results
              state.lastSearchTimestamp = Date.now()
            }),

          setSearching: (isSearching) =>
            set((state) => {
              state.isSearching = isSearching
            }),

          setError: (error) =>
            set((state) => {
              state.error = error
            }),

          setSelectedPharmacy: (id) =>
            set((state) => {
              state.selectedPharmacyId = id
            }),

          setViewMode: (mode) =>
            set((state) => {
              state.viewMode = mode
            }),

          toggleFilters: () =>
            set((state) => {
              state.showFilters = !state.showFilters
            }),

          // Complex actions
          performSearch: async (location, filters) => {
            const state = get()
            const searchFilters = filters || state.searchFilters

            // Create cache key
            const cacheKey = `${location.lat},${location.lng},${JSON.stringify(
              searchFilters
            )}`

            // Check cache
            const cached = state.getCachedResults(cacheKey)
            if (cached) {
              set((state) => {
                state.searchResults = cached
                state.searchLocation = location
                state.error = null
              })
              return
            }

            // Perform search
            set((state) => {
              state.isSearching = true
              state.error = null
              state.searchLocation = location
            })

            try {
              const params = new URLSearchParams({
                lat: location.lat.toString(),
                lng: location.lng.toString(),
                radius: searchFilters.radius.toString(),
                excludeFull: searchFilters.excludeFull.toString(),
              })

              // Add service filters
              const requiredServices = []
              if (searchFilters.showOnly24Hour) requiredServices.push('24時間対応')
              if (searchFilters.showOnlyCleanRoom) requiredServices.push('無菌調剤')
              if (searchFilters.showOnlyNarcotics) requiredServices.push('麻薬調剤')

              requiredServices.forEach((service) => {
                params.append('services', service)
              })

              const response = await fetch(`/api/pharmacies/search?${params}`)

              if (!response.ok) {
                throw new Error('検索に失敗しました')
              }

              const data = await response.json()
              const results = data.pharmacies || []

              // Update state and cache
              set((state) => {
                state.searchResults = results
                state.isSearching = false
                state.lastSearchTimestamp = Date.now()
                
                // Update cache
                state.cachedResults.set(cacheKey, {
                  results,
                  timestamp: Date.now(),
                })
              })
            } catch (error) {
              set((state) => {
                state.error =
                  error instanceof Error
                    ? error.message
                    : '検索中にエラーが発生しました'
                state.isSearching = false
              })
            }
          },

          clearSearch: () =>
            set((state) => {
              state.searchLocation = null
              state.searchResults = []
              state.error = null
              state.selectedPharmacyId = null
              state.lastSearchTimestamp = null
            }),

          getCachedResults: (key) => {
            const state = get()
            const cached = state.cachedResults.get(key)

            if (!cached) return null

            // Check if cache is still valid
            if (Date.now() - cached.timestamp > CACHE_DURATION) {
              state.cachedResults.delete(key)
              return null
            }

            return cached.results
          },
        }))
      ),
      {
        name: 'search-store',
        partialize: (state) => ({
          searchFilters: state.searchFilters,
          viewMode: state.viewMode,
        }),
      }
    ),
    { name: 'SearchStore' }
  )
)

// Selectors
export const selectNearbyPharmacies = (maxDistance: number) => (state: SearchState) =>
  state.searchResults.filter((p) => parseFloat(p.distance_km) <= maxDistance)

export const selectAvailablePharmacies = () => (state: SearchState) =>
  state.searchResults.filter((p) => p.available_spots > 0)

export const select24HourPharmacies = () => (state: SearchState) =>
  state.searchResults.filter((p) => p.twenty_four_support)

// Subscriptions for side effects
useSearchStore.subscribe(
  (state) => state.cachedResults,
  (cachedResults) => {
    // Clean up old cache entries
    const now = Date.now()
    for (const [key, value] of cachedResults.entries()) {
      if (now - value.timestamp > CACHE_DURATION) {
        cachedResults.delete(key)
      }
    }
  }
)