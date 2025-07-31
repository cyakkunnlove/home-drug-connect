import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Phone, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

export default async function RequestDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/pharmacy/login')

  // Get request details
  const { data: request, error } = await supabase
    .from('requests')
    .select(`
      *,
      pharmacy:pharmacies!pharmacy_id(name, address, phone, email),
      responses(*)
    `)
    .eq('id', id)
    .eq('doctor_id', user.id)
    .single()

  if (error || !request) {
    notFound()
  }

  const response = request.responses?.[0]

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-6 w-6 text-yellow-500" />
      case 'accepted':
        return <CheckCircle className="h-6 w-6 text-green-500" />
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />
      case 'expired':
        return <AlertCircle className="h-6 w-6 text-gray-500" />
      default:
        return null
    }
  }

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'pending':
        return '回答待ち'
      case 'accepted':
        return '承認済み'
      case 'rejected':
        return '却下'
      case 'expired':
        return '期限切れ'
      default:
        return status
    }
  }

  return (
    <div className="py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <Link
            href="/doctor/requests"
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
                  依頼詳細
                </h1>
                <p className="mt-1 text-sm text-gray-500">
                  作成日時: {new Date(request.created_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center">
                {getStatusIcon(request.status)}
                <span className="ml-2 text-lg font-medium">
                  {getStatusLabel(request.status)}
                </span>
              </div>
            </div>
          </div>

          {/* Pharmacy Info */}
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900 mb-3">
              送信先薬局
            </h2>
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="font-medium text-gray-900">{request.pharmacy.name}</p>
              <div className="mt-2 space-y-1 text-sm text-gray-600">
                <p className="flex items-center">
                  <MapPin className="h-4 w-4 mr-2" />
                  {request.pharmacy.address}
                </p>
                {request.pharmacy.phone && (
                  <p className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    {request.pharmacy.phone}
                  </p>
                )}
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

          {/* Response */}
          {response && (
            <div className="px-4 py-5 sm:px-6">
              <h2 className="text-lg font-medium text-gray-900 mb-3">
                薬局からの回答
              </h2>
              
              <div className={`rounded-lg p-4 ${
                response.accepted ? 'bg-green-50' : 'bg-red-50'
              }`}>
                <div className="flex items-center mb-2">
                  {response.accepted ? (
                    <>
                      <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                      <span className="font-medium text-green-900">
                        受け入れを承認しました
                      </span>
                    </>
                  ) : (
                    <>
                      <XCircle className="h-5 w-5 text-red-600 mr-2" />
                      <span className="font-medium text-red-900">
                        受け入れを却下しました
                      </span>
                    </>
                  )}
                </div>

                {!response.accepted && response.rejection_reasons && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700">却下理由:</p>
                    <ul className="mt-1 text-sm text-gray-600">
                      {Object.entries(response.rejection_reasons).map(([key, value]) => {
                        if (!value) return null
                        const label = {
                          inventory: '在庫不足',
                          capacity: 'キャパシティ不足',
                          controlled_substance: '管理薬品',
                          out_of_scope: '対応範囲外',
                          other: 'その他'
                        }[key] || key
                        
                        return (
                          <li key={key}>
                            • {label}
                            {key === 'other' && typeof value === 'string' && `: ${value}`}
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}

                {response.notes && (
                  <div className="mt-3">
                    <p className="text-sm font-medium text-gray-700">備考:</p>
                    <p className="mt-1 text-sm text-gray-600">
                      {response.notes}
                    </p>
                  </div>
                )}

                <p className="mt-3 text-xs text-gray-500">
                  回答日時: {new Date(response.responded_at).toLocaleDateString('ja-JP', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}