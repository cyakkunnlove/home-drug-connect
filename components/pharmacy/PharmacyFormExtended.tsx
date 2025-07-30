'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { geocodeAddress } from '@/lib/google-maps/geocoding'
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  AlertCircle,
  Save,
  Pill,
  Shield,
  Heart,
  Users,
  CheckCircle
} from 'lucide-react'
import type { Database } from '@/types/supabase'

type Pharmacy = Database['public']['Tables']['pharmacies']['Row']

interface PharmacyFormExtendedProps {
  pharmacy: Pharmacy | null
  companyId?: string
}

export default function PharmacyFormExtended({ pharmacy, companyId }: PharmacyFormExtendedProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [addressVerified, setAddressVerified] = useState(false)
  const [verifiedAddress, setVerifiedAddress] = useState<string>('')

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)
    setSuccess(false)

    const formData = new FormData(e.currentTarget)
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      setError('ログインしてください')
      setIsLoading(false)
      return
    }

    // 住所から座標を取得
    const address = formData.get('address') as string
    const geocodingResult = await geocodeAddress(address)
    
    if (!geocodingResult) {
      setError('住所から位置情報を取得できませんでした。正しい住所を入力してください。')
      setIsLoading(false)
      return
    }
    
    const { lat, lng, formattedAddress, prefecture, city, postalCode } = geocodingResult
    const maxCapacity = parseInt(formData.get('max_capacity') as string) || 10
    const currentCapacity = parseInt(formData.get('current_capacity') as string) || 0

    const pharmacyData: any = {
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      formatted_address: formattedAddress, // 正規化された住所を保存
      prefecture,
      city,
      postal_code: postalCode,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      location: `POINT(${lng} ${lat})`,
      latitude: lat,
      longitude: lng,
      twenty_four_support: formData.get('twenty_four_support') === 'on',
      holiday_support: formData.get('holiday_support') === 'on',
      emergency_support: formData.get('emergency_support') === 'on',
      has_clean_room: formData.get('has_clean_room') === 'on',
      handles_narcotics: formData.get('handles_narcotics') === 'on',
      accepts_emergency: formData.get('accepts_emergency') === 'on',
      max_capacity: maxCapacity,
      current_capacity: currentCapacity,
      available_spots: maxCapacity - currentCapacity,
      service_radius_km: parseFloat(formData.get('service_radius_km') as string) || 5.0,
      status: pharmacy ? pharmacy.status : 'active' as const,
    }

    // 新規作成時はcompanyIdを設定
    if (!pharmacy && companyId) {
      pharmacyData.company_id = companyId
    }
    // 後方互換性のため、companyIdがない場合はuser_idを使用
    if (!pharmacy && !companyId) {
      pharmacyData.user_id = user.id
    }

    try {
      if (pharmacy) {
        // 更新
        const { error } = await supabase
          .from('pharmacies')
          .update(pharmacyData)
          .eq('id', pharmacy.id)

        if (error) throw error
        
        // サービス情報も更新
        await updatePharmacyServices(pharmacy.id, formData)
      } else {
        // 新規作成
        const { data, error } = await supabase
          .from('pharmacies')
          .insert(pharmacyData)
          .select()
          .single()

        if (error) throw error
        
        // サービス情報を初期化
        if (data) {
          await supabase.rpc('initialize_pharmacy_services', { pharmacy_id: data.id })
          await updatePharmacyServices(data.id, formData)
        }
      }

      setSuccess(true)
      setAddressVerified(true)
      setVerifiedAddress(formattedAddress)
      router.refresh()
    } catch (err) {
      const error = err as { message?: string }
      setError(error.message || '保存に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAddressVerify = async () => {
    const addressInput = document.getElementById('address') as HTMLInputElement
    const address = addressInput?.value
    
    if (!address) {
      setError('住所を入力してください')
      return
    }
    
    setIsLoading(true)
    setError(null)
    
    const geocodingResult = await geocodeAddress(address)
    
    if (!geocodingResult) {
      setError('住所が確認できませんでした。正しい住所を入力してください。')
      setIsLoading(false)
      return
    }
    
    setAddressVerified(true)
    setVerifiedAddress(geocodingResult.formattedAddress)
    setIsLoading(false)
  }
  
  const updatePharmacyServices = async (pharmacyId: string, formData: FormData) => {
    const supabase = createClient()
    const services = [
      { type: '無菌調剤', enabled: formData.get('has_clean_room') === 'on' },
      { type: '麻薬調剤', enabled: formData.get('handles_narcotics') === 'on' },
      { type: '24時間対応', enabled: formData.get('twenty_four_support') === 'on' },
      { type: '休日対応', enabled: formData.get('holiday_support') === 'on' },
      { type: '緊急時対応', enabled: formData.get('emergency_support') === 'on' },
    ]
    
    for (const service of services) {
      await supabase
        .from('pharmacy_services')
        .upsert({
          pharmacy_id: pharmacyId,
          service_type: service.type,
          is_available: service.enabled
        })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
          <p className="text-sm">保存しました</p>
        </div>
      )}

      {/* 基本情報 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">基本情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              薬局名 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Building2 className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="name"
                name="name"
                type="text"
                required
                defaultValue={pharmacy?.name || ''}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              電話番号 <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Phone className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                defaultValue={pharmacy?.phone || ''}
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="mt-6">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
            住所 <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MapPin className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="address"
              name="address"
              type="text"
              required
              defaultValue={pharmacy?.address || ''}
              onChange={() => setAddressVerified(false)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          {addressVerified && (
            <div className="mt-2 flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-green-800">住所が確認されました</p>
                <p className="text-green-700">{verifiedAddress}</p>
              </div>
            </div>
          )}
          <p className="mt-2 text-sm text-gray-500">
            例: 東京都新宿区西新宿1-1-1 ○○ビル 1階
          </p>
          <button
            type="button"
            onClick={handleAddressVerify}
            disabled={isLoading}
            className="mt-2 px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors disabled:bg-gray-50 disabled:text-gray-400"
          >
            住所を確認
          </button>
        </div>

        <div className="mt-6">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
            メールアドレス
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue={pharmacy?.email || ''}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      {/* サービス・施設情報 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">サービス・施設情報</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <Clock className="inline w-4 h-4 mr-1" />
              対応可能サービス
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  name="twenty_four_support"
                  type="checkbox"
                  defaultChecked={pharmacy?.twenty_four_support || false}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">24時間対応可能</span>
              </label>
              <label className="flex items-center">
                <input
                  name="holiday_support"
                  type="checkbox"
                  defaultChecked={pharmacy?.holiday_support || false}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">休日対応可能</span>
              </label>
              <label className="flex items-center">
                <input
                  name="emergency_support"
                  type="checkbox"
                  defaultChecked={pharmacy?.emergency_support || false}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">緊急対応可能</span>
              </label>
              <label className="flex items-center">
                <input
                  name="accepts_emergency"
                  type="checkbox"
                  defaultChecked={pharmacy?.accepts_emergency ?? true}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">緊急時の新規受入可能</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              <Shield className="inline w-4 h-4 mr-1" />
              施設基準・設備
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  name="has_clean_room"
                  type="checkbox"
                  defaultChecked={pharmacy?.has_clean_room || false}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">無菌調剤室あり</span>
              </label>
              <label className="flex items-center">
                <input
                  name="handles_narcotics"
                  type="checkbox"
                  defaultChecked={pharmacy?.handles_narcotics || false}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <span className="ml-2 text-sm text-gray-700">麻薬取扱い可能</span>
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* 受入能力 */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          <Users className="inline w-5 h-5 mr-1" />
          受入能力
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="max_capacity" className="block text-sm font-medium text-gray-700 mb-2">
              最大受入人数 <span className="text-red-500">*</span>
            </label>
            <input
              id="max_capacity"
              name="max_capacity"
              type="number"
              min="0"
              required
              defaultValue={pharmacy?.max_capacity || 10}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="current_capacity" className="block text-sm font-medium text-gray-700 mb-2">
              現在の受入人数 <span className="text-red-500">*</span>
            </label>
            <input
              id="current_capacity"
              name="current_capacity"
              type="number"
              min="0"
              required
              defaultValue={pharmacy?.current_capacity || 0}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label htmlFor="service_radius_km" className="block text-sm font-medium text-gray-700 mb-2">
              対応可能範囲（km）
            </label>
            <input
              id="service_radius_km"
              name="service_radius_km"
              type="number"
              min="0"
              step="0.1"
              defaultValue={pharmacy?.service_radius_km || 5.0}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {pharmacy && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>残り受入可能人数: </strong>
              {(pharmacy.max_capacity || 10) - (pharmacy.current_capacity || 0)} 人
            </p>
          </div>
        )}
      </div>

      <div className="flex justify-end pt-4">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          <Save className="w-5 h-5" />
          {isLoading ? '保存中...' : '保存する'}
        </button>
      </div>
    </form>
  )
}