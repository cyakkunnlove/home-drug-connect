import { createClient } from '@/lib/supabase/server'
import { notFound, redirect } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, User, Clock, MapPin, Pill, Heart, Brain, 
  FileText, CheckCircle, XCircle, AlertTriangle, 
  Calendar, Phone, Mail, Building, Sparkles, MessageSquare,
  ThumbsUp, ThumbsDown, Globe, Shield
} from 'lucide-react'
import ImprovedResponseForm from '@/components/pharmacy/ImprovedResponseForm'

export default async function ImprovedPharmacyRequestDetailPage({
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

  // AI分析による推奨事項（デモ用）
  const getAIRecommendations = () => {
    const recommendations = []
    
    if (request.patient_info?.medications?.some((med: any) => 
      med.name?.includes('麻薬') || med.name?.includes('オピオイド')
    )) {
      recommendations.push({
        type: 'warning',
        icon: Shield,
        text: '麻薬取扱いが必要です。貴薬局の麻薬免許を確認してください。'
      })
    }
    
    if (request.patient_info?.conditions?.some((cond: string) =>
      cond.includes('末期') || cond.includes('ターミナル')
    )) {
      recommendations.push({
        type: 'info',
        icon: Heart,
        text: '終末期ケアの患者様です。24時間対応体制が推奨されます。'
      })
    }
    
    const medicationCount = request.patient_info?.medications?.length || 0
    if (medicationCount > 5) {
      recommendations.push({
        type: 'info',
        icon: Pill,
        text: `${medicationCount}種類の薬剤管理が必要です。相互作用に注意してください。`
      })
    }
    
    // キャパシティチェック
    const capacityRate = pharmacy.max_capacity 
      ? (pharmacy.accepted_patients_count / pharmacy.max_capacity) * 100
      : 0
    
    if (capacityRate > 80) {
      recommendations.push({
        type: 'warning',
        icon: AlertTriangle,
        text: '受入可能数が残り少なくなっています。慎重にご検討ください。'
      })
    }
    
    return recommendations
  }

  const recommendations = getAIRecommendations()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/dashboard/requests"
              className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              依頼一覧に戻る
            </Link>
            
            {request.status === 'pending' && !hasResponded && (
              <div className="flex items-center gap-3">
                <button className="inline-flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-sm">
                  <ThumbsUp className="h-5 w-5" />
                  <span>承認する</span>
                </button>
                <button className="inline-flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors shadow-sm">
                  <ThumbsDown className="h-5 w-5" />
                  <span>拒否する</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* メインコンテンツ */}
          <div className="lg:col-span-2 space-y-6">
            {/* タイトルカード */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 mb-2">
                    在宅医療依頼
                  </h1>
                  <div className="flex items-center text-sm text-gray-500">
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
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    回答待ち
                  </span>
                )}
              </div>

              {/* AI要約 */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-purple-600 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-gray-900 mb-1">AI要約</p>
                    <p className="text-sm text-gray-700">
                      {request.doctor?.organization_name || '医療機関'}からの依頼です。
                      薬剤{request.patient_info?.medications?.length || 0}種類の管理が必要で、
                      {request.patient_info?.conditions?.length > 0 && 
                        `既往歴として${request.patient_info.conditions.join('、')}があります。`
                      }
                      {request.patient_info?.treatment_plan && '今後の治療方針が記載されています。'}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* 依頼元情報 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Building className="h-5 w-5 text-gray-400" />
                依頼元情報
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500 mb-1">医療機関</p>
                  <p className="font-medium text-gray-900">
                    {request.doctor?.organization_name || '未設定'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 mb-1">連絡先</p>
                  <p className="font-medium text-gray-900 flex items-center gap-2">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {request.doctor.email}
                  </p>
                </div>
              </div>
            </div>

            {/* 患者情報 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5 text-gray-400" />
                患者情報
              </h2>
              
              {/* 服用薬 */}
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                  <Pill className="h-4 w-4 text-gray-400" />
                  服用中の薬
                </h3>
                {request.patient_info?.medications?.length > 0 ? (
                  <div className="space-y-2">
                    {request.patient_info.medications.map((med: any, index: number) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <p className="font-medium text-gray-900">
                          {med.name}
                        </p>
                        {(med.dosage || med.frequency) && (
                          <p className="text-sm text-gray-600 mt-1">
                            {med.dosage && `用量: ${med.dosage}`}
                            {med.dosage && med.frequency && ' / '}
                            {med.frequency && `用法: ${med.frequency}`}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">薬剤情報なし</p>
                )}
              </div>

              {/* 既往歴 */}
              {request.patient_info?.conditions?.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Heart className="h-4 w-4 text-gray-400" />
                    既往・現疾患
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {request.patient_info.conditions.map((condition: string, index: number) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-sm"
                      >
                        {condition}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 治療方針 */}
              {request.patient_info?.treatment_plan && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <Brain className="h-4 w-4 text-gray-400" />
                    今後の治療方針
                  </h3>
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {request.patient_info.treatment_plan}
                    </p>
                  </div>
                </div>
              )}

              {/* 備考 */}
              {request.patient_info?.notes && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-gray-400" />
                    備考
                  </h3>
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">
                      {request.patient_info.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 依頼文書 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-gray-400" />
                依頼文書
              </h2>
              <div className="p-4 bg-gray-50 rounded-lg">
                <pre className="whitespace-pre-wrap text-sm text-gray-700 font-sans">
                  {request.ai_document || '依頼文なし'}
                </pre>
              </div>
            </div>
          </div>

          {/* サイドバー */}
          <div className="space-y-6">
            {/* AI推奨事項 */}
            {recommendations.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  AI推奨事項
                </h3>
                <div className="space-y-3">
                  {recommendations.map((rec, index) => (
                    <div 
                      key={index}
                      className={`p-3 rounded-lg flex items-start gap-3 ${
                        rec.type === 'warning' ? 'bg-yellow-50' : 'bg-blue-50'
                      }`}
                    >
                      <rec.icon className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
                        rec.type === 'warning' ? 'text-yellow-600' : 'text-blue-600'
                      }`} />
                      <p className={`text-sm ${
                        rec.type === 'warning' ? 'text-yellow-800' : 'text-blue-800'
                      }`}>
                        {rec.text}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 受入状況 */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                現在の受入状況
              </h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">受入患者数</span>
                    <span className="text-lg font-bold text-gray-900">
                      {pharmacy.accepted_patients_count} / {pharmacy.max_capacity || '∞'}
                    </span>
                  </div>
                  {pharmacy.max_capacity && (
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 h-full transition-all duration-500"
                        style={{ 
                          width: `${Math.min(100, (pharmacy.accepted_patients_count / pharmacy.max_capacity) * 100)}%` 
                        }}
                      />
                    </div>
                  )}
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-600">
                    {pharmacy.max_capacity ? (
                      pharmacy.accepted_patients_count < pharmacy.max_capacity ? (
                        <span className="text-green-600 font-medium">
                          あと{pharmacy.max_capacity - pharmacy.accepted_patients_count}名受入可能です
                        </span>
                      ) : (
                        <span className="text-red-600 font-medium">
                          受入上限に達しています
                        </span>
                      )
                    ) : (
                      <span className="text-gray-600">
                        受入上限は設定されていません
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* 回答セクション */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              {hasResponded ? (
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 ${
                    response.accepted
                      ? 'bg-green-100'
                      : 'bg-red-100'
                  }`}>
                    {response.accepted ? (
                      <CheckCircle className="h-8 w-8 text-green-600" />
                    ) : (
                      <XCircle className="h-8 w-8 text-red-600" />
                    )}
                  </div>
                  <p className="font-medium text-gray-900 mb-2">
                    {response.accepted ? '承認済み' : '拒否済み'}
                  </p>
                  <p className="text-sm text-gray-600">
                    この依頼には既に回答済みです
                  </p>
                  {response.notes && (
                    <div className="mt-4 text-left">
                      <p className="text-sm font-medium text-gray-700 mb-1">送信した備考:</p>
                      <p className="text-sm text-gray-600 p-3 bg-gray-50 rounded-lg">
                        {response.notes}
                      </p>
                    </div>
                  )}
                </div>
              ) : request.status === 'expired' ? (
                <div className="text-center">
                  <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">
                    この依頼は期限切れです
                  </p>
                </div>
              ) : (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    回答する
                  </h3>
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
    </div>
  )
}