import Link from 'next/link'
import { ChevronLeft, Plus, Minus } from 'lucide-react'
import AuthenticatedHeader from '@/components/layout/AuthenticatedHeader'

export default function FAQPage() {
  const faqs = [
    {
      category: 'サービスについて',
      questions: [
        {
          q: 'HOME-DRUG CONNECTとは何ですか？',
          a: 'HOME-DRUG CONNECTは、在宅医療を受ける患者様のご自宅に対応可能な薬局と、医療機関をつなぐマッチングプラットフォームです。24時間対応、休日対応、無菌調剤、麻薬調剤など、特殊な対応が必要な場合でも、迅速に適切な薬局を見つけることができます。'
        },
        {
          q: '利用料金はかかりますか？',
          a: '患者様・医師の皆様は無料でご利用いただけます。薬局様には月額プランをご用意しております。詳細はお問い合わせください。'
        },
        {
          q: 'どのような薬局が登録されていますか？',
          a: '在宅医療に対応可能な調剤薬局が登録されています。すべての薬局は事前審査を通過しており、24時間対応、無菌調剤室、麻薬取扱いなど、各薬局の対応可能なサービスが明確に表示されます。'
        }
      ]
    },
    {
      category: '薬局検索について',
      questions: [
        {
          q: '薬局検索はどのように行いますか？',
          a: '患者様の住所または現在地から検索できます。検索画面で住所を入力するか、現在地ボタンをクリックすると、近隣の対応可能な薬局が表示されます。フィルター機能で24時間対応や無菌調剤室など、必要な条件で絞り込むことも可能です。'
        },
        {
          q: '検索結果の距離はどのように計算されていますか？',
          a: '患者様の住所から薬局までの直線距離を表示しています。実際の移動距離とは異なる場合がありますので、参考値としてご利用ください。'
        },
        {
          q: '満床と表示されている薬局はどういう意味ですか？',
          a: '現在、新規の在宅患者様の受け入れが難しい状態を示しています。緊急の場合は直接薬局にお問い合わせください。'
        }
      ]
    },
    {
      category: '医師・医療機関の方へ',
      questions: [
        {
          q: '医師として登録するメリットは何ですか？',
          a: '在宅医療の患者様に対応可能な薬局を素早く検索でき、依頼の送信から承認まで一元管理できます。また、各薬局の対応可能サービスが明確なため、患者様に最適な薬局を選択できます。'
        },
        {
          q: '依頼を送信した後の流れは？',
          a: '依頼を送信すると、選択した薬局に通知が届きます。薬局側で内容を確認し、対応可能な場合は承認の連絡が入ります。その後、直接薬局と調整を行っていただきます。'
        },
        {
          q: '複数の薬局に同時に依頼できますか？',
          a: '現在は1件ずつの依頼となっています。迅速な対応が必要な場合は、薬局に直接お電話でお問い合わせいただくことをお勧めします。'
        }
      ]
    },
    {
      category: '薬局の方へ',
      questions: [
        {
          q: '薬局として登録するには？',
          a: '「薬局として登録」ボタンから必要事項を入力してください。登録後、審査を行い、承認されると薬局情報が公開されます。'
        },
        {
          q: '登録情報の変更はできますか？',
          a: 'ダッシュボードから薬局情報、対応可能サービス、受入可能人数などをいつでも更新できます。24時間対応の可否なども随時変更可能です。'
        },
        {
          q: '月額料金の支払い方法は？',
          a: 'クレジットカード決済に対応しています。毎月自動的に決済され、領収書はメールで送付されます。'
        }
      ]
    },
    {
      category: 'トラブルシューティング',
      questions: [
        {
          q: 'ログインできません',
          a: 'メールアドレスとパスワードが正しいか確認してください。パスワードを忘れた場合は、ログイン画面の「パスワードを忘れた方」からリセットできます。'
        },
        {
          q: '検索結果が表示されません',
          a: 'ブラウザの位置情報設定を確認してください。また、検索範囲を広げるか、フィルター条件を緩和してみてください。'
        },
        {
          q: 'エラーが表示されます',
          a: 'ブラウザを更新して再度お試しください。問題が解決しない場合は、お問い合わせフォームからご連絡ください。'
        }
      ]
    }
  ]

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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">よくある質問</h1>

        <div className="space-y-8">
          {faqs.map((category, categoryIndex) => (
            <div key={categoryIndex} className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">{category.category}</h2>
              
              <div className="space-y-4">
                {category.questions.map((faq, faqIndex) => (
                  <details key={faqIndex} className="group">
                    <summary className="flex items-center justify-between cursor-pointer p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                      <span className="flex-shrink-0 ml-auto">
                        <Plus className="w-5 h-5 text-gray-500 group-open:hidden" />
                        <Minus className="w-5 h-5 text-gray-500 hidden group-open:block" />
                      </span>
                    </summary>
                    <div className="mt-2 p-4 text-gray-600 leading-relaxed">
                      {faq.a}
                    </div>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-blue-50 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            お探しの回答が見つかりませんか？
          </h2>
          <p className="text-gray-600 mb-4">
            お問い合わせフォームからご質問をお送りください
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            お問い合わせ
          </Link>
        </div>
      </main>
    </div>
  )
}