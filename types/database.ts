export type UserRole = 'pharmacy_admin' | 'clinic_staff' | 'admin'
export type PharmacyStatus = 'active' | 'inactive' | 'pending'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'

export interface User {
  id: string
  email: string
  role: UserRole
  organization_name?: string
  phone?: string
  created_at: string
  updated_at: string
}

export interface Pharmacy {
  id: string
  user_id: string
  name: string
  address: string
  location: {
    lat: number
    lng: number
  }
  phone: string
  email?: string
  twenty_four_support: boolean
  holiday_support: boolean
  emergency_support: boolean
  max_capacity: number
  current_capacity: number
  coverage_radius_km: number
  status: PharmacyStatus
  business_hours?: {
    [key: string]: {
      open: string
      close: string
    }
  }
  created_at: string
  updated_at: string
}

export interface PharmacyCapability {
  id: string
  pharmacy_id: string
  capability_name: string
  is_available: boolean
  created_at: string
}

export interface CoverageArea {
  id: string
  pharmacy_id: string
  area_name: string
  coverage_polygon?: any
  created_at: string
}

export interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id?: string
  stripe_customer_id?: string
  status: SubscriptionStatus
  plan_id: string
  current_period_start?: string
  current_period_end?: string
  cancel_at?: string
  canceled_at?: string
  created_at: string
  updated_at: string
}

export interface SearchLog {
  id: string
  search_location?: {
    lat: number
    lng: number
  }
  search_address?: string
  search_filters?: any
  results_count?: number
  session_id?: string
  created_at: string
}

export interface PharmacyView {
  id: string
  pharmacy_id: string
  viewer_session_id?: string
  referrer?: string
  created_at: string
}