import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import MobileOptimizedRequestList from '@/components/pharmacy/MobileOptimizedRequestList'

export default async function PharmacyRequestsPage() {
  try {
    const supabase = await createClient()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/pharmacy/login')

    // Get user info with company
    const { data: userInfo } = await supabase
      .from('users')
      .select('*, company_id')
      .eq('id', user.id)
      .single()
    
    console.log('[Requests Page] User info:', userInfo)

    // Get all pharmacies for this user or company
    let pharmacies = []
    let allRequests = []
    
    if (userInfo?.company_id) {
      // Get all pharmacies for the company
      const { data: companyPharmacies } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('company_id', userInfo.company_id)
      
      console.log('[Requests Page] Company pharmacies:', companyPharmacies?.length)
      pharmacies = companyPharmacies || []
    } else {
      // Fallback: try with user_id
      const { data: userPharmacies } = await supabase
        .from('pharmacies')
        .select('*')
        .eq('user_id', user.id)
      
      if (userPharmacies && userPharmacies.length > 0) {
        pharmacies = userPharmacies
      } else if (userInfo?.email) {
        // Final fallback: try with email
        const { data: emailPharmacies } = await supabase
          .from('pharmacies')
          .select('*')
          .eq('email', userInfo.email)
        
        pharmacies = emailPharmacies || []
      }
    }

    if (pharmacies.length === 0) {
      console.error('[Requests Page] No pharmacies found for user:', user.id)
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

    // Get all requests for all pharmacies
    const pharmacyIds = pharmacies.map(p => p.id)
    const { data: requests, error: requestsError } = await supabase
      .from('requests')
      .select(`
        *,
        doctor:users!doctor_id(email, organization_name),
        responses(accepted),
        pharmacy:pharmacies!pharmacy_id(name, address)
      `)
      .in('pharmacy_id', pharmacyIds)
      .order('created_at', { ascending: false })

    console.log('[Requests Page] Requests:', requests?.length, 'Error:', requestsError)

    // Calculate total accepted patients across all pharmacies
    const totalAcceptedPatients = pharmacies.reduce((sum, pharmacy) => 
      sum + (pharmacy.accepted_patients_count || 0), 0
    )
    
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              患者受け入れ依頼
            </h1>
            <div className="mt-4 md:mt-0 text-sm text-gray-600">
              承認済み患者数: {totalAcceptedPatients}名
              {pharmacies.length > 1 && ` (${pharmacies.length}店舗合計)`}
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