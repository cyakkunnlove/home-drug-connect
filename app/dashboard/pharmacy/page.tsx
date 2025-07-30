import { createClient } from '@/lib/supabase/server'
import PharmacyForm from '@/components/pharmacy/PharmacyForm'

export default async function PharmacyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // 既存の薬局情報を取得
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('*')
    .eq('user_id', user?.id)
    .single()

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">
        薬局情報管理
      </h1>

      <div className="max-w-4xl">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <PharmacyForm pharmacy={pharmacy} />
        </div>
      </div>
    </div>
  )
}