'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import DrugAutocomplete from './DrugAutocomplete'
import { Plus, Trash2, Loader2, Building2, Mail, User } from 'lucide-react'
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
  '高血圧',
  '糖尿病',
  '心疾患',
  '呼吸器疾患',
  '腎機能障害',
  '肝機能障害',
  'アレルギー歴'
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
  const [notes, setNotes] = useState('')

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

  const generateAIDocument = async () => {
    const validMedications = medications.filter(m => m.name)
    
    if (validMedications.length === 0) {
      toast.error('少なくとも1つの薬剤を入力してください')
      return
    }

    setIsGeneratingAI(true)
    console.log('[RequestForm] Starting AI document generation')
    
    try {
      const requestBody = {
        pharmacyName: pharmacy.name,
        doctorInfo,
        patientInfo: {
          medications: validMedications,
          conditions: otherCondition 
            ? [...conditions, `その他: ${otherCondition}`]
            : conditions,
          treatmentPlan,
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
            treatmentPlan,
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
            {doctorInfo.name && (
              <p className="text-sm text-green-700 flex items-center">
                <User className="h-3 w-3 mr-2" />
                {doctorInfo.name}
              </p>
            )}
            {doctorInfo.organization && (
              <p className="text-sm text-green-700 flex items-center">
                <Building2 className="h-3 w-3 mr-2" />
                {doctorInfo.organization}
              </p>
            )}
            {doctorInfo.email && (
              <p className="text-sm text-green-600 flex items-center">
                <Mail className="h-3 w-3 mr-2" />
                {doctorInfo.email}
              </p>
            )}
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
        <label className="block text-sm font-medium text-gray-700">
          服用中の薬 <span className="text-red-500">*</span>
        </label>
        <div className="mt-2 space-y-3">
          {medications.map((medication, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <DrugAutocomplete
                  value={medication.name}
                  onChange={(value) => updateMedication(index, 'name', value)}
                  onSelect={(drug) => updateMedication(index, 'name', drug.name)}
                  placeholder="薬剤名"
                />
              </div>
              <input
                type="text"
                value={medication.dosage}
                onChange={(e) => updateMedication(index, 'dosage', e.target.value)}
                placeholder="用量"
                className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
              />
              <select
                value={medication.frequency}
                onChange={(e) => updateMedication(index, 'frequency', e.target.value)}
                className="w-32 rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
              >
                <option value="">頻度</option>
                {FREQUENCIES.map(freq => (
                  <option key={freq} value={freq}>{freq}</option>
                ))}
              </select>
              <TouchFeedback
                onTap={() => removeMedication(index)}
                className={`p-3 rounded-lg transition-colors min-h-[44px] flex items-center justify-center ${
                  medications.length === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-red-600 hover:bg-red-50 active:bg-red-100'
                }`}
                disabled={medications.length === 1}
                hapticFeedback="light"
              >
                <Trash2 className="h-5 w-5" />
              </TouchFeedback>
            </div>
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {CONDITIONS.map(condition => (
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
          <div className="mt-4 pt-4 border-t border-gray-100">
            <input
              type="text"
              value={otherCondition}
              onChange={(e) => setOtherCondition(e.target.value)}
              placeholder="その他（自由記入）"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            />
          </div>
        </div>
      </div>

      {/* Treatment Plan */}
      <div>
        <label htmlFor="treatmentPlan" className="block text-sm font-medium text-gray-700">
          今後の治療方針
        </label>
        <textarea
          id="treatmentPlan"
          value={treatmentPlan}
          onChange={(e) => setTreatmentPlan(e.target.value)}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm bg-white"
          placeholder="今後の治療方針を入力してください"
        />
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
        <div className="flex justify-between items-center mb-4">
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