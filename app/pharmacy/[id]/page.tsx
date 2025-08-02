import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Phone, Mail, Clock, MapPin, CheckCircle, Globe, Users, Shield, Sparkles, ExternalLink, Home } from 'lucide-react';
import InquiryForm from '@/components/pharmacy/InquiryForm';
import GoogleMap from '@/components/maps/GoogleMap';
import Link from 'next/link';

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function PharmacyProfilePage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();

  // Fetch pharmacy details
  const { data: pharmacy, error } = await supabase
    .from('pharmacies')
    .select(`
      *,
      pharmacy_capabilities (
        capability_name,
        is_available
      )
    `)
    .eq('id', id)
    .eq('status', 'active')
    .single();

  if (error || !pharmacy) {
    notFound();
  }

  // Track view
  await supabase
    .from('pharmacy_views')
    .insert({
      pharmacy_id: id,
      referrer: 'direct',
    });

  const businessHours = pharmacy.business_hours || {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '13:00' },
    sunday: { open: 'closed', close: 'closed' },
  };

  const dayNames = {
    monday: '月曜日',
    tuesday: '火曜日',
    wednesday: '水曜日',
    thursday: '木曜日',
    friday: '金曜日',
    saturday: '土曜日',
    sunday: '日曜日',
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6">
          <ol className="flex items-center space-x-2 text-sm">
            <li><Link href="/" className="text-gray-500 hover:text-gray-700"><Home className="w-4 h-4" /></Link></li>
            <li><span className="text-gray-400">/</span></li>
            <li><Link href="/search" className="text-gray-500 hover:text-gray-700">在宅対応薬局検索</Link></li>
            <li><span className="text-gray-400">/</span></li>
            <li className="text-gray-900 font-medium">{pharmacy.name}</li>
          </ol>
        </nav>

        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-indigo-700 text-white p-8 md:p-12">
            <div className="absolute inset-0 bg-grid-white/[0.05] bg-[size:20px_20px]"></div>
            <div className="relative">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-3">{pharmacy.name}</h1>
                  <div className="flex items-center text-blue-100 mb-4">
                    <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
                    <span className="text-lg">{pharmacy.address}</span>
                  </div>
                  <div className="flex flex-wrap gap-3 mt-4">
                    {pharmacy.twenty_four_support && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 text-green-100 border border-green-400/30">
                        <Clock className="w-4 h-4 mr-1" />
                        24時間対応
                      </span>
                    )}
                    {pharmacy.holiday_support && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-500/20 text-yellow-100 border border-yellow-400/30">
                        <Sparkles className="w-4 h-4 mr-1" />
                        休日対応
                      </span>
                    )}
                    {pharmacy.emergency_support && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-500/20 text-red-100 border border-red-400/30">
                        <Shield className="w-4 h-4 mr-1" />
                        緊急対応
                      </span>
                    )}
                  </div>
                </div>
                {pharmacy.website_url && (
                  <a 
                    href={pharmacy.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="hidden md:flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-white/30 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    <span>公式サイト</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-8 p-8 md:p-12">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-8">
              {/* Quick Actions (Mobile) */}
              {pharmacy.website_url && (
                <div className="md:hidden">
                  <a 
                    href={pharmacy.website_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Globe className="w-5 h-5" />
                    <span>公式サイトを見る</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              )}

              {/* Services */}
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <CheckCircle className="w-6 h-6 mr-2 text-blue-600" />
                  提供サービス
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {pharmacy.twenty_four_support && (
                    <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <Clock className="w-5 h-5 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">24時間対応</div>
                        <div className="text-xs text-gray-500">深夜でも安心</div>
                      </div>
                    </div>
                  )}
                  {pharmacy.holiday_support && (
                    <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                      <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mr-3">
                        <Sparkles className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">休日対応</div>
                        <div className="text-xs text-gray-500">土日祝も営業</div>
                      </div>
                    </div>
                  )}
                  {pharmacy.emergency_support && (
                    <div className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                      <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                        <Shield className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900">緊急時対応</div>
                        <div className="text-xs text-gray-500">急な処方にも対応</div>
                      </div>
                    </div>
                  )}
                  {pharmacy.pharmacy_capabilities?.map((cap: any) => (
                    cap.is_available && (
                      <div key={cap.capability_name} className="flex items-center bg-white rounded-lg p-3 shadow-sm">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                          <CheckCircle className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{cap.capability_name}</div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Description */}
              {pharmacy.description && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold mb-4">薬局について</h2>
                  <p className="text-gray-600 whitespace-pre-wrap leading-relaxed">{pharmacy.description}</p>
                </div>
              )}

              {/* Business Hours */}
              <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                <h2 className="text-2xl font-bold mb-6 flex items-center">
                  <Clock className="w-6 h-6 mr-2 text-blue-600" />
                  営業時間
                </h2>
                <div className="bg-gray-50 rounded-lg p-4">
                  {Object.entries(businessHours).map(([day, hours]) => (
                    <div key={day} className="flex justify-between py-2 border-b border-gray-200 last:border-0">
                      <span className="font-medium">
                        {dayNames[day as keyof typeof dayNames]}
                      </span>
                      <span className="text-gray-600">
                        {hours.open === 'closed' ? '休業' : `${hours.open} - ${hours.close}`}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Map */}
              {pharmacy.location && (
                <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
                  <h2 className="text-2xl font-bold mb-6 flex items-center">
                    <MapPin className="w-6 h-6 mr-2 text-blue-600" />
                    アクセス
                  </h2>
                  <div className="h-80 rounded-xl overflow-hidden shadow-md">
                    <GoogleMap
                      center={{
                        lat: pharmacy.location.coordinates[1],
                        lng: pharmacy.location.coordinates[0],
                      }}
                      zoom={15}
                      markers={[{
                        position: {
                          lat: pharmacy.location.coordinates[1],
                          lng: pharmacy.location.coordinates[0],
                        },
                        title: pharmacy.name,
                      }]}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6 border border-gray-200">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Phone className="w-5 h-5 mr-2 text-gray-700" />
                  連絡先
                </h3>
                <div className="space-y-4">
                  <a 
                    href={`tel:${pharmacy.phone}`} 
                    className="flex items-center bg-white rounded-lg p-3 hover:bg-blue-50 transition-colors group"
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-blue-200">
                      <Phone className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">電話番号</div>
                      <div className="font-medium text-gray-900">{pharmacy.phone}</div>
                    </div>
                  </a>
                  {pharmacy.email && (
                    <a 
                      href={`mailto:${pharmacy.email}`} 
                      className="flex items-center bg-white rounded-lg p-3 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-purple-200">
                        <Mail className="w-5 h-5 text-purple-600" />
                      </div>
                      <div>
                        <div className="text-sm text-gray-500">メールアドレス</div>
                        <div className="font-medium text-gray-900 text-sm break-all">{pharmacy.email}</div>
                      </div>
                    </a>
                  )}
                  {pharmacy.website_url && (
                    <a 
                      href={pharmacy.website_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center bg-white rounded-lg p-3 hover:bg-blue-50 transition-colors group"
                    >
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mr-3 group-hover:bg-green-200">
                        <Globe className="w-5 h-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <div className="text-sm text-gray-500">ウェブサイト</div>
                        <div className="font-medium text-gray-900">公式サイトを見る</div>
                      </div>
                      <ExternalLink className="w-4 h-4 text-gray-400" />
                    </a>
                  )}
                </div>
              </div>

              {/* Capacity */}
              <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-blue-600" />
                  受け入れ状況
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">現在の受け入れ数</span>
                    <span className="font-medium">{pharmacy.current_capacity}件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最大受け入れ数</span>
                    <span className="font-medium">{pharmacy.max_capacity}件</span>
                  </div>
                  <div className="mt-4">
                    <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 transition-all duration-300 rounded-full"
                        style={{ 
                          width: `${(pharmacy.current_capacity / pharmacy.max_capacity) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-sm font-medium text-green-600 mt-2">
                      🟢 受け入れ可能: {pharmacy.max_capacity - pharmacy.current_capacity}件
                    </p>
                  </div>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
                <h3 className="text-lg font-bold mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-blue-600" />
                  お問い合わせ
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  この在宅対応薬局へのお問い合わせはこちらから
                </p>
                <InquiryForm pharmacyId={pharmacy.id} pharmacyName={pharmacy.name} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}