
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Mail, Phone, Calendar, MessageSquare, User } from 'lucide-react';
import InquiryActions from './InquiryActions';
export const dynamic = 'force-dynamic'


export default async function InquiriesPage() {
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
          <h1 className="text-2xl font-bold text-gray-900">お問い合わせ管理</h1>
          <p className="text-gray-600 mt-2">薬局を登録すると、お問い合わせを受け取ることができます。</p>
        </div>
      </div>
    );
  }

  const pharmacyIds = pharmacies.map(p => p.id);

  // Get inquiries
  const { data: inquiries } = await supabase
    .from('inquiries')
    .select('*')
    .in('pharmacy_id', pharmacyIds)
    .order('created_at', { ascending: false });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'read':
        return 'bg-blue-100 text-blue-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending':
        return '未読';
      case 'read':
        return '既読';
      case 'replied':
        return '返信済み';
      case 'closed':
        return 'クローズ';
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">お問い合わせ管理</h1>
        <p className="text-gray-600 mt-2">受信したお問い合わせの一覧</p>
      </div>

      {inquiries && inquiries.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm">
          <div className="divide-y divide-gray-200">
            {inquiries.map((inquiry) => {
              const pharmacy = pharmacies.find(p => p.id === inquiry.pharmacy_id);
              return (
                <div key={inquiry.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-lg font-medium text-gray-900">
                          {inquiry.subject}
                        </h3>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusBadge(inquiry.status)}`}>
                          {getStatusText(inquiry.status)}
                        </span>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span>{inquiry.from_name}</span>
                        </div>
                        <div className="flex items-center">
                          <Mail className="w-4 h-4 mr-2" />
                          <a href={`mailto:${inquiry.from_email}`} className="hover:text-primary">
                            {inquiry.from_email}
                          </a>
                        </div>
                        {inquiry.from_phone && (
                          <div className="flex items-center">
                            <Phone className="w-4 h-4 mr-2" />
                            <a href={`tel:${inquiry.from_phone}`} className="hover:text-primary">
                              {inquiry.from_phone}
                            </a>
                          </div>
                        )}
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-2" />
                          <span>{new Date(inquiry.created_at).toLocaleDateString('ja-JP')}</span>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-4">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {inquiry.message}
                        </p>
                      </div>

                      {pharmacy && (
                        <p className="text-xs text-gray-500 mt-2">
                          薬局: {pharmacy.name}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="mt-4">
                    <InquiryActions inquiry={inquiry} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm p-12 text-center">
          <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            お問い合わせはありません
          </h3>
          <p className="text-gray-600">
            新しいお問い合わせが届くとここに表示されます。
          </p>
        </div>
      )}
    </div>
  );
}
