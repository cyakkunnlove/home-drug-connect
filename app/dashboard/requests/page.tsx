import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MobileOptimizedRequestList from '@/components/pharmacy/MobileOptimizedRequestList'

export default async function PharmacyRequestsPage() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/pharmacy/login')

    // Get user info with debugging
    const { data: userInfo } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    console.log('[Requests Page] User info:', userInfo)

    // Get user's pharmacy - try multiple methods
    let pharmacy = null
    
    // First try with user_id
    const { data: pharmacyByUserId, error: userIdError } = await supabase
      .from('pharmacies')
      .select('*')
      .eq('user_id', user.id)
      .single()
    
    console.log('[Requests Page] Pharmacy by user_id:', pharmacyByUserId, 'Error:', userIdError)
    
    if (pharmacyByUserId) {
      pharmacy = pharmacyByUserId
    } else if (userInfo?.email) {
      // Fallback: try with email
      const { data: pharmacyByEmail, error: emailError } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('email', userInfo.email)
        .single()
      
      console.log('[Requests Page] Pharmacy by email:', pharmacyByEmail, 'Error:', emailError)
      pharmacy = pharmacyByEmail
    }

    if (!pharmacy) {
      console.error('[Requests Page] No pharmacy found for user:', user.id)
      // Instead of redirecting, show a message
      return (
        <div className="py-6">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-yellow-900 mb-2">
                薬局情報が見つかりません
              </h2>
              <p className="text-yellow-700">
                薬局情報の設定が必要です。管理者にお問い合わせください。
              </p>
            </div>
          </div>
        </div>
      )
    }

    // Get all requests for this pharmacy with doctor info
    const { data: requests, error: requestsError } = await supabase
      .from('requests')
      .select(`
        *,
        doctor:users!doctor_id(email, organization_name),
        responses(accepted)
      `)
      .eq('pharmacy_id', pharmacy.id)
      .order('created_at', { ascending: false })

    console.log('[Requests Page] Requests:', requests?.length, 'Error:', requestsError)

    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              患者受け入れ依頼
            </h1>
            <div className="mt-4 md:mt-0 text-sm text-gray-600">
              承認済み患者数: {pharmacy.accepted_patients_count || 0}
            </div>
          </div>

          <MobileOptimizedRequestList initialRequests={requests || []} />
        </div>
      </div>
    )
  } catch (error) {
    console.error('[Requests Page] Error:', error)
    throw error
  }
}