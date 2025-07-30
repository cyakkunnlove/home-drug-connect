import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { Users, Building2, CreditCard, BarChart3, Settings } from 'lucide-react';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/pharmacy/login');
  }

  // Check if user is admin
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (userData?.role !== 'admin') {
    redirect('/dashboard');
  }

  const menuItems = [
    { href: '/admin', label: 'ダッシュボード', icon: BarChart3 },
    { href: '/admin/users', label: 'ユーザー管理', icon: Users },
    { href: '/admin/pharmacies', label: '薬局管理', icon: Building2 },
    { href: '/admin/subscriptions', label: 'サブスクリプション', icon: CreditCard },
    { href: '/admin/settings', label: '設定', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-900 min-h-screen">
          <div className="p-6">
            <h2 className="text-white text-xl font-bold">管理者ダッシュボード</h2>
          </div>
          <nav className="mt-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center px-6 py-3 text-gray-300 hover:bg-gray-800 hover:text-white transition-colors"
                >
                  <Icon className="w-5 h-5 mr-3" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="bg-white shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="py-6">
                <Link href="/dashboard" className="text-primary hover:underline">
                  ← ダッシュボードに戻る
                </Link>
              </div>
            </div>
          </div>
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}