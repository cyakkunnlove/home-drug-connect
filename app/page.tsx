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

      {/* サービス紹介セクション - 大幅改善 */}
      <section className="py-24 bg-gradient-to-b from-white to-blue-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              HOME-DRUG CONNECTのサービス
            </h2>
            <p className="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              在宅医療の現場で発生する「薬局が見つからない」という問題を<br />
              テクノロジーの力で解決します
            </p>
          </div>
          
          {/* メインサービス紹介 */}
          <div className="max-w-6xl mx-auto mb-20">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="order-2 md:order-1">
                <div className="text-6xl mb-6">🏥</div>
                <h3 className="text-3xl font-bold mb-4 text-gray-900">
                  医師の悩みを解決
                </h3>
                <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                  「夜間・休日に対応できる薬局が見つからない...」<br />
                  「無菌調剤が必要だけど、どこに頼めばいいか分からない...」<br />
                  「緊急の処方箋を受けてくれる薬局を探すのに時間がかかる...」
                </p>
                <div className="bg-blue-100 border-l-4 border-blue-600 p-4 rounded">
                  <p className="text-blue-900 font-medium">
                    💡 HOME-DRUG CONNECTなら、条件に合う薬局を瞬時に検索！
                  </p>
                </div>
              </div>
              <div className="order-1 md:order-2 bg-white rounded-3xl shadow-2xl p-8 transform hover:scale-105 transition-transform duration-300">
                <img src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 300'%3E%3Crect fill='%23f0f9ff' width='400' height='300'/%3E%3Ctext x='200' y='150' text-anchor='middle' font-size='80' fill='%233b82f6'%3E🔍%3C/text%3E%3Ctext x='200' y='200' text-anchor='middle' font-size='20' fill='%236b7280'%3E薬局を瞬時に検索%3C/text%3E%3C/svg%3E" alt="検索イメージ" className="w-full h-64 object-cover rounded-lg" />
              </div>
            </div>
          </div>

          {/* 3つの主要機能 */}
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center transform hover:-translate-y-2">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">⏰</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">24時間365日対応</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                深夜でも休日でも<br />
                対応可能な薬局が<br />
                すぐに見つかります
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">夜間対応</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">休日対応</span>
                <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm">緊急対応</span>
              </div>
            </div>
            
            <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center transform hover:-translate-y-2">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">📍</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">位置情報で最適化</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                患者様のご自宅から<br />
                最も近い薬局を<br />
                自動的に表示します
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">GPS対応</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">距離表示</span>
                <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">ルート案内</span>
              </div>
            </div>
            
            <div className="group bg-white rounded-3xl shadow-lg hover:shadow-2xl transition-all duration-300 p-8 text-center transform hover:-translate-y-2">
              <div className="text-6xl mb-6 group-hover:scale-110 transition-transform">🔒</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">安心の認証制度</h3>
              <p className="text-gray-700 leading-relaxed mb-6">
                全ての薬局は<br />
                厳格な審査を通過<br />
                安心してご利用可能
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">審査済み</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">評価制度</span>
                <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm">実績公開</span>
              </div>
            </div>
          </div>

          {/* 特殊対応 */}
          <div className="mt-20 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl p-8 md:p-12 text-white">
            <h3 className="text-3xl font-bold mb-6 text-center">特殊な要望にも対応</h3>
            <div className="grid md:grid-cols-4 gap-6 text-center">
              <div>
                <div className="text-5xl mb-3">💊</div>
                <p className="font-medium">麻薬取扱い</p>
              </div>
              <div>
                <div className="text-5xl mb-3">🧪</div>
                <p className="font-medium">無菌調剤</p>
              </div>
              <div>
                <div className="text-5xl mb-3">🚗</div>
                <p className="font-medium">訪問対応</p>
              </div>
              <div>
                <div className="text-5xl mb-3">🏠</div>
                <p className="font-medium">在宅専門</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 利用方法セクション - 視覚的に改善 */}
      <section className="py-24 bg-gradient-to-b from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              使い方はとってもかんたん！
            </h2>
            <p className="text-xl md:text-2xl text-gray-600">
              3つのステップで薬局との連携が完了します
            </p>
          </div>
          
          <div className="max-w-6xl mx-auto">
            {/* ステップ1 */}
            <div className="mb-16">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
                  <div className="flex items-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      1
                    </div>
                    <div className="ml-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900">住所を入力</h3>
                      <p className="text-gray-600">まずは患者様の情報から</p>
                    </div>
                  </div>
                  <div className="bg-blue-50 rounded-2xl p-6">
                    <p className="text-lg text-gray-700 mb-4">
                      🏠 患者様のご自宅の住所を入力<br />
                      📍 または現在地から検索も可能
                    </p>
                    <div className="bg-white rounded-lg p-4 border-2 border-blue-200">
                      <p className="text-sm text-gray-600 mb-2">検索例：</p>
                      <p className="font-mono text-blue-600">東京都新宿区〇〇1-2-3</p>
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-9xl">🏘️</div>
                  <p className="text-gray-600 mt-4">患者様のご自宅から検索</p>
                </div>
              </div>
            </div>

            {/* 矢印 */}
            <div className="text-center mb-16">
              <div className="text-4xl text-blue-500 animate-bounce">⬇️</div>
            </div>

            {/* ステップ2 */}
            <div className="mb-16">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="order-2 md:order-1 text-center">
                  <div className="text-9xl">🏪</div>
                  <p className="text-gray-600 mt-4">条件に合う薬局が表示</p>
                </div>
                <div className="order-1 md:order-2 bg-white rounded-3xl shadow-xl p-8 md:p-12">
                  <div className="flex items-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-green-500 to-green-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      2
                    </div>
                    <div className="ml-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900">薬局を選択</h3>
                      <p className="text-gray-600">ニーズに合った薬局を</p>
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-2xl p-6">
                    <p className="text-lg text-gray-700 mb-4">
                      ✅ 24時間対応可能な薬局<br />
                      ✅ 無菌調剤室がある薬局<br />
                      ✅ 現在受入可能な薬局
                    </p>
                    <div className="flex gap-2 flex-wrap">
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">距離順</span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">条件絞込</span>
                      <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm">マップ表示</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 矢印 */}
            <div className="text-center mb-16">
              <div className="text-4xl text-green-500 animate-bounce">⬇️</div>
            </div>

            {/* ステップ3 */}
            <div className="mb-16">
              <div className="grid md:grid-cols-2 gap-8 items-center">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12">
                  <div className="flex items-center mb-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-purple-600 rounded-full flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                      3
                    </div>
                    <div className="ml-6">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900">依頼送信</h3>
                      <p className="text-gray-600">必要事項を入力して完了</p>
                    </div>
                  </div>
                  <div className="bg-purple-50 rounded-2xl p-6">
                    <p className="text-lg text-gray-700 mb-4">
                      📝 患者情報を入力<br />
                      💊 処方内容を記載<br />
                      📤 ワンクリックで送信
                    </p>
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg p-4 text-center font-bold">
                      送信完了！ 🎉
                    </div>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-9xl">📨</div>
                  <p className="text-gray-600 mt-4">薬局へ依頼が送信されます</p>
                </div>
              </div>
            </div>

            {/* 完了メッセージ */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-3xl p-8 text-white text-center">
              <div className="text-6xl mb-4">🎊</div>
              <h3 className="text-3xl font-bold mb-4">これで完了！</h3>
              <p className="text-xl">
                薬局から連絡が来るのを待つだけ。<br />
                平均応答時間は約15分です。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ユーザータイプ別ガイド */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              あなたはどちらですか？
            </h2>
            <p className="text-xl text-gray-600">
              ご利用方法をお選びください
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* 医師向け */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-8xl mb-6">👨‍⚕️</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">医師の方</h3>
              <p className="text-gray-700 mb-6">
                在宅患者様への処方箋対応で<br />
                薬局をお探しの方
              </p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-blue-600">✓</span>
                  <span>24時間対応薬局を検索</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-600">✓</span>
                  <span>特殊調剤対応の確認</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-blue-600">✓</span>
                  <span>受入状況をリアルタイム確認</span>
                </li>
              </ul>
              <Link
                href="/doctor/register"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-bold"
              >
                医師として登録する
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
            
            {/* 薬局向け */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-3xl p-8 text-center hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
              <div className="text-8xl mb-6">💊</div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">薬局の方</h3>
              <p className="text-gray-700 mb-6">
                在宅医療に対応可能な<br />
                薬局として登録したい方
              </p>
              <ul className="text-left space-y-3 mb-8">
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span>新規患者様の獲得</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span>効率的な受注管理</span>
                </li>
                <li className="flex items-center gap-3">
                  <span className="text-green-600">✓</span>
                  <span>地域医療への貢献</span>
                </li>
              </ul>
              <Link
                href="/pharmacy/register"
                className="inline-flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-xl hover:shadow-lg transition-all duration-300 font-bold"
              >
                薬局として登録する
                <ArrowRight className="w-5 h-5" />
              </Link>
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