import DoctorRegisterForm from '@/components/auth/DoctorRegisterForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function DoctorRegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-5 h-5" />
            <span>ホームに戻る</span>
          </Link>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-lg shadow-md p-8">
            <h1 className="text-2xl font-bold text-center text-gray-900 mb-8">
              医師新規登録
            </h1>
            
            <DoctorRegisterForm />

            <p className="mt-6 text-center text-sm text-gray-600">
              すでにアカウントをお持ちですか？{' '}
              <Link href="/doctor/login" className="text-blue-600 hover:text-blue-700 font-medium">
                ログインする
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}