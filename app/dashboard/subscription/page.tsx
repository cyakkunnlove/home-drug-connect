
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { CreditCard, CheckCircle, AlertCircle, Calendar } from 'lucide-react';
import SubscriptionActions from './SubscriptionActions';
export const dynamic = 'force-dynamic'


export default async function SubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/pharmacy/login');
  }

  // Get subscription details
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:subscription_plans(*)
    `)
    .eq('user_id', user.id)
    .single();

  // Get payment history
  const { data: payments } = await supabase
    .from('payment_history')
    .select('*')
    .eq('subscription_id', subscription?.id || '')
    .order('created_at', { ascending: false })
    .limit(10);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'past_due':
        return 'text-red-600 bg-red-50';
      case 'canceled':
        return 'text-gray-600 bg-gray-50';
      default:
        return 'text-yellow-600 bg-yellow-50';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return '有効';
      case 'past_due':
        return '支払い遅延';
      case 'canceled':
        return 'キャンセル済み';
      case 'trialing':
        return 'トライアル中';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">サブスクリプション管理</h1>
        <p className="text-gray-600 mt-2">プランの確認と支払い履歴</p>
      </div>

      {/* Current Plan */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">現在のプラン</h2>
          {subscription && (
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(subscription.status)}`}>
              {getStatusText(subscription.status)}
            </span>
          )}
        </div>

        {subscription ? (
          <div className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">プラン名</p>
                <p className="font-medium">{subscription.plan?.name || 'ベーシックプラン'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">月額料金</p>
                <p className="font-medium">¥{subscription.plan?.price_jpy?.toLocaleString() || '2,200'}</p>
              </div>
              {subscription.current_period_end && (
                <>
                  <div>
                    <p className="text-sm text-gray-600">次回請求日</p>
                    <p className="font-medium">
                      {new Date(subscription.current_period_end).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">契約開始日</p>
                    <p className="font-medium">
                      {new Date(subscription.created_at).toLocaleDateString('ja-JP')}
                    </p>
                  </div>
                </>
              )}
            </div>

            {subscription.cancel_at && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <div className="flex items-start">
                  <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div className="ml-3">
                    <p className="text-sm font-medium text-yellow-800">
                      キャンセル予定
                    </p>
                    <p className="text-sm text-yellow-700 mt-1">
                      このサブスクリプションは {new Date(subscription.cancel_at).toLocaleDateString('ja-JP')} にキャンセルされます。
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4">
              <SubscriptionActions 
                subscription={subscription}
                hasStripeCustomer={!!subscription.stripe_customer_id}
              />
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-4">まだサブスクリプションに登録していません</p>
            <SubscriptionActions hasStripeCustomer={false} />
          </div>
        )}
      </div>

      {/* Payment History */}
      {payments && payments.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">支払い履歴</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">日付</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">金額</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">ステータス</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} className="border-b">
                    <td className="py-3 px-4 text-sm">
                      {new Date(payment.paid_at || payment.created_at).toLocaleDateString('ja-JP')}
                    </td>
                    <td className="py-3 px-4 text-sm">
                      ¥{payment.amount_jpy.toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      {payment.status === 'succeeded' ? (
                        <span className="inline-flex items-center text-green-600">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          <span className="text-sm">支払い完了</span>
                        </span>
                      ) : (
                        <span className="text-sm text-gray-600">{payment.status}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Plan Features */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">プランに含まれる機能</h2>
        <ul className="space-y-3">
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <span>薬局情報の掲載</span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <span>問い合わせ受付機能</span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <span>月次レポート</span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <span>アナリティクス機能</span>
          </li>
          <li className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3" />
            <span>メール通知</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
