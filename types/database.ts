export type UserRole = 'pharmacy_admin' | 'clinic_staff' | 'admin' | 'doctor'
export type PharmacyStatus = 'active' | 'inactive' | 'pending'
export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing'
export type RequestStatus = 'pending' | 'accepted' | 'rejected' | 'expired'
export type DrugType = 'generic' | 'brand'

export interface User {
  id: string
  email: string
  role: UserRole
  name?: string
  clinic_name?: string
  medical_license_number?: string
  organization_name?: string
  phone?: string
  company_id?: string
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
  website_url?: string
  twenty_four_support: boolean
  holiday_support: boolean
  emergency_support: boolean
  max_capacity: number
  current_capacity: number
  accepted_patients_count: number
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

// Doctor Request Feature Types
export interface Request {
  id: string
  doctor_id: string
  pharmacy_id: string
  patient_info: {
    medications?: Array<{
      name: string
      dosage?: string
      frequency?: string
    }>
    conditions?: string[]
    treatment_plan?: string
    notes?: string
  }
  ai_document?: string
  status: RequestStatus
  created_at: string
  updated_at: string
}

export interface Response {
  id: string
  request_id: string
  pharmacy_id: string
  accepted: boolean
  rejection_reasons?: {
    inventory?: boolean
    capacity?: boolean
    controlled_substance?: boolean
    out_of_scope?: boolean
    other?: string
  }
  notes?: string
  responded_at: string
}

export interface Drug {
  code: string
  name: string
  name_kana?: string
  type: DrugType
  approval_date?: string
  manufacturer?: string
  updated_at: string
}