import { createClient } from '@/lib/supabase/server';
import { Users, Building2, CreditCard, TrendingUp, MessageSquare, Eye } from 'lucide-react';

export default async function AdminDashboard() {
  const supabase = await createClient();

  // Get statistics
  const [
    { count: totalUsers },
    { count: totalPharmacies },
    { count: activeSubscriptions },
    { count: totalInquiries },
    { count: totalViews },
    { data: recentPharmacies },
    { data: recentUsers },
    { data: revenue }
  ] = await Promise.all([
    supabase.from('users').select('*', { count: 'exact', head: true }),
    supabase.from('pharmacies').select('*', { count: 'exact', head: true }),
    supabase.from('subscriptions').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('inquiries').select('*', { count: 'exact', head: true }),
    supabase.from('pharmacy_views').select('*', { count: 'exact', head: true }),
    supabase.from('pharmacies').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('users').select('*').order('created_at', { ascending: false }).limit(5),
    supabase.from('payment_history').select('amount_jpy').eq('status', 'succeeded')
  ]);

  const totalRevenue = revenue?.reduce((sum, payment) => sum + payment.amount_jpy, 0) || 0;

  const stats = [
    {
      label: '総ユーザー数',
      value: totalUsers || 0,
      icon: Users,
      color: 'bg-blue-500',
    },
    {
      label: '登録薬局数',
      value: totalPharmacies || 0,
      icon: Building2,
      color: 'bg-green-500',
    },
    {
      label: 'アクティブサブスクリプション',
      value: activeSubscriptions || 0,
      icon: CreditCard,
      color: 'bg-purple-500',
    },
    {
      label: '総売上',
      value: `¥${totalRevenue.toLocaleString()}`,
      icon: TrendingUp,
      color: 'bg-yellow-500',
    },
    {
      label: '総問い合わせ数',
      value: totalInquiries || 0,
      icon: MessageSquare,
      color: 'bg-pink-500',
    },
    {
      label: '総閲覧数',
      value: totalViews || 0,
      icon: Eye,
      color: 'bg-indigo-500',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
        <p className="text-gray-600 mt-2">システム全体の統計情報</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Pharmacies */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">最近登録された薬局</h2>
          {recentPharmacies && recentPharmacies.length > 0 ? (
            <div className="space-y-3">
              {recentPharmacies.map((pharmacy) => (
                <div key={pharmacy.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{pharmacy.name}</p>
                    <p className="text-sm text-gray-600">{pharmacy.address}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    pharmacy.status === 'active' 
                      ? 'bg-green-100 text-green-800' 
                      : pharmacy.status === 'pending'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {pharmacy.status === 'active' ? '承認済み' : pharmacy.status === 'pending' ? '承認待ち' : '非アクティブ'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">登録された薬局はありません</p>
          )}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">最近登録されたユーザー</h2>
          {recentUsers && recentUsers.length > 0 ? (
            <div className="space-y-3">
              {recentUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div>
                    <p className="font-medium">{user.organization_name || user.email}</p>
                    <p className="text-sm text-gray-600">{user.email}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.role === 'pharmacy_admin' 
                      ? 'bg-blue-100 text-blue-800' 
                      : user.role === 'clinic_staff'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-purple-100 text-purple-800'
                  }`}>
                    {user.role === 'pharmacy_admin' ? '薬局管理者' : user.role === 'clinic_staff' ? 'クリニックスタッフ' : '管理者'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600">登録されたユーザーはありません</p>
          )}
        </div>
      </div>
    </div>
  );
}