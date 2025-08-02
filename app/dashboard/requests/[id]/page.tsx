import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, User, Clock, MapPin } from 'lucide-react'
import ImprovedResponseForm from '@/components/pharmacy/ImprovedResponseForm'

export default async function PharmacyRequestDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { id } = params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/pharmacy/login')

  // Get user's pharmacy
  const { data: pharmacy } = await supabase
    .from('pharmacies')
    .select('id, accepted_patients_count, max_capacity')
    .eq('user_id', user.id)
    .single()

  if (!pharmacy) {
    redirect('/dashboard')
  }

  // Get request details
  const { data: request, error } = await supabase
    .from('requests')
    .select(`
      *,
      doctor:users!doctor_id(email, organization_name),
      responses(*)
    `)
    .eq('id', id)
    .eq('pharmacy_id', pharmacy.id)
    .single()

  if (error || !request) {
    notFound()
  }

  const hasResponded = request.responses && request.responses.length > 0
  const response = request.responses?.[0]

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/dashboard/requests"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            依頼一覧に戻る
          </Link>
        </div>

        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {/* Header */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  患者受け入れ依頼
                </h1>
                <div className="mt-1 flex items-center text-sm text-gray-500">
                  <Clock className="h-4 w-4 mr-1" />
                  {new Date(request.created_at).toLocaleString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Asia/Tokyo'
                  })}
                </div>
              </div>
              {request.status === 'pending' && (
                <span className="inline-flex items-center px-3 py-0.5 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                  回答待ち
                </span>
              )}
            </div>
          </div>

          {/* Doctor Info */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              依頼元情報
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-center">
                <User className="h-5 w-5 text-gray-400 mr-2" />
                <div>
                  <p className="font-medium text-gray-900">
                    {request.doctor?.organization_name || 'ドクター'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {request.doctor?.email || 'メールアドレスなし'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Patient Info */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              患者情報
            </h2>
            
            {/* Medications */}
            <div className="mb-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">服用中の薬</h3>
              {request.patient_info?.medications?.length > 0 ? (
                <ul className="space-y-1">
                  {request.patient_info.medications.map((med: any, index: number) => (
                    <li key={index} className="text-sm text-gray-600">
                      • {med.name}
                      {med.dosage && ` (${med.dosage})`}
                      {med.frequency && ` - ${med.frequency}`}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-gray-500">なし</p>
              )}
            </div>

            {/* Conditions */}
            {request.patient_info?.conditions?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">既往・現疾患</h3>
                <p className="text-sm text-gray-600">
                  {request.patient_info.conditions.join('、')}
                </p>
              </div>
            )}

            {/* Treatment Plan */}
            {request.patient_info?.treatment_plan && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">今後の治療方針</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {request.patient_info.treatment_plan}
                </p>
              </div>
            )}

            {/* Pharmacy Expectations */}
            {request.patient_info?.pharmacyExpectations?.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">薬局への期待事項</h3>
                <div className="flex flex-wrap gap-2">
                  {request.patient_info.pharmacyExpectations.map((expectation: string) => {
                    const expectationMap: { [key: string]: string } = {
                      'twentyfour': '24時間対応',
                      'night': '夜間対応',
                      'holiday': '休日対応',
                      'emergency': '緊急時対応',
                      'sterile': '無菌製剤調製',
                      'narcotics': '麻薬調剤',
                      'anticancer': '抗がん剤調剤',
                      'pediatric': '小児用製剤調製',
                      'enteral': '経管栄養剤管理',
                      'medical_device': '在宅医療機器管理',
                      'sanitary_materials': '衛生材料供給',
                      'medical_materials': '医療材料管理',
                      'home_visit': '訪問薬剤管理指導',
                      'medication_calendar': '服薬カレンダー作成',
                      'leftover_management': '残薬管理',
                      'multidisciplinary': '多職種連携',
                      'caregiver_guidance': '介護者への服薬指導',
                      'insurance': '保険薬局としての対応',
                      'self_pay': '自費対応可能',
                      'delivery': '配送サービス',
                      'online_guidance': 'オンライン服薬指導'
                    }
                    return (
                      <span key={expectation} className="px-2 py-1 text-xs font-medium bg-amber-100 text-amber-800 rounded-full">
                        {expectationMap[expectation] || expectation}
                      </span>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Medication Stock and Next Visit */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {request.patient_info?.medicationStock && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">薬の残量</h3>
                  <p className="text-sm text-gray-600">{request.patient_info.medicationStock}</p>
                </div>
              )}
              {request.patient_info?.nextVisitDate && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-1">次回往診予定日</h3>
                  <p className="text-sm text-gray-600">
                    {new Date(request.patient_info.nextVisitDate).toLocaleDateString('ja-JP')}
                  </p>
                </div>
              )}
            </div>

            {/* Notes */}
            {request.patient_info?.notes && (
              <div>
                <h3 className="text-sm font-medium text-gray-700 mb-2">備考</h3>
                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                  {request.patient_info.notes}
                </p>
              </div>
            )}
          </div>

          {/* AI Document */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              依頼文
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <pre className="whitespace-pre-wrap text-sm text-gray-700">
                {request.ai_document || '依頼文なし'}
              </pre>
            </div>
          </div>

          {/* Capacity Info */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              受け入れ状況
            </h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-blue-900">
                  現在の受け入れ患者数
                </span>
                <span className="text-lg font-bold text-blue-900">
                  {pharmacy.accepted_patients_count} / {pharmacy.max_capacity || '∞'}
                </span>
              </div>
              {pharmacy.max_capacity && (
                <div className="mt-2">
                  <div className="bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ 
                        width: `${Math.min(100, (pharmacy.accepted_patients_count / pharmacy.max_capacity) * 100)}%` 
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Response Section */}
          <div className="px-4 py-5 sm:px-6">
            {hasResponded ? (
              <div className="text-center py-8">
                <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                  response.accepted
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {response.accepted ? '✓ 承認済み' : '✗ 却下済み'}
                </div>
                <p className="mt-4 text-sm text-gray-600">
                  この依頼には既に回答済みです
                </p>
                {response.notes && (
                  <div className="mt-4 text-left max-w-lg mx-auto">
                    <p className="text-sm font-medium text-gray-700">送信した備考:</p>
                    <p className="mt-1 text-sm text-gray-600">{response.notes}</p>
                  </div>
                )}
              </div>
            ) : request.status === 'expired' ? (
              <div className="text-center py-8">
                <p className="text-sm text-gray-600">
                  この依頼は期限切れです
                </p>
              </div>
            ) : (
              <div>
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  回答する
                </h2>
                <ImprovedResponseForm 
                  requestId={request.id} 
                  pharmacyId={pharmacy.id}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}