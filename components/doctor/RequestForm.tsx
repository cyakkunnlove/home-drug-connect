'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DrugAutocompleteWrapper from './DrugAutocompleteWrapper'
import { Plus, Trash2, Loader2, Building2, Mail, User, Sparkles, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import { motion, AnimatePresence } from 'framer-motion'
import TouchFeedback, { IOSButton } from '@/components/ui/TouchFeedback'
import AnimatedPage from '@/components/ui/AnimatedPage'

interface Medication {
  name: string
  dosage: string
  frequency: string
}

interface Pharmacy {
  id: string
  name: string
  address: string
}

interface RequestFormProps {
  pharmacy: Pharmacy
  doctorInfo?: {
    name?: string
    organization?: string
    email?: string
  }
}

const CONDITIONS = [
  // 循環器系
  '高血圧症',
  '心不全',
  '虚血性心疾患',
  '不整脈',
  '脳血管疾患',
  // 代謝・内分泌系
  '糖尿病',
  '脂質異常症',
  '甲状腺疾患',
  '痛風',
  // 呼吸器系
  '気管支喘息',
  'COPD',
  '肺炎の既往',
  '睡眠時無呼吸症候群',
  // 消化器系
  '胃潰瘍・十二指腸潰瘍',
  '逆流性食道炎',
  '肝機能障害',
  '慢性便秘',
  // 腎・泌尿器系
  '慢性腎臓病',
  '前立腺肥大症',
  '尿路感染症',
  // 神経・精神系
  '認知症',
  'パーキンソン病',
  'うつ病',
  '不眠症',
  '脳梗塞後遺症',
  // 運動器系
  '骨粗鬆症',
  '関節リウマチ',
  '変形性関節症',
  // その他
  'アレルギー疾患',
  '悪性腫瘍',
  '褥瘡'
]

// 治療方針テンプレート
const TREATMENT_PLAN_TEMPLATES = [
  {
    category: '状態管理',
    items: [
      { id: 'stable', text: '現在の処方を継続し、症状の安定を維持' },
      { id: 'adjustment', text: '症状に応じて薬剤の調整を検討' },
      { id: 'monitoring', text: '定期的なモニタリングを継続' }
    ]
  },
  {
    category: '生活習慣',
    items: [
      { id: 'diet', text: '食事療法の指導を継続' },
      { id: 'exercise', text: '適度な運動療法を推奨' },
      { id: 'weight', text: '体重管理の継続' },
      { id: 'smoking', text: '禁煙指導の継続' }
    ]
  },
  {
    category: '検査・評価',
    items: [
      { id: 'blood_test', text: '定期的な血液検査での評価' },
      { id: 'vital', text: 'バイタルサインの定期的な確認' },
      { id: 'imaging', text: '必要に応じて画像検査を実施' }
    ]
  },
  {
    category: '連携・サポート',
    items: [
      { id: 'family', text: '家族との連携を強化' },
      { id: 'care', text: '介護サービスとの連携' },
      { id: 'emergency', text: '緊急時の対応体制の確認' }
    ]
  }
]

const FREQUENCIES = [
  '1日1回',
  '1日2回',
  '1日3回',
  '1日4回',
  '食前',
  '食後',
  '食間',
  '就寝前',
  '頓服'
]

export default function RequestForm({ pharmacy, doctorInfo }: RequestFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [aiDocument, setAiDocument] = useState('')
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const formRef = useRef<HTMLFormElement>(null)
  
  const [medications, setMedications] = useState<Medication[]>([
    { name: '', dosage: '', frequency: '' }
  ])
  const [conditions, setConditions] = useState<string[]>([])
  const [otherCondition, setOtherCondition] = useState('')
  const [treatmentPlan, setTreatmentPlan] = useState('')
  const [treatmentPlanTemplates, setTreatmentPlanTemplates] = useState<string[]>([])
  const [customTreatmentPlan, setCustomTreatmentPlan] = useState('')
  const [medicationStock, setMedicationStock] = useState('')
  const [nextVisitDate, setNextVisitDate] = useState('')
  const [notes, setNotes] = useState('')
  const [isRefiningText, setIsRefiningText] = useState(false)
  const [hasRefinedText, setHasRefinedText] = useState(false)

  const addMedication = () => {
    setMedications([...medications, { name: '', dosage: '', frequency: '' }])
  }

  const removeMedication = (index: number) => {
    if (medications.length > 1) {
      setMedications(medications.filter((_, i) => i !== index))
    }
  }

  const updateMedication = (index: number, field: keyof Medication, value: string) => {
    const updated = [...medications]
    updated[index][field] = value
    setMedications(updated)
  }

  const toggleCondition = (condition: string) => {
    setConditions(prev =>
      prev.includes(condition)
        ? prev.filter(c => c !== condition)
        : [...prev, condition]
    )
  }

  const toggleTreatmentPlanTemplate = (templateId: string) => {
    setTreatmentPlanTemplates(prev =>
      prev.includes(templateId)
        ? prev.filter(id => id !== templateId)
        : [...prev, templateId]
    )
  }

  // 選択されたテンプレートから治療方針のテキストを生成
  const generateTreatmentPlanFromTemplates = () => {
    const selectedTexts: string[] = []
    
    TREATMENT_PLAN_TEMPLATES.forEach(category => {
      category.items.forEach(item => {
        if (treatmentPlanTemplates.includes(item.id)) {
          selectedTexts.push(item.text)
        }
      })
    })
    
    const templateText = selectedTexts.join('。')
    const fullText = customTreatmentPlan 
      ? `${templateText}${templateText ? '。' : ''}${customTreatmentPlan}`
      : templateText
    
    return fullText
  }

  const refineTreatmentPlan = async () => {
    const fullTreatmentPlan = generateTreatmentPlanFromTemplates()
    if (!fullTreatmentPlan || fullTreatmentPlan.length <= 20) return
    
    setIsRefiningText(true)
    try {
      const response = await fetch('/api/ai/refine-text', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: fullTreatmentPlan,
          field: 'treatmentPlan'
        })
      })

      if (!response.ok) {
        throw new Error('Failed to refine text')
      }

      const data = await response.json()
      if (data.success && data.refinedText) {
        setTreatmentPlan(data.refinedText)
        setHasRefinedText(true)
        toast.success('文章を校閲しました')
      }
    } catch (error) {
      console.error('Error refining text:', error)
      toast.error('文章の校閲に失敗しました')
    } finally {
      setIsRefiningText(false)
    }
  }

  const generateAIDocument = async () => {
    const validMedications = medications.filter(m => m.name)
    
    if (validMedications.length === 0) {
      toast.error('少なくとも1つの薬剤を入力してください')
      return
    }

    setIsGeneratingAI(true)
    console.log('[RequestForm] Starting AI document generation')
    
    try {
      // 治療方針を生成
      const fullTreatmentPlan = treatmentPlan || generateTreatmentPlanFromTemplates()
      
      const requestBody = {
        pharmacyName: pharmacy.name,
        doctorInfo,
        patientInfo: {
          medications: validMedications,
          conditions: otherCondition 
            ? [...conditions, `その他: ${otherCondition}`]
            : conditions,
          treatmentPlan: fullTreatmentPlan,
          medicationStock,
          nextVisitDate,
          notes
        }
      }
      
      console.log('[RequestForm] Request payload:', {
        pharmacyName: requestBody.pharmacyName,
        doctorInfo: requestBody.doctorInfo ? 'present' : 'missing',
        medicationsCount: requestBody.patientInfo.medications.length,
        conditionsCount: requestBody.patientInfo.conditions.length
      })
      
      const response = await fetch('/api/ai/generate-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })

      console.log('[RequestForm] Response status:', response.status)
      
      if (!response.ok) {
        let errorData
        try {
          errorData = await response.json()
        } catch (jsonError) {
          console.error('[RequestForm] Failed to parse error response:', jsonError)
          throw new Error(`サーバーエラー（ステータス: ${response.status}）`)
        }
        
        console.error('[RequestForm] API error response:', errorData)
        const errorMessage = errorData.error ||
          (response.status === 401 ? '認証が必要です。再度ログインしてください。' :
           response.status === 403 ? '医師権限が必要です。' :
           response.status === 500 ? 'サーバー内部エラーが発生しました。' :
           'AI依頼文の生成に失敗しました')
        
        throw new Error(errorMessage)
      }

      const data = await response.json()
      console.log('[RequestForm] API response:', {
        success: data.success,
        hasDocument: !!data.aiDocument,
        usingTemplate: data.usingTemplate,
        fallbackReason: data.fallbackReason
      })
      
      if (data.success && data.aiDocument) {
        setAiDocument(data.aiDocument)
        
        let successMessage = 'AI依頼文を生成しました'
        if (data.usingTemplate) {
          successMessage += '（テンプレートを使用）'
        }
        
        toast.success(successMessage)
      } else {
        throw new Error(data.error || 'AI依頼文の生成に失敗しました')
      }
    } catch (error) {
      console.error('[RequestForm] Error generating AI document:', error)
      
      const errorMessage = error instanceof Error ? error.message : 'AI依頼文の生成に失敗しました'
      toast.error(errorMessage)
    } finally {
      setIsGeneratingAI(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const validMedications = medications.filter(m => m.name)
    
    if (validMedications.length === 0) {
      toast.error('少なくとも1つの薬剤を入力してください')
      return
    }

    if (!aiDocument) {
      toast.error('AI依頼文を生成してください')
      return
    }

    setIsSubmitting(true)
    try {
      // 治療方針を生成
      const fullTreatmentPlan = treatmentPlan || generateTreatmentPlanFromTemplates()
      
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          pharmacyId: pharmacy.id,
          doctorInfo,
          patientInfo: {
            medications: validMedications,
            conditions: otherCondition 
              ? [...conditions, `その他: ${otherCondition}`]
              : conditions,
            treatmentPlan: fullTreatmentPlan,
            medicationStock,
            nextVisitDate,
            notes
          },
          aiDocument
        })
      })

      const data = await response.json()
      
      if (data.success) {
        toast.success('依頼を送信しました')
        router.push('/doctor/requests')
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error submitting request:', error)
      toast.error('依頼の送信に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatedPage>
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Doctor Info */}
      {doctorInfo && (
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 rounded-xl p-4 border border-green-100"
        >
          <h3 className="text-sm font-semibold text-green-900 mb-2 flex items-center">
            <User className="h-4 w-4 mr-2" />
            依頼医師情報
          </h3>
          <div className="space-y-1">
            <p className="text-sm text-green-700 flex items-center">
              <User className="h-3 w-3 mr-2" />
              {doctorInfo.name || 'Unknown Doctor'}
            </p>
            <p className="text-sm text-green-700 flex items-center">
              <Building2 className="h-3 w-3 mr-2" />
              {doctorInfo.organization || '未設定'}
            </p>
            <p className="text-sm text-green-600 flex items-center">
              <Mail className="h-3 w-3 mr-2" />
              {doctorInfo.email || 'メールアドレス未設定'}
            </p>
          </div>
        </motion.div>
      )}

      {/* Pharmacy Info */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-blue-50 rounded-xl p-4 border border-blue-100"
      >
        <h3 className="text-sm font-semibold text-blue-900 mb-2 flex items-center">
          <Building2 className="h-4 w-4 mr-2" />
          送信先薬局
        </h3>
        <p className="text-sm text-blue-700 font-medium">{pharmacy.name}</p>
        <p className="text-sm text-blue-600">{pharmacy.address}</p>
      </motion.div>

      {/* Medications */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          服用中の薬 <span className="text-red-500">*</span>
        </label>
        <p className="text-xs text-gray-500 mb-3">薬剤名を入力し、用量と頻度を選択してください</p>
        <div className="space-y-4">
          {medications.map((medication, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-xl p-4 border border-gray-200"
            >
              <div className="space-y-3">
                {/* 薬剤名 - フルサイズ */}
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    薬剤名
                  </label>
                  <DrugAutocompleteWrapper
                    value={medication.name}
                    onChange={(value) => updateMedication(index, 'name', value)}
                    onSelect={(drug) => updateMedication(index, 'name', drug.n || drug.name)}
                    placeholder="薬剤名を入力（2文字以上）"
                    minChars={2}
                  />
                </div>
                
                {/* 用量と頻度 - 横並び（スマホでは縦並び） */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      用量（錠）
                    </label>
                    <select
                      value={medication.dosage}
                      onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
                    >
                      <option value="">選択してください</option>
                      {[...Array(19)].map((_, i) => {
                        const value = 0.5 + i * 0.5
                        return (
                          <option key={value} value={`${value}錠`}>
                            {value}錠
                          </option>
                        )
                      })}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      服用頻度
                    </label>
                    <select
                      value={medication.frequency}
                      onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                      className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
                    >
                      <option value="">選択してください</option>
                      {FREQUENCIES.map(freq => (
                        <option key={freq} value={freq}>{freq}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                {/* 削除ボタン */}
                {medications.length > 1 && (
                  <TouchFeedback
                    onTap={() => removeMedication(index)}
                    className="w-full py-2 px-4 text-red-600 text-sm font-medium rounded-lg border border-red-200 bg-white hover:bg-red-50 active:bg-red-100 transition-colors flex items-center justify-center min-h-[44px]"
                    hapticFeedback="light"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    この薬剤を削除
                  </TouchFeedback>
                )}
              </div>
            </motion.div>
          ))}
        </div>
        <TouchFeedback
          onTap={addMedication}
          className="mt-3 inline-flex items-center px-4 py-3 border border-gray-300 shadow-sm text-sm font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 min-h-[44px]"
          hapticFeedback="light"
        >
          <Plus className="h-4 w-4 mr-2" />
          薬剤を追加
        </TouchFeedback>
      </div>

      {/* Conditions */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          既往・現疾患
        </label>
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          {/* 循環器系 */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">循環器系</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONDITIONS.slice(0, 5).map(condition => (
                <label key={condition} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <input
                    type="checkbox"
                    checked={conditions.includes(condition)}
                    onChange={() => toggleCondition(condition)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-900 select-none">{condition}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 代謝・内分泌系 */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">代謝・内分泌系</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONDITIONS.slice(5, 9).map(condition => (
                <label key={condition} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <input
                    type="checkbox"
                    checked={conditions.includes(condition)}
                    onChange={() => toggleCondition(condition)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-900 select-none">{condition}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* 呼吸器系 */}
          <div className="p-4 border-b border-gray-100">
            <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">呼吸器系</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {CONDITIONS.slice(9, 13).map(condition => (
                <label key={condition} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                  <input
                    type="checkbox"
                    checked={conditions.includes(condition)}
                    onChange={() => toggleCondition(condition)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                  />
                  <span className="text-sm text-gray-900 select-none">{condition}</span>
                </label>
              ))}
            </div>
          </div>

          {/* その他の系統も同様に追加（省略のため折りたたみ） */}
          <details className="group">
            <summary className="px-4 py-3 bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">その他の疾患を表示</span>
              <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </summary>
            <div className="p-4 space-y-4">
              {/* 消化器系 */}
              <div className="border-t border-gray-100 pt-4">
                <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">消化器系</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {CONDITIONS.slice(13, 17).map(condition => (
                    <label key={condition} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                      <input
                        type="checkbox"
                        checked={conditions.includes(condition)}
                        onChange={() => toggleCondition(condition)}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                      />
                      <span className="text-sm text-gray-900 select-none">{condition}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              {/* 残りの疾患 */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {CONDITIONS.slice(17).map(condition => (
                  <label key={condition} className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                    <input
                      type="checkbox"
                      checked={conditions.includes(condition)}
                      onChange={() => toggleCondition(condition)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
                    />
                    <span className="text-sm text-gray-900 select-none">{condition}</span>
                  </label>
                ))}
              </div>
            </div>
          </details>
          
          <div className="p-4 bg-gray-50">
            <input
              type="text"
              value={otherCondition}
              onChange={(e) => setOtherCondition(e.target.value)}
              placeholder="その他の疾患（自由記入）"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Additional Information */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="medicationStock" className="block text-sm font-medium text-gray-700 mb-1">
            薬の残量
          </label>
          <select
            id="medicationStock"
            value={medicationStock}
            onChange={(e) => setMedicationStock(e.target.value)}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
          >
            <option value="">選択してください</option>
            <option value="本日分まで">本日分まで</option>
            <option value="1〜2日分">1〜2日分</option>
            <option value="3〜4日分">3〜4日分</option>
            <option value="1週間分">1週間分</option>
            <option value="2週間分">2週間分</option>
            <option value="3週間分">3週間分</option>
            <option value="1ヶ月分">1ヶ月分</option>
            <option value="それ以上">それ以上</option>
          </select>
        </div>
        
        <div>
          <label htmlFor="nextVisitDate" className="block text-sm font-medium text-gray-700 mb-1">
            次回往診予定日
          </label>
          <input
            type="date"
            id="nextVisitDate"
            value={nextVisitDate}
            onChange={(e) => setNextVisitDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm bg-white min-h-[44px]"
          />
        </div>
      </div>

      {/* Treatment Plan Templates */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          今後の治療方針
        </label>
        
        {/* テンプレート選択 */}
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
          {TREATMENT_PLAN_TEMPLATES.map((category, categoryIndex) => (
            <div key={category.category} className={`p-4 ${categoryIndex > 0 ? 'border-t border-gray-100' : ''}`}>
              <h4 className="text-xs font-semibold text-gray-600 mb-2 uppercase tracking-wider">{category.category}</h4>
              <div className="space-y-2">
                {category.items.map(item => (
                  <label key={item.id} className="flex items-start space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded-md transition-colors">
                    <input
                      type="checkbox"
                      checked={treatmentPlanTemplates.includes(item.id)}
                      onChange={() => toggleTreatmentPlanTemplate(item.id)}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 h-4 w-4 mt-0.5"
                    />
                    <span className="text-sm text-gray-900 select-none">{item.text}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
        
        {/* カスタム入力 */}
        <div>
          <label htmlFor="customTreatmentPlan" className="block text-sm font-medium text-gray-600 mb-1">
            追加の治療方針（任意）
          </label>
          <textarea
            id="customTreatmentPlan"
            value={customTreatmentPlan}
            onChange={(e) => setCustomTreatmentPlan(e.target.value)}
            rows={2}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
            placeholder="テンプレート以外の治療方針があれば入力してください"
          />
        </div>
        
        {/* 生成された治療方針のプレビュー */}
        {(treatmentPlanTemplates.length > 0 || customTreatmentPlan) && (
          <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-blue-800">生成される治療方針</p>
              {generateTreatmentPlanFromTemplates().length > 20 && (
                <button
                  type="button"
                  onClick={refineTreatmentPlan}
                  disabled={isRefiningText}
                  className={`inline-flex items-center px-2 py-1 text-xs font-medium rounded-md transition-colors ${
                    hasRefinedText
                      ? 'bg-green-100 text-green-700'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  } disabled:opacity-50`}
                >
                  {isRefiningText ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      校閲中...
                    </>
                  ) : hasRefinedText ? (
                    <>
                      <Check className="h-3 w-3 mr-1" />
                      校閲済み
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-3 w-3 mr-1" />
                      AI校閲
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-sm text-blue-700">
              {treatmentPlan || generateTreatmentPlanFromTemplates() || 'テンプレートを選択するか、カスタム入力してください'}
            </p>
          </div>
        )}
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          備考
        </label>
        <textarea
          id="notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
          placeholder="その他備考があれば入力してください"
        />
      </div>

      {/* AI Document Generation */}
      <div className="border-t pt-6">
        <div className="mb-4">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-lg font-medium text-gray-900">AI依頼文</h3>
            <IOSButton
              variant="primary"
              size="medium"
              onClick={generateAIDocument}
              disabled={isGeneratingAI || medications.every(m => !m.name)}
              className="min-w-[120px]"
            >
              {isGeneratingAI ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                  生成中...
                </>
              ) : (
                'AI依頼文を生成'
              )}
            </IOSButton>
          </div>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800 flex items-start">
              <span className="text-blue-600 mr-2 flex-shrink-0">💡</span>
              <span>AIが患者情報を元に、在宅対応薬局への依頼文を自動作成します。薬剤情報や患者の状態を適切に伝える文書を瞬時に生成し、スムーズな連携をサポートします。</span>
            </p>
          </div>
        </div>
        
        <AnimatePresence>
          {aiDocument && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
            >
              <motion.pre 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="whitespace-pre-wrap text-sm text-gray-700 leading-relaxed"
              >
                {aiDocument}
              </motion.pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-6 border-t border-gray-100"
      >
        <IOSButton
          variant="secondary"
          size="large"
          onClick={() => router.back()}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          キャンセル
        </IOSButton>
        <IOSButton
          variant="primary"
          size="large"
          onTap={() => formRef.current?.requestSubmit()}
          disabled={isSubmitting || !aiDocument}
          className="w-full sm:w-auto order-1 sm:order-2 min-w-[140px]"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              送信中...
            </>
          ) : (
            '依頼を送信'
          )}
        </IOSButton>
      </motion.div>
      </form>
    </AnimatedPage>
  )
}