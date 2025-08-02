'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { 
  ThumbsUp, ThumbsDown, Send, FileText, Clock, 
  Calendar, User, AlertCircle, CheckCircle
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ImprovedResponseFormProps {
  requestId: string
  pharmacyId: string
}

export default function ImprovedResponseForm({ requestId, pharmacyId }: ImprovedResponseFormProps) {
  const [decision, setDecision] = useState<'accept' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  // テンプレート
  const acceptTemplates = [
    {
      id: 'accept1',
      title: '通常承認',
      content: 'お問い合わせありがとうございます。患者様の受け入れを承認させていただきます。訪問日時については追ってご連絡させていただきます。'
    },
    {
      id: 'accept2',
      title: '条件付き承認',
      content: '受け入れ可能ですが、以下の点についてご確認をお願いします。\n・訪問可能時間帯：平日9:00-17:00\n・初回訪問は来週以降となります'
    },
    {
      id: 'accept3',
      title: '緊急対応承認',
      content: '緊急性を考慮し、優先的に対応させていただきます。本日中に担当薬剤師より連絡させていただきます。'
    }
  ]

  const rejectTemplates = [
    {
      id: 'reject1',
      title: 'キャパシティ不足',
      content: '大変申し訳ございませんが、現在受け入れ可能な患者数が上限に達しているため、お受けすることができません。'
    },
    {
      id: 'reject2',
      title: 'エリア外',
      content: '申し訳ございませんが、患者様のお住まいが当薬局の訪問可能エリア外となるため、対応が困難です。'
    },
    {
      id: 'reject3',
      title: '専門性不適合',
      content: '患者様の状態を確認させていただきましたが、当薬局では適切な対応が困難と判断いたしました。より専門的な薬局をご検討ください。'
    }
  ]

  const templates = decision === 'accept' ? acceptTemplates : rejectTemplates

  const handleTemplateSelect = (template: string) => {
    setNotes(template)
    setSelectedTemplate(template)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!decision) return

    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pharmacyId,
          accepted: decision === 'accept',
          notes: notes.trim()
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to submit response')
      }

      setShowSuccess(true)
      setTimeout(() => {
        router.push('/dashboard/requests')
        router.refresh()
      }, 2000)
    } catch (error) {
      console.error('Error submitting response:', error)
      alert('エラーが発生しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* 成功メッセージ */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 flex items-center justify-center z-50 px-4"
          >
            <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full">
              <div className="text-center">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  回答を送信しました
                </h3>
                <p className="text-gray-600">
                  依頼元に回答が送信されました
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* 承認/拒否選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            回答を選択してください
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setDecision('accept')}
              className={`p-4 rounded-lg border-2 transition-all ${
                decision === 'accept'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ThumbsUp className={`h-6 w-6 mx-auto mb-2 ${
                decision === 'accept' ? 'text-green-600' : 'text-gray-400'
              }`} />
              <span className={`block text-sm font-medium ${
                decision === 'accept' ? 'text-green-700' : 'text-gray-700'
              }`}>
                承認する
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => setDecision('reject')}
              className={`p-4 rounded-lg border-2 transition-all ${
                decision === 'reject'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ThumbsDown className={`h-6 w-6 mx-auto mb-2 ${
                decision === 'reject' ? 'text-red-600' : 'text-gray-400'
              }`} />
              <span className={`block text-sm font-medium ${
                decision === 'reject' ? 'text-red-700' : 'text-gray-700'
              }`}>
                拒否する
              </span>
            </button>
          </div>
        </div>

        {/* テンプレート選択 */}
        <AnimatePresence mode="wait">
          {decision && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3">
                テンプレートを選択（任意）
              </label>
              <div className="space-y-2">
                {templates.map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template.content)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTemplate === template.content
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <FileText className="h-5 w-5 text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {template.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                          {template.content}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* メッセージ入力 */}
        {decision && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              メッセージ（任意）
            </label>
            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={decision === 'accept' 
                ? "承認に関する詳細や条件があれば記入してください..." 
                : "拒否の理由や代替案があれば記入してください..."
              }
            />
            <p className="mt-2 text-sm text-gray-500">
              {notes.length}/500文字
            </p>
          </motion.div>
        )}

        {/* 注意事項 */}
        {decision && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-lg flex items-start gap-3 ${
              decision === 'accept' ? 'bg-green-50' : 'bg-red-50'
            }`}
          >
            <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              decision === 'accept' ? 'text-green-600' : 'text-red-600'
            }`} />
            <div className="text-sm">
              {decision === 'accept' ? (
                <div className="text-green-800">
                  <p className="font-medium mb-1">承認する前にご確認ください：</p>
                  <ul className="list-disc list-inside space-y-1 text-green-700">
                    <li>現在の受入可能数に余裕があるか</li>
                    <li>患者様の居住地が訪問可能エリア内か</li>
                    <li>必要な医療機器・薬剤の対応が可能か</li>
                  </ul>
                </div>
              ) : (
                <div className="text-red-800">
                  <p className="font-medium mb-1">拒否する場合の注意点：</p>
                  <ul className="list-disc list-inside space-y-1 text-red-700">
                    <li>拒否理由を明確に伝えることが重要です</li>
                    <li>可能であれば代替案を提示してください</li>
                    <li>将来的な受入可能性があれば伝えてください</li>
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 送信ボタン */}
        {decision && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all ${
                decision === 'accept'
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                  : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
              }`}
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
                  送信中...
                </>
              ) : (
                <>
                  <Send className="h-5 w-5" />
                  {decision === 'accept' ? '承認を送信' : '拒否を送信'}
                </>
              )}
            </button>
          </motion.div>
        )}
      </form>
    </div>
  )
}