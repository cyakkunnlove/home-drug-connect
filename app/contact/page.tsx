'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Send, Mail, Phone, MapPin, AlertCircle } from 'lucide-react'

export default function ContactPage() {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      category: formData.get('category') as string,
      message: formData.get('message') as string,
    }

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new Error('送信に失敗しました')
      }

      setSuccess(true)
      e.currentTarget.reset()
    } catch (err) {
      setError('送信中にエラーが発生しました。もう一度お試しください。')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-gray-600 hover:text-gray-900">
              <ChevronLeft className="w-6 h-6" />
            </Link>
            <h1 className="text-xl font-bold text-gray-900">お問い合わせ</h1>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 連絡先情報 */}
            <div className="md:col-span-1 space-y-6">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  お問い合わせ先
                </h2>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">メール</p>
                      <p className="text-gray-600 text-sm">
                        support@home-drug-connect.jp
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Phone className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">電話</p>
                      <p className="text-gray-600 text-sm">
                        03-1234-5678
                      </p>
                      <p className="text-gray-500 text-xs mt-1">
                        平日 9:00-18:00
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <MapPin className="w-5 h-5 text-gray-600 mt-0.5" />
                    <div>
                      <p className="font-medium text-gray-900">所在地</p>
                      <p className="text-gray-600 text-sm">
                        〒100-0001<br />
                        東京都千代田区千代田1-1-1
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="font-semibold text-gray-900 mb-2">
                  よくあるご質問
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  お問い合わせの前に、よくあるご質問をご確認ください。
                </p>
                <Link
                  href="/faq"
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  FAQを見る →
                </Link>
              </div>
            </div>

            {/* お問い合わせフォーム */}
            <div className="md:col-span-2">
              <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-6">
                  お問い合わせフォーム
                </h2>

                {success && (
                  <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700">
                      お問い合わせを受け付けました。担当者より2営業日以内にご連絡いたします。
                    </p>
                  </div>
                )}

                {error && (
                  <div className="mb-6 flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                        お名前 <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="name"
                        name="name"
                        type="text"
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>

                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                        メールアドレス <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        required
                        className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
                      電話番号
                    </label>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div>
                    <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                      お問い合わせ種別 <span className="text-red-500">*</span>
                    </label>
                    <select
                      id="category"
                      name="category"
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    >
                      <option value="">選択してください</option>
                      <option value="service">サービスについて</option>
                      <option value="registration">薬局登録について</option>
                      <option value="technical">技術的な問題</option>
                      <option value="billing">料金・請求について</option>
                      <option value="other">その他</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                      お問い合わせ内容 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={6}
                      required
                      className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900"
                    />
                  </div>

                  <div className="pt-4">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full inline-flex justify-center items-center gap-2 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                      {isSubmitting ? '送信中...' : '送信する'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}