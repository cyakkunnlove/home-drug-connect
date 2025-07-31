import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import AuthenticatedHeader from '@/components/layout/AuthenticatedHeader'

export default function LawPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <AuthenticatedHeader />
      
      <header className="bg-white shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <Link href="/" className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900">
            <ChevronLeft className="w-5 h-5" />
            <span>ホームに戻る</span>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">特定商取引法に基づく表記</h1>

        <div className="bg-white rounded-lg shadow-md p-8">
          <table className="w-full">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="py-4 text-gray-600 font-medium w-1/3 align-top">販売業者</td>
                <td className="py-4 text-gray-900">HOME-DRUG CONNECT株式会社</td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">運営責任者</td>
                <td className="py-4 text-gray-900">代表取締役 山田太郎</td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">所在地</td>
                <td className="py-4 text-gray-900">
                  〒100-0001<br />
                  東京都千代田区千代田1-1-1<br />
                  千代田ビル10F
                </td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">電話番号</td>
                <td className="py-4 text-gray-900">
                  03-1234-5678<br />
                  <span className="text-sm text-gray-600">※お問い合わせはメールにてお願いいたします</span>
                </td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">メールアドレス</td>
                <td className="py-4 text-gray-900">info@home-drug-connect.com</td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">URL</td>
                <td className="py-4 text-gray-900">https://home-drug-connect.com</td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">販売価格</td>
                <td className="py-4 text-gray-900">
                  各プランページに表示<br />
                  <span className="text-sm text-gray-600">※すべて税込価格で表示しています</span>
                </td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">商品代金以外の必要料金</td>
                <td className="py-4 text-gray-900">なし</td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">お支払方法</td>
                <td className="py-4 text-gray-900">
                  クレジットカード決済<br />
                  <span className="text-sm text-gray-600">（VISA、MasterCard、JCB、AMEX、Diners）</span>
                </td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">支払時期</td>
                <td className="py-4 text-gray-900">
                  月額プラン：毎月の更新日に自動課金<br />
                  年額プラン：契約時に一括課金
                </td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">サービス提供時期</td>
                <td className="py-4 text-gray-900">決済完了後、即時利用可能</td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">返品・キャンセル</td>
                <td className="py-4 text-gray-900">
                  サービスの性質上、返品・返金はお受けしておりません。<br />
                  月額プランはいつでも解約可能です。<br />
                  解約後も契約期間終了まではサービスをご利用いただけます。
                </td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">動作環境</td>
                <td className="py-4 text-gray-900">
                  <div className="space-y-2">
                    <div>
                      <strong className="text-sm">推奨ブラウザ：</strong><br />
                      • Chrome 最新版<br />
                      • Firefox 最新版<br />
                      • Safari 最新版<br />
                      • Edge 最新版
                    </div>
                    <div>
                      <strong className="text-sm">推奨環境：</strong><br />
                      • インターネット接続環境<br />
                      • JavaScript有効
                    </div>
                  </div>
                </td>
              </tr>
              
              <tr>
                <td className="py-4 text-gray-600 font-medium align-top">免責事項</td>
                <td className="py-4 text-gray-900">
                  当社は、本サービスの利用により生じた損害について、<br />
                  当社に故意または重過失がある場合を除き、<br />
                  一切の責任を負いません。
                </td>
              </tr>
            </tbody>
          </table>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-right">
              最終更新日：2025年1月1日
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}