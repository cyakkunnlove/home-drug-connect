'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ResponseFormProps {
  requestId: string
  pharmacyId: string
}

const REJECTION_REASONS = [
  { key: 'inventory', label: '在庫不足' },
  { key: 'capacity', label: 'キャパシティ超過' },
  { key: 'controlled_substance', label: '管理薬品のため対応不可' },
  { key: 'out_of_scope', label: '対応範囲外' }
]

export default function ResponseForm({ requestId, pharmacyId }: ResponseFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [response, setResponse] = useState<'accept' | 'reject' | null>(null)
  const [rejectionReasons, setRejectionReasons] = useState<Record<string, boolean>>({})
  const [otherReason, setOtherReason] = useState('')
  const [notes, setNotes] = useState('')

  const toggleReason = (reason: string) => {
    setRejectionReasons(prev => ({
      ...prev,
      [reason]: !prev[reason]
    }))
  }

  const handleSubmit = async (accepted: boolean) => {
    if (!accepted && Object.values(rejectionReasons).every(v => !v) && !otherReason) {
      toast.error('却下理由を選択してください')
      return
    }

    setIsSubmitting(true)
    try {
      const finalRejectionReasons = accepted ? {} : {
        ...rejectionReasons,
        ...(otherReason ? { other: otherReason } : {})
      }

      const res = await fetch('/api/responses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId,
          accepted,
          rejectionReasons: finalRejectionReasons,
          notes
        })
      })

      const data = await res.json()
      
      if (data.success) {
        toast.success(accepted ? '依頼を承認しました' : '依頼を却下しました')
        router.push('/dashboard/requests')
        router.refresh()
      } else {
        throw new Error(data.error)
      }
    } catch (error) {
      console.error('Error submitting response:', error)
      toast.error('回答の送信に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Response Selection */}
      <div className="bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          この依頼への回答を選択してください
        </h3>
        
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => setResponse('accept')}
            className={`relative rounded-lg border p-4 flex flex-col items-center cursor-pointer hover:border-gray-400 ${
              response === 'accept' 
                ? 'border-green-500 bg-green-50' 
                : 'border-gray-300 bg-white'
            }`}
          >
            <CheckCircle className={`h-8 w-8 ${
              response === 'accept' ? 'text-green-600' : 'text-gray-400'
            }`} />
            <span className={`mt-2 block text-sm font-medium ${
              response === 'accept' ? 'text-green-900' : 'text-gray-900'
            }`}>
              承認する
            </span>
            <span className="mt-1 text-xs text-gray-500">
              患者の受け入れを承認します
            </span>
          </button>

          <button
            type="button"
            onClick={() => setResponse('reject')}
            className={`relative rounded-lg border p-4 flex flex-col items-center cursor-pointer hover:border-gray-400 ${
              response === 'reject' 
                ? 'border-red-500 bg-red-50' 
                : 'border-gray-300 bg-white'
            }`}
          >
            <XCircle className={`h-8 w-8 ${
              response === 'reject' ? 'text-red-600' : 'text-gray-400'
            }`} />
            <span className={`mt-2 block text-sm font-medium ${
              response === 'reject' ? 'text-red-900' : 'text-gray-900'
            }`}>
              却下する
            </span>
            <span className="mt-1 text-xs text-gray-500">
              患者の受け入れを却下します
            </span>
          </button>
        </div>
      </div>

      {/* Rejection Reasons */}
      {response === 'reject' && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h4 className="text-sm font-medium text-gray-900 mb-3">
            却下理由を選択してください <span className="text-red-500">*</span>
          </h4>
          
          <div className="space-y-2">
            {REJECTION_REASONS.map(reason => (
              <label key={reason.key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={rejectionReasons[reason.key] || false}
                  onChange={() => toggleReason(reason.key)}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">{reason.label}</span>
              </label>
            ))}
            
            <div className="mt-3">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={!!otherReason}
                  onChange={(e) => {
                    if (!e.target.checked) setOtherReason('')
                  }}
                  className="rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <span className="ml-2 text-sm text-gray-700">その他</span>
              </label>
              {(rejectionReasons.other || otherReason) && (
                <input
                  type="text"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder="その他の理由を入力"
                  className="mt-2 ml-6 block w-full rounded-md border-gray-300 shadow-sm focus:border-red-500 focus:ring-red-500 sm:text-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Notes */}
      {response && (
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            備考・メッセージ（任意）
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder={response === 'accept' 
              ? '受け入れに関する補足事項があれば記入してください' 
              : '却下理由の詳細や代替案があれば記入してください'
            }
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
          />
        </div>
      )}

      {/* Submit Buttons */}
      {response && (
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={() => {
              setResponse(null)
              setRejectionReasons({})
              setOtherReason('')
              setNotes('')
            }}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={() => handleSubmit(response === 'accept')}
            disabled={isSubmitting}
            className={`inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
              response === 'accept'
                ? 'bg-green-600 hover:bg-green-700'
                : 'bg-red-600 hover:bg-red-700'
            } disabled:bg-gray-400`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
                送信中...
              </>
            ) : (
              response === 'accept' ? '承認を確定' : '却下を確定'
            )}
          </button>
        </div>
      )}
    </div>
  )
}