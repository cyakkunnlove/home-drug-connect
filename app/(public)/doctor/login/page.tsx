import LoginForm from '@/components/auth/LoginForm'
import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export default function DoctorLoginPage() {
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
              医師ログイン
            </h1>
            
            <LoginForm />

            <p className="mt-6 text-center text-sm text-gray-600">
              まだアカウントをお持ちでない医師の方は{' '}
              <Link href="/doctor/register" className="text-blue-600 hover:text-blue-700 font-medium">
                新規登録はこちら
              </Link>
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}