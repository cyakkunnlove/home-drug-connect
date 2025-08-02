import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import ImprovedRequestList from '@/components/pharmacy/ImprovedRequestList'

export default async function PharmacyRequestsPage() {
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/pharmacy/login')

  // Get user's pharmacy
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!pharmacy) {
    redirect('/dashboard')
  }

  // Get all requests for this pharmacy with doctor info
  const { data: requests } = await supabase
    .from('requests')
    .select(`
      *,
      doctor:users!doctor_id(email, organization_name),
      responses(accepted)
    `)
    .eq('pharmacy_id', pharmacy.id)
    .order('created_at', { ascending: false })

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

        <ImprovedRequestList initialRequests={requests || []} />
      </div>
    </div>
  )
}