import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import RequestForm from '@/components/doctor/RequestForm'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AnimatedPage from '@/components/ui/AnimatedPage'

export default async function NewRequestPage({
  searchParams
}: {
  searchParams: { pharmacyId?: string }
}) {
  const pharmacyId = searchParams.pharmacyId
  
  if (!pharmacyId) {
    redirect('/search')
  }

  const supabase = await createClient()
  
  // Check authentication and get user info
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/login')
  }

  // Get doctor information
  const { data: doctorData, error: doctorError } = await supabase
    .from('users')
    .select('full_name, organization_name, email')
    .eq('id', user.id)
    .single()
  
  // Get pharmacy details
  const { data: pharmacy, error } = await supabase
    .from('pharmacies')
    .select('id, name, address')
    .eq('id', pharmacyId)
    .eq('status', 'active')
    .single()

  if (error || !pharmacy) {
    redirect('/search')
  }

  return (
    <AnimatedPage className="py-6 mobile-spacing">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/search"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700 min-h-[44px] p-2 -ml-2 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            薬局選択に戻る
          </Link>
        </div>

        <div className="bg-white shadow-lg rounded-2xl ios-card-elevated">
          <div className="px-4 py-5 sm:p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">
              患者受け入れ依頼作成
            </h1>
            
            <RequestForm 
              pharmacy={pharmacy} 
              doctorInfo={{
                name: doctorData?.full_name || doctorData?.email || 'Unknown Doctor',
                organization: doctorData?.organization_name || '',
                email: doctorData?.email || ''
              }}
            />
          </div>
        </div>
      </div>
    </AnimatedPage>
  )
}