
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import PharmacyFormExtended from '@/components/pharmacy/PharmacyFormExtended'
export const dynamic = 'force-dynamic'


export default async function EditPharmacyPage({ 
  params 
}: { 
  params: Promise<{ id: string }> 
}) {
  const resolvedParams = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/pharmacy/login')
  }

  // ユーザーの会社情報を取得
  const { data: userData } = await supabase
    .from('users')
    .select('company_id')
    .eq('id', user.id)
    .single()

  if (!userData?.company_id) {
    redirect('/dashboard')
  }

  // 薬局情報を取得（会社に属していることを確認）
  const { data: pharmacy, error } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('id', resolvedParams.id)
    .eq('company_id', userData.company_id)
    .single()

  if (error || !pharmacy) {
    redirect('/dashboard/pharmacies')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/dashboard/pharmacies" className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900">薬局情報編集</h1>
              <p className="text-sm text-gray-600">{pharmacy.name}</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-md p-6">
            <PharmacyFormExtended pharmacy={pharmacy} />
          </div>
        </div>
      </main>
    </div>
  )
}
