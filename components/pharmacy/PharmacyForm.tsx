'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
// geocodeAddress関数はAPIルート経由で呼び出す
import { 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  Clock, 
  AlertCircle,
  Save,
  Globe
} from 'lucide-react'
import type { Database } from '@/types/supabase'

type Pharmacy = Database['public']['Tables']['pharmacies']['Row']

export default function PharmacyForm({ pharmacy }: { pharmacy: Pharmacy | null }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

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

    // 住所から座標を取得（エラーがあっても続行）
    const address = formData.get('address') as string
    let locationData = null
    
    try {
      const response = await fetch('/api/geocode', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address })
      })
      
      if (response.ok) {
        const coordinates = await response.json()
        const { lat, lng } = coordinates
        locationData = `POINT(${lng} ${lat})`
      } else {
        console.warn('位置情報の取得に失敗しましたが、登録を続行します')
      }
    } catch (err) {
      console.warn('位置情報の取得に失敗しましたが、登録を続行します:', err)
    }

    const pharmacyData: any = {
      user_id: user.id,
      name: formData.get('name') as string,
      address: formData.get('address') as string,
      phone: formData.get('phone') as string,
      email: formData.get('email') as string,
      website_url: formData.get('website_url') as string || null,
      twenty_four_support: formData.get('twenty_four_support') === 'on',
      holiday_support: formData.get('holiday_support') === 'on',
      emergency_support: formData.get('emergency_support') === 'on',
      max_capacity: parseInt(formData.get('max_capacity') as string),
      current_capacity: parseInt(formData.get('current_capacity') as string),
      coverage_radius_km: parseFloat(formData.get('coverage_radius_km') as string),
      status: 'pending' as const,
    }
    
    // 位置情報があれば追加
    if (locationData) {
      pharmacyData.location = locationData
    }

    try {
      if (pharmacy) {
        // 更新
        const { error } = await supabase
          .from('pharmacies')
          .update(pharmacyData)
          .eq('id', pharmacy.id)

        if (error) throw error
      } else {
        // 新規作成
        const { error } = await supabase
          .from('pharmacies')
          .insert(pharmacyData)

        if (error) throw error
      }

      setSuccess(true)
      router.refresh()
    } catch (err) {
      const error = err as { message?: string }
      setError(error.message || '保存に失敗しました')
    } finally {
      setIsLoading(false)
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

      <div>
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
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
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

      <div>
        <label htmlFor="website_url" className="block text-sm font-medium text-gray-700 mb-2">
          ホームページURL
        </label>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Globe className="h-5 w-5 text-gray-400" />
          </div>
          <input
            id="website_url"
            name="website_url"
            type="url"
            placeholder="https://example.com"
            defaultValue={pharmacy?.website_url || ''}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-4">
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
        </div>
      </div>

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
            defaultValue={pharmacy?.max_capacity || 0}
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
          <label htmlFor="coverage_radius_km" className="block text-sm font-medium text-gray-700 mb-2">
            対応可能範囲（km）
          </label>
          <input
            id="coverage_radius_km"
            name="coverage_radius_km"
            type="number"
            min="0"
            step="0.1"
            defaultValue={pharmacy?.coverage_radius_km || 5.0}
            className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
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