import { notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Phone, Mail, Clock, MapPin, CheckCircle, Globe } from 'lucide-react';
import InquiryForm from '@/components/pharmacy/InquiryForm';
import { GoogleMap } from '@/components/maps/GoogleMap';

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
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Header */}
          <div className="bg-primary text-white p-6 md:p-8">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">{pharmacy.name}</h1>
            <div className="flex items-center text-sm md:text-base opacity-90">
              <MapPin className="w-4 h-4 mr-2" />
              <span>{pharmacy.address}</span>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6 p-6 md:p-8">
            {/* Main Content */}
            <div className="md:col-span-2 space-y-6">
              {/* Services */}
              <div>
                <h2 className="text-xl font-semibold mb-4">提供サービス</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {pharmacy.twenty_four_support && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span>24時間対応</span>
                    </div>
                  )}
                  {pharmacy.holiday_support && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span>休日対応</span>
                    </div>
                  )}
                  {pharmacy.emergency_support && (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="w-5 h-5 mr-2" />
                      <span>緊急時対応</span>
                    </div>
                  )}
                  {pharmacy.pharmacy_capabilities?.map((cap: any) => (
                    cap.is_available && (
                      <div key={cap.capability_name} className="flex items-center text-green-600">
                        <CheckCircle className="w-5 h-5 mr-2" />
                        <span>{cap.capability_name}</span>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Description */}
              {pharmacy.description && (
                <div>
                  <h2 className="text-xl font-semibold mb-4">薬局について</h2>
                  <p className="text-gray-600 whitespace-pre-wrap">{pharmacy.description}</p>
                </div>
              )}

              {/* Business Hours */}
              <div>
                <h2 className="text-xl font-semibold mb-4">営業時間</h2>
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
              <div>
                <h2 className="text-xl font-semibold mb-4">アクセス</h2>
                <div className="h-64 rounded-lg overflow-hidden">
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
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">連絡先</h3>
                <div className="space-y-3">
                  <a 
                    href={`tel:${pharmacy.phone}`} 
                    className="flex items-center text-primary hover:underline"
                  >
                    <Phone className="w-5 h-5 mr-3" />
                    <span>{pharmacy.phone}</span>
                  </a>
                  {pharmacy.email && (
                    <a 
                      href={`mailto:${pharmacy.email}`} 
                      className="flex items-center text-primary hover:underline"
                    >
                      <Mail className="w-5 h-5 mr-3" />
                      <span>{pharmacy.email}</span>
                    </a>
                  )}
                  {pharmacy.website && (
                    <a 
                      href={pharmacy.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="flex items-center text-primary hover:underline"
                    >
                      <Globe className="w-5 h-5 mr-3" />
                      <span>ウェブサイト</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Capacity */}
              <div className="bg-gray-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">受け入れ状況</h3>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">現在の受け入れ数</span>
                    <span className="font-medium">{pharmacy.current_capacity}件</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">最大受け入れ数</span>
                    <span className="font-medium">{pharmacy.max_capacity}件</span>
                  </div>
                  <div className="mt-3">
                    <div className="bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary rounded-full h-2 transition-all duration-300"
                        style={{ 
                          width: `${(pharmacy.current_capacity / pharmacy.max_capacity) * 100}%` 
                        }}
                      />
                    </div>
                    <p className="text-sm text-gray-600 mt-1">
                      受け入れ可能: {pharmacy.max_capacity - pharmacy.current_capacity}件
                    </p>
                  </div>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="bg-primary-50 rounded-lg p-6">
                <h3 className="font-semibold mb-4">お問い合わせ</h3>
                <p className="text-sm text-gray-600 mb-4">
                  この薬局へのお問い合わせはこちらから
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