import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import AuthenticatedHeader from '@/components/layout/AuthenticatedHeader'

export default function TermsPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-8">利用規約</h1>

        <div className="bg-white rounded-lg shadow-md p-8 space-y-8">
          <section>
            <p className="text-gray-600 mb-6">
              この利用規約（以下、「本規約」といいます。）は、在宅薬局ナビ（以下、「当社」といいます。）がこのウェブサイト上で提供するサービス（以下、「本サービス」といいます。）の利用条件を定めるものです。登録ユーザーの皆さま（以下、「ユーザー」といいます。）には、本規約に従って、本サービスをご利用いただきます。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第1条（適用）</h2>
            <p className="text-gray-600">
              本規約は、ユーザーと当社との間の本サービスの利用に関わる一切の関係に適用されるものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第2条（利用登録）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>本サービスにおいては、登録希望者が本規約に同意の上、当社の定める方法によって利用登録を申請し、当社がこれを承認することによって、利用登録が完了するものとします。</li>
              <li>当社は、利用登録の申請者に以下の事由があると判断した場合、利用登録の申請を承認しないことがあり、その理由については一切の開示義務を負わないものとします。
                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                  <li>利用登録の申請に際して虚偽の事項を届け出た場合</li>
                  <li>本規約に違反したことがある者からの申請である場合</li>
                  <li>その他、当社が利用登録を相当でないと判断した場合</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第3条（ユーザーIDおよびパスワードの管理）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>ユーザーは、自己の責任において、本サービスのユーザーIDおよびパスワードを適切に管理するものとします。</li>
              <li>ユーザーは、いかなる場合にも、ユーザーIDおよびパスワードを第三者に譲渡または貸与し、もしくは第三者と共用することはできません。</li>
              <li>当社は、ユーザーIDとパスワードの組み合わせが登録情報と一致してログインされた場合には、そのユーザーIDを登録しているユーザー自身による利用とみなします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第4条（利用料金および支払方法）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>ユーザーは、本サービスの有料部分の対価として、当社が別途定め、本ウェブサイトに表示する利用料金を、当社が指定する方法により支払うものとします。</li>
              <li>ユーザーが利用料金の支払を遅滞した場合には、ユーザーは年14.6%の割合による遅延損害金を支払うものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第5条（禁止事項）</h2>
            <p className="text-gray-600 mb-4">ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
            <ol className="list-decimal list-inside space-y-2 text-gray-600 ml-4">
              <li>法令または公序良俗に違反する行為</li>
              <li>犯罪行為に関連する行為</li>
              <li>当社、本サービスの他のユーザー、または第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
              <li>当社のサービスの運営を妨害するおそれのある行為</li>
              <li>他のユーザーに関する個人情報等を収集または蓄積する行為</li>
              <li>不正アクセスをし、またはこれを試みる行為</li>
              <li>他のユーザーに成りすます行為</li>
              <li>当社のサービスに関連して、反社会的勢力に対して直接または間接に利益を供与する行為</li>
              <li>当社、本サービスの他のユーザーまたは第三者の知的財産権、肖像権、プライバシー、名誉その他の権利または利益を侵害する行為</li>
              <li>その他、当社が不適切と判断する行為</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第6条（本サービスの提供の停止等）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>当社は、以下のいずれかの事由があると判断した場合、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。
                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                  <li>本サービスにかかるコンピュータシステムの保守点検または更新を行う場合</li>
                  <li>地震、落雷、火災、停電または天災などの不可抗力により、本サービスの提供が困難となった場合</li>
                  <li>コンピュータまたは通信回線等が事故により停止した場合</li>
                  <li>その他、当社が本サービスの提供が困難と判断した場合</li>
                </ul>
              </li>
              <li>当社は、本サービスの提供の停止または中断により、ユーザーまたは第三者が被ったいかなる不利益または損害についても、一切の責任を負わないものとします。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第7条（利用制限および登録抹消）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>当社は、ユーザーが以下のいずれかに該当する場合には、事前の通知なく、ユーザーに対して、本サービスの全部もしくは一部の利用を制限し、またはユーザーとしての登録を抹消することができるものとします。
                <ul className="list-disc list-inside mt-2 ml-4 space-y-1">
                  <li>本規約のいずれかの条項に違反した場合</li>
                  <li>登録事項に虚偽の事実があることが判明した場合</li>
                  <li>料金等の支払債務の不履行があった場合</li>
                  <li>当社からの連絡に対し、一定期間返答がない場合</li>
                  <li>本サービスについて、最終の利用から一定期間利用がない場合</li>
                  <li>その他、当社が本サービスの利用を適当でないと判断した場合</li>
                </ul>
              </li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第8条（免責事項）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>当社の債務不履行責任は、当社の故意または重過失によらない場合には免責されるものとします。</li>
              <li>当社は、何らかの理由によって責任を負う場合にも、通常生じうる損害の範囲内かつ有料サービスにおいては代金額（継続的サービスの場合には1か月分相当額）の範囲内においてのみ賠償の責任を負うものとします。</li>
              <li>当社は、本サービスに関して、ユーザーと他のユーザーまたは第三者との間において生じた取引、連絡または紛争等について一切責任を負いません。</li>
            </ol>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第9条（サービス内容の変更等）</h2>
            <p className="text-gray-600">
              当社は、ユーザーに通知することなく、本サービスの内容を変更しまたは本サービスの提供を中止することができるものとし、これによってユーザーに生じた損害について一切の責任を負いません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第10条（利用規約の変更）</h2>
            <p className="text-gray-600">
              当社は、必要と判断した場合には、ユーザーに通知することなくいつでも本規約を変更することができるものとします。なお、本規約の変更後、本サービスの利用を開始した場合には、当該ユーザーは変更後の規約に同意したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第11条（個人情報の取扱い）</h2>
            <p className="text-gray-600">
              当社は、本サービスの利用によって取得する個人情報については、当社「プライバシーポリシー」に従い適切に取り扱うものとします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第12条（通知または連絡）</h2>
            <p className="text-gray-600">
              ユーザーと当社との間の通知または連絡は、当社の定める方法によって行うものとします。当社は、ユーザーから、当社が別途定める方式に従った変更届け出がない限り、現在登録されている連絡先が有効なものとみなして当該連絡先へ通知または連絡を行い、これらは、発信時にユーザーへ到達したものとみなします。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第13条（権利義務の譲渡の禁止）</h2>
            <p className="text-gray-600">
              ユーザーは、当社の書面による事前の承諾なく、利用契約上の地位または本規約に基づく権利もしくは義務を第三者に譲渡し、または担保に供することはできません。
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-gray-900 mb-4">第14条（準拠法・裁判管轄）</h2>
            <ol className="list-decimal list-inside space-y-2 text-gray-600">
              <li>本規約の解釈にあたっては、日本法を準拠法とします。</li>
              <li>本サービスに関して紛争が生じた場合には、当社の本店所在地を管轄する裁判所を専属的合意管轄とします。</li>
            </ol>
          </section>

          <div className="mt-8 pt-8 border-t border-gray-200">
            <p className="text-sm text-gray-600 text-right">
              制定日：2025年1月1日<br />
              最終更新日：2025年1月1日
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}