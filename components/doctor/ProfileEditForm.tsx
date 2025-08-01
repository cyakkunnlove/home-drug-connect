'use client'

import { useState } from 'react'
import { User, Building2, Phone, CreditCard, Loader2 } from 'lucide-react'
import toast from 'react-hot-toast'

interface ProfileData {
  name: string
  clinic_name: string
  organization_name: string
  medical_license_number: string
  phone: string
}

interface ProfileEditFormProps {
  initialData: ProfileData
  onSave: (data: ProfileData) => Promise<void>
  onCancel: () => void
}

export default function ProfileEditForm({ initialData, onSave, onCancel }: ProfileEditFormProps) {
  const [formData, setFormData] = useState<ProfileData>(initialData)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error('氏名を入力してください')
      return
    }

    setIsSubmitting(true)
    try {
      await onSave(formData)
      toast.success('プロフィールを更新しました')
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error('更新に失敗しました')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleInputChange = (field: keyof ProfileData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          氏名 <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="医師名を入力してください"
            required
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          所属医療機関
        </label>
        <div className="relative">
          <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={formData.clinic_name || formData.organization_name || ''}
            onChange={(e) => {
              handleInputChange('clinic_name', e.target.value)
              handleInputChange('organization_name', e.target.value)
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="病院・クリニック名を入力してください"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          医師免許番号
        </label>
        <div className="relative">
          <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            value={formData.medical_license_number}
            onChange={(e) => handleInputChange('medical_license_number', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="医師免許番号を入力してください"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          電話番号
        </label>
        <div className="relative">
          <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="03-1234-5678"
          />
        </div>
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={isSubmitting}
          className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          キャンセル
        </button>
        <button
          type="submit"
          disabled={isSubmitting || !formData.name.trim()}
          className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" />
              更新中...
            </>
          ) : (
            '保存する'
          )}
        </button>
      </div>
    </form>
  )
}