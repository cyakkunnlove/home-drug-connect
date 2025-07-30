import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Eye, TrendingUp, Users, MessageSquare, Calendar, BarChart3 } from 'lucide-react';
import AnalyticsChart from './AnalyticsChart';

export default async function AnalyticsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/pharmacy/login');
  }

  // Get user's pharmacies
  const { data: pharmacies } = await supabase
    .from('pharmacies')
    .select('id, name')
    .eq('user_id', user.id);

  if (!pharmacies || pharmacies.length === 0) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">アナリティクス</h1>
          <p className="text-gray-600 mt-2">薬局を登録すると、アナリティクスを確認できます。</p>
        </div>
      </div>
    );
  }

  const pharmacyIds = pharmacies.map(p => p.id);

  // Get analytics data for the last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [
    { data: views },
    { count: totalViews },
    { count: totalInquiries },
    { data: dailyViews },
    { data: searchLogs }
  ] = await Promise.all([
    // Recent views
    supabase
      .from('pharmacy_views')
      .select('*')
      .in('pharmacy_id', pharmacyIds)
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100),
    
    // Total views
    supabase
      .from('pharmacy_views')
      .select('*', { count: 'exact', head: true })
      .in('pharmacy_id', pharmacyIds),
    
    // Total inquiries
    supabase
      .from('inquiries')
      .select('*', { count: 'exact', head: true })
      .in('pharmacy_id', pharmacyIds),
    
    // Daily views for chart
    supabase
      .rpc('get_daily_pharmacy_views', {
        pharmacy_ids: pharmacyIds,
        start_date: thirtyDaysAgo.toISOString()
      }),
    
    // Search logs that resulted in pharmacy views
    supabase
      .from('search_logs')
      .select('*')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(20)
  ]);

  // Calculate unique visitors
  const uniqueVisitors = new Set(views?.map(v => v.viewer_session_id || v.viewer_user_id)).size;

  // Calculate referrer stats
  const referrerStats = views?.reduce((acc: any, view: any) => {
    const referrer = view.referrer || 'direct';
    acc[referrer] = (acc[referrer] || 0) + 1;
    return acc;
  }, {});

  const stats = [
    {
      label: '総閲覧数',
      value: totalViews || 0,
      icon: Eye,
      change: '+12.5%',
      changeType: 'positive',
    },
    {
      label: 'ユニーク訪問者',
      value: uniqueVisitors,
      icon: Users,
      change: '+8.2%',
      changeType: 'positive',
    },
    {
      label: '問い合わせ数',
      value: totalInquiries || 0,
      icon: MessageSquare,
      change: '+5.1%',
      changeType: 'positive',
    },
    {
      label: 'コンバージョン率',
      value: totalViews ? `${((totalInquiries || 0) / totalViews * 100).toFixed(1)}%` : '0%',
      icon: TrendingUp,
      change: '-2.3%',
      changeType: 'negative',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">アナリティクス</h1>
        <p className="text-gray-600 mt-2">薬局のパフォーマンス分析</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <Icon className="w-8 h-8 text-gray-400" />
                <span className={`text-sm font-medium ${
                  stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.change}
                </span>
              </div>
              <p className="mt-4 text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-600">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {/* Views Chart */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">閲覧数の推移</h2>
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="w-4 h-4 mr-1" />
            <span>過去30日間</span>
          </div>
        </div>
        <AnalyticsChart data={dailyViews || []} />
      </div>

      {/* Referrer Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">流入元</h2>
          {referrerStats && Object.keys(referrerStats).length > 0 ? (
            <div className="space-y-3">
              {Object.entries(referrerStats)
                .sort(([, a], [, b]) => (b as number) - (a as number))
                .slice(0, 5)
                .map(([referrer, count]) => (
                  <div key={referrer} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {referrer === 'direct' ? '直接アクセス' : referrer}
                    </span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div 
                          className="bg-primary rounded-full h-2"
                          style={{ 
                            width: `${((count as number) / (totalViews || 1)) * 100}%` 
                          }}
                        />
                      </div>
                      <span className="text-sm font-medium">{count as number}</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-600">データがありません</p>
          )}
        </div>

        {/* Search Keywords */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">検索キーワード</h2>
          {searchLogs && searchLogs.length > 0 ? (
            <div className="space-y-3">
              {searchLogs
                .filter((log: any) => log.search_address)
                .slice(0, 5)
                .map((log: any, index: number) => (
                  <div key={log.id} className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">
                      {log.search_address}
                    </span>
                    <span className="text-sm font-medium">
                      {log.results_count || 0}件
                    </span>
                  </div>
                ))}
            </div>
          ) : (
            <p className="text-gray-600">データがありません</p>
          )}
        </div>
      </div>

      {/* Pharmacy Performance */}
      {pharmacies.length > 1 && (
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-lg font-semibold mb-4">薬局別パフォーマンス</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-900">薬局名</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-900">閲覧数</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-900">問い合わせ数</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-900">コンバージョン率</th>
                </tr>
              </thead>
              <tbody>
                {pharmacies.map((pharmacy) => {
                  const pharmacyViews = views?.filter(v => v.pharmacy_id === pharmacy.id).length || 0;
                  const pharmacyInquiries = 0; // TODO: Get actual inquiry count
                  const conversionRate = pharmacyViews ? (pharmacyInquiries / pharmacyViews * 100).toFixed(1) : '0.0';
                  
                  return (
                    <tr key={pharmacy.id} className="border-b">
                      <td className="py-3 px-4 text-sm">{pharmacy.name}</td>
                      <td className="py-3 px-4 text-sm text-right">{pharmacyViews}</td>
                      <td className="py-3 px-4 text-sm text-right">{pharmacyInquiries}</td>
                      <td className="py-3 px-4 text-sm text-right">{conversionRate}%</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}