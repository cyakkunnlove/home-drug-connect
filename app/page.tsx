import Link from "next/link"
import { Search, Clock, Shield } from "lucide-react"
import AuthenticatedHeader from "@/components/layout/AuthenticatedHeader"

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <AuthenticatedHeader />
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-900">HOME-DRUG CONNECT</h1>
          <div className="flex gap-4">
            <Link href="/search" className="text-gray-700 hover:text-blue-900">
              薬局を探す
            </Link>
            <Link href="/pharmacy/login" className="text-gray-700 hover:text-blue-900">
              薬局ログイン
            </Link>
            <Link href="/doctor/login" className="text-gray-700 hover:text-blue-900">
              医師ログイン
            </Link>
          </div>
        </nav>
      </header>

      <main>
        <section className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            在宅医療をもっとスムーズに
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
            クリニックと在宅対応薬局をつなぐマッチングプラットフォーム。
            24時間対応可能な薬局を簡単に検索できます。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
            >
              <Search className="w-5 h-5" />
              薬局を検索する
            </Link>
            <Link
              href="/pharmacy/register"
              className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg border-2 border-blue-600 hover:bg-blue-50 transition-colors text-lg font-medium"
            >
              薬局として登録する
            </Link>
            <Link
              href="/doctor/register"
              className="inline-flex items-center justify-center gap-2 bg-green-600 text-white px-8 py-3 rounded-lg hover:bg-green-700 transition-colors text-lg font-medium"
            >
              医師として登録する
            </Link>
          </div>
        </section>

        <section className="bg-white py-16">
          <div className="container mx-auto px-4">
            <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
              特徴
            </h3>
            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">24時間対応</h4>
                <p className="text-gray-600">
                  休日・夜間対応可能な薬局を簡単に見つけられます
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Search className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">リアルタイム検索</h4>
                <p className="text-gray-600">
                  空き状況をリアルタイムで確認して最適な薬局を選択
                </p>
              </div>
              
              <div className="text-center">
                <div className="bg-blue-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="text-xl font-semibold mb-2">安心・安全</h4>
                <p className="text-gray-600">
                  厳格な審査を通過した薬局のみが登録されています
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="bg-blue-600 rounded-2xl p-8 md:p-12 text-white text-center">
              <h3 className="text-3xl font-bold mb-4">
                今すぐ薬局を探す
              </h3>
              <p className="text-xl mb-8 opacity-90">
                患者様の住所から最適な在宅対応薬局を検索できます
              </p>
              <Link
                href="/search"
                className="inline-flex items-center justify-center gap-2 bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-gray-100 transition-colors text-lg font-medium"
              >
                <Search className="w-5 h-5" />
                検索を開始
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="bg-gray-900 text-white py-8 mt-16">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <p className="mb-2">© 2025 HOME-DRUG CONNECT. All rights reserved.</p>
            <div className="flex gap-4 justify-center text-sm">
              <Link href="/terms" className="hover:underline">利用規約</Link>
              <Link href="/privacy" className="hover:underline">プライバシーポリシー</Link>
              <Link href="/contact" className="hover:underline">お問い合わせ</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}