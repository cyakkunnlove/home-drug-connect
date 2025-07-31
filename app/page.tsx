import Link from "next/link"
import { Search, Clock, Shield, MapPin, CheckCircle, Users, Sparkles, ArrowRight } from "lucide-react"
import AuthenticatedHeader from "@/components/layout/AuthenticatedHeader"
import Header from "@/components/layout/Header"

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      <Header />
      <AuthenticatedHeader />
      
      {/* ヒーローセクション */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800">
        <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-400 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-indigo-400 rounded-full blur-3xl opacity-20" />
        
        <div className="relative container mx-auto px-4 py-20 md:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full text-white mb-6">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-medium">在宅医療をもっとスムーズに</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 leading-tight">
              <span className="block">すぐに見つかる</span>
              <span className="block bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                在宅対応薬局
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-white/90 mb-12 max-w-2xl mx-auto leading-relaxed">
              24時間対応可能な薬局を簡単検索。
              医療機関と薬局をつなぐマッチングプラットフォーム
            </p>
            
            {/* メインCTAボタン */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link
                href="/search"
                className="group inline-flex items-center justify-center gap-3 bg-white text-blue-700 px-8 py-4 rounded-xl hover:shadow-2xl hover:shadow-white/20 transition-all duration-300 text-lg font-bold transform hover:-translate-y-1"
              >
                <MapPin className="w-6 h-6" />
                薬局を今すぐ検索
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
            
            {/* サブボタン */}
            <div className="flex gap-6 justify-center text-white/80 text-sm">
              <Link href="/pharmacy/register" className="hover:text-white transition-colors">
                薬局として登録 →
              </Link>
              <Link href="/doctor/register" className="hover:text-white transition-colors">
                医師として登録 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 統計セクション */}
      <section className="py-12 bg-gray-50 border-b">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">500+</div>
              <p className="text-gray-600">登録薬局数</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">24/7</div>
              <p className="text-gray-600">いつでも対応可能</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-blue-600 mb-2">98%</div>
              <p className="text-gray-600">マッチング成功率</p>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              なぜHOME-DRUG CONNECTなのか
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              在宅医療の現場で必要とされる機能を全て搭載
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="group hover:shadow-xl transition-all duration-300 rounded-2xl p-8 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
              <div className="bg-gradient-to-br from-blue-500 to-indigo-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Clock className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">24時間対応</h3>
              <p className="text-gray-600 leading-relaxed">
                休日・夜間・緊急時でも対応可能な薬局をリアルタイムで検索
              </p>
            </div>
            
            <div className="group hover:shadow-xl transition-all duration-300 rounded-2xl p-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="bg-gradient-to-br from-green-500 to-emerald-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">スマート検索</h3>
              <p className="text-gray-600 leading-relaxed">
                患者様の住所から最寄りの対応可能薬局を即座に表示
              </p>
            </div>
            
            <div className="group hover:shadow-xl transition-all duration-300 rounded-2xl p-8 bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100">
              <div className="bg-gradient-to-br from-purple-500 to-pink-600 w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">安心・安全</h3>
              <p className="text-gray-600 leading-relaxed">
                厳格な審査を通過した信頼できる薬局のみが登録
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 使い方セクション */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              かんたん3ステップ
            </h2>
            <p className="text-xl text-gray-600">
              薬局検索から依頼まで、すぐに完了
            </p>
          </div>
          
          <div className="max-w-4xl mx-auto">
            <div className="space-y-8">
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  1
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">患者様の住所を入力</h3>
                  <p className="text-gray-600">住所または現在地から検索を開始</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">対応可能な薬局を選択</h3>
                  <p className="text-gray-600">条件に合う薬局をリストから選択</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                <div className="flex-shrink-0 w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold">
                  3
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">依頼を送信</h3>
                  <p className="text-gray-600">必要事項を入力して依頼完了</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              今すぐ薬局を検索しましょう
            </h2>
            <p className="text-xl text-white/90 mb-8">
              患者様のご自宅から最適な薬局が見つかります
            </p>
            <Link
              href="/search"
              className="inline-flex items-center justify-center gap-3 bg-white text-blue-700 px-8 py-4 rounded-xl hover:shadow-2xl hover:shadow-black/20 transition-all duration-300 text-lg font-bold group"
            >
              <MapPin className="w-6 h-6" />
              薬局検索を開始
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </section>

      {/* フッター */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-lg font-bold mb-4">HOME-DRUG CONNECT</h3>
              <p className="text-gray-400 text-sm">
                在宅医療をもっとスムーズに
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">サービス</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/search" className="hover:text-white transition-colors">薬局検索</Link></li>
                <li><Link href="/pharmacy/register" className="hover:text-white transition-colors">薬局登録</Link></li>
                <li><Link href="/doctor/register" className="hover:text-white transition-colors">医師登録</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">サポート</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/help" className="hover:text-white transition-colors">ヘルプ</Link></li>
                <li><Link href="/contact" className="hover:text-white transition-colors">お問い合わせ</Link></li>
                <li><Link href="/faq" className="hover:text-white transition-colors">よくある質問</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4">法的情報</h4>
              <ul className="space-y-2 text-gray-400 text-sm">
                <li><Link href="/terms" className="hover:text-white transition-colors">利用規約</Link></li>
                <li><Link href="/privacy" className="hover:text-white transition-colors">プライバシーポリシー</Link></li>
                <li><Link href="/law" className="hover:text-white transition-colors">特定商取引法</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-gray-800 text-center text-sm text-gray-400">
            <p>© 2025 HOME-DRUG CONNECT. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}