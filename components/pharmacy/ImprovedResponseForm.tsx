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
  const [responseType, setResponseType] = useState<'accept' | 'conditional' | 'reject' | null>(null)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedTemplate, setSelectedTemplate] = useState('')
  const [showSuccess, setShowSuccess] = useState(false)
  const [customConditions, setCustomConditions] = useState<string[]>([])
  const router = useRouter()
  const supabase = createClient()

  // 返信テンプレート
  const responseTemplates = {
    // 受け入れパターン
    accept: {
      title: '受け入れ可能',
      templates: [
        {
          id: 'accept_standard',
          title: '通常受け入れ',
          content: 'お問い合わせありがとうございます。患者様の受け入れを承認させていただきます。\n担当薬剤師より、訪問日程の調整についてご連絡させていただきます。'
        },
        {
          id: 'accept_urgent',
          title: '緊急対応受け入れ',
          content: '緊急性を考慮し、優先的に対応させていただきます。\n本日中に担当薬剤師より連絡させていただき、早急に訪問の手配をいたします。'
        },
        {
          id: 'accept_next_week',
          title: '来週以降の受け入れ',
          content: '受け入れ可能ですが、現在の予約状況により、初回訪問は来週以降となります。\n詳細な日程については、改めてご相談させていただきます。'
        }
      ]
    },
    // 条件付き受け入れパターン
    conditional: {
      title: '条件付き受け入れ',
      templates: [
        {
          id: 'cond_time',
          title: '時間制限あり',
          content: '受け入れ可能ですが、以下の条件がございます：\n・訪問可能時間：平日9:00-17:00\n・土日祝日は対応不可\n上記条件でよろしければ、詳細を調整させていただきます。'
        },
        {
          id: 'cond_service',
          title: 'サービス制限あり',
          content: '基本的な薬剤管理は対応可能ですが、以下の点にご留意ください：\n・24時間対応は不可\n・無菌製剤の調製は対応不可\n・麻薬の取り扱いは要相談\n上記をご了承いただければ、受け入れ可能です。'
        },
        {
          id: 'cond_area',
          title: 'エリア条件あり',
          content: '患者様の所在地が当薬局の標準訪問エリアの境界付近のため、以下の条件での対応となります：\n・訪問頻度は月2回まで\n・緊急時の即日対応は困難\n・交通費の別途請求あり\nご了承いただければ対応させていただきます。'
        },
        {
          id: 'cond_medication',
          title: '薬剤条件あり',
          content: '処方内容を確認し、以下の条件で対応可能です：\n・一部の特殊製剤は取り寄せに時間がかかる場合があります\n・在庫状況により、初回は部分的な対応となる可能性があります\n詳細は担当薬剤師よりご説明させていただきます。'
        }
      ]
    },
    // お断りパターン
    reject: {
      title: '受け入れ困難',
      templates: [
        {
          id: 'reject_capacity',
          title: '受け入れ上限',
          content: '大変申し訳ございませんが、現在当薬局の在宅患者数が上限に達しており、新規の受け入れが困難な状況です。\n大変恐縮ですが、他の薬局をご検討いただけますでしょうか。'
        },
        {
          id: 'reject_area',
          title: 'エリア外',
          content: '申し訳ございませんが、患者様の所在地が当薬局の訪問可能エリア外となります。\n患者様のお近くの薬局をご利用いただくことをお勧めいたします。'
        },
        {
          id: 'reject_specialty',
          title: '専門性不適合',
          content: '患者様の治療内容を確認させていただきましたが、当薬局では十分な対応が困難と判断いたしました。\nより専門的な対応が可能な薬局をご検討いただければ幸いです。'
        },
        {
          id: 'reject_resource',
          title: 'リソース不足',
          content: '現在、薬剤師の人員不足により、新規の在宅患者様の受け入れを一時的に停止しております。\n状況が改善され次第、改めてご相談いただければ幸いです。'
        }
      ]
    }
  }

  // 条件リスト
  const conditionOptions = [
    { id: 'time_limit', label: '訪問時間に制限あり' },
    { id: 'no_24h', label: '24時間対応不可' },
    { id: 'no_weekend', label: '土日祝日対応不可' },
    { id: 'no_sterile', label: '無菌製剤対応不可' },
    { id: 'no_narcotics', label: '麻薬取扱不可' },
    { id: 'area_limit', label: '訪問エリアに制限あり' },
    { id: 'frequency_limit', label: '訪問頻度に制限あり' },
    { id: 'extra_fee', label: '追加料金が発生' },
    { id: 'delay_start', label: '開始時期が遅れる' },
    { id: 'medication_limit', label: '一部薬剤の取扱に制限' }
  ]

  const getTemplates = () => {
    if (!responseType) return []
    return responseTemplates[responseType]?.templates || []
  }

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplates().find(t => t.id === templateId)
    if (template) {
      setNotes(template.content)
      setSelectedTemplate(templateId)
    }
  }

  const toggleCondition = (conditionId: string) => {
    setCustomConditions(prev =>
      prev.includes(conditionId)
        ? prev.filter(id => id !== conditionId)
        : [...prev, conditionId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!responseType) return

    setIsSubmitting(true)

    try {
      // 条件付き受け入れの場合、条件を本文に追加
      let finalNotes = notes
      if (responseType === 'conditional' && customConditions.length > 0) {
        const conditionText = customConditions
          .map(id => conditionOptions.find(opt => opt.id === id)?.label)
          .filter(Boolean)
          .join('\n・')
        finalNotes = `${notes}\n\n【条件・制限事項】\n・${conditionText}`
      }

      const response = await fetch(`/api/requests/${requestId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          pharmacyId,
          accepted: responseType !== 'reject',
          notes: finalNotes.trim(),
          responseType,
          conditions: responseType === 'conditional' ? customConditions : []
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
        {/* 返信タイプ選択 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            返信内容を選択してください
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setResponseType('accept')}
              className={`p-4 rounded-lg border-2 transition-all ${
                responseType === 'accept'
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <CheckCircle className={`h-6 w-6 mx-auto mb-2 ${
                responseType === 'accept' ? 'text-green-600' : 'text-gray-400'
              }`} />
              <span className={`block text-sm font-medium ${
                responseType === 'accept' ? 'text-green-700' : 'text-gray-700'
              }`}>
                受け入れ可能
              </span>
              <span className="text-xs text-gray-500 mt-1 block">
                問題なく対応できます
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => setResponseType('conditional')}
              className={`p-4 rounded-lg border-2 transition-all ${
                responseType === 'conditional'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <AlertCircle className={`h-6 w-6 mx-auto mb-2 ${
                responseType === 'conditional' ? 'text-amber-600' : 'text-gray-400'
              }`} />
              <span className={`block text-sm font-medium ${
                responseType === 'conditional' ? 'text-amber-700' : 'text-gray-700'
              }`}>
                条件付き受け入れ
              </span>
              <span className="text-xs text-gray-500 mt-1 block">
                一部制限があります
              </span>
            </button>
            
            <button
              type="button"
              onClick={() => setResponseType('reject')}
              className={`p-4 rounded-lg border-2 transition-all ${
                responseType === 'reject'
                  ? 'border-red-500 bg-red-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <ThumbsDown className={`h-6 w-6 mx-auto mb-2 ${
                responseType === 'reject' ? 'text-red-600' : 'text-gray-400'
              }`} />
              <span className={`block text-sm font-medium ${
                responseType === 'reject' ? 'text-red-700' : 'text-gray-700'
              }`}>
                受け入れ困難
              </span>
              <span className="text-xs text-gray-500 mt-1 block">
                対応が難しい状況です
              </span>
            </button>
          </div>
        </div>

        {/* 条件選択（条件付き受け入れの場合） */}
        <AnimatePresence mode="wait">
          {responseType === 'conditional' && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3">
                制限事項を選択してください（複数選択可）
              </label>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {conditionOptions.map((condition) => (
                    <label
                      key={condition.id}
                      className="flex items-center space-x-3 cursor-pointer hover:bg-amber-100 p-2 rounded-md transition-colors"
                    >
                      <input
                        type="checkbox"
                        checked={customConditions.includes(condition.id)}
                        onChange={() => toggleCondition(condition.id)}
                        className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 h-4 w-4"
                      />
                      <span className="text-sm text-gray-900 select-none">{condition.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* テンプレート選択 */}
        <AnimatePresence mode="wait">
          {responseType && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              <label className="block text-sm font-medium text-gray-700 mb-3">
                返信テンプレートを選択（任意）
              </label>
              <div className="space-y-2">
                {getTemplates().map((template) => (
                  <button
                    key={template.id}
                    type="button"
                    onClick={() => handleTemplateSelect(template.id)}
                    className={`w-full text-left p-3 rounded-lg border transition-all ${
                      selectedTemplate === template.id
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
        {responseType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
          >
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              返信メッセージ
            </label>
            <textarea
              id="notes"
              rows={6}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
              placeholder={
                responseType === 'accept' 
                  ? "受け入れに関する詳細情報をご記入ください..." 
                  : responseType === 'conditional'
                  ? "条件や制限事項の詳細をご記入ください..."
                  : "お断りの理由や代替案をご記入ください..."
              }
            />
            <p className="mt-2 text-sm text-gray-500">
              {notes.length}/1000文字
            </p>
          </motion.div>
        )}

        {/* 注意事項 */}
        {responseType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-lg flex items-start gap-3 ${
              responseType === 'accept' ? 'bg-green-50' : 
              responseType === 'conditional' ? 'bg-amber-50' : 'bg-red-50'
            }`}
          >
            <AlertCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${
              responseType === 'accept' ? 'text-green-600' : 
              responseType === 'conditional' ? 'text-amber-600' : 'text-red-600'
            }`} />
            <div className="text-sm">
              {responseType === 'accept' ? (
                <div className="text-green-800">
                  <p className="font-medium mb-1">受け入れ前にご確認ください：</p>
                  <ul className="list-disc list-inside space-y-1 text-green-700">
                    <li>現在の受入可能数に余裕があるか</li>
                    <li>患者様の居住地が訪問可能エリア内か</li>
                    <li>必要な医療機器・薬剤の対応が可能か</li>
                  </ul>
                </div>
              ) : responseType === 'conditional' ? (
                <div className="text-amber-800">
                  <p className="font-medium mb-1">条件付き受け入れの注意点：</p>
                  <ul className="list-disc list-inside space-y-1 text-amber-700">
                    <li>制限事項を明確に伝えてください</li>
                    <li>条件を具体的に記載してください</li>
                    <li>今後の改善可能性があれば言及してください</li>
                  </ul>
                </div>
              ) : (
                <div className="text-red-800">
                  <p className="font-medium mb-1">お断りする場合の注意点：</p>
                  <ul className="list-disc list-inside space-y-1 text-red-700">
                    <li>お断りの理由を明確に伝えることが重要です</li>
                    <li>可能であれば代替案を提示してください</li>
                    <li>将来的な受入可能性があれば伝えてください</li>
                  </ul>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 送信ボタン */}
        {responseType && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium text-white transition-all ${
                responseType === 'accept'
                  ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400'
                  : responseType === 'conditional'
                  ? 'bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400'
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
                  {responseType === 'accept' ? '受け入れを送信' : 
                   responseType === 'conditional' ? '条件付き受け入れを送信' : 
                   'お断りを送信'}
                </>
              )}
            </button>
          </motion.div>
        )}
      </form>
    </div>
  )
}