'use client'

import { useState } from 'react'
import { User, Edit, X } from 'lucide-react'
import ProfileEditForm from './ProfileEditForm'
import { createClient } from '@/lib/supabase/client'

interface ProfileData {
  name: string
  clinic_name: string
  organization_name: string
  medical_license_number: string
  phone: string
}

interface DoctorProfileSectionProps {
  user: any
  profile: any
}

export default function DoctorProfileSection({ user, profile }: DoctorProfileSectionProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [currentProfile, setCurrentProfile] = useState(profile)

  const handleSave = async (formData: ProfileData) => {
    const supabase = createClient()
    
    const { error } = await supabase
      .from('users')
      .update({
        name: formData.name,
        clinic_name: formData.clinic_name,
        organization_name: formData.organization_name,
        medical_license_number: formData.medical_license_number,
        phone: formData.phone
      })
      .eq('id', user.id)

    if (error) {
      throw error
    }

    // Update local state
    setCurrentProfile({ ...currentProfile, ...formData })
    setIsEditing(false)
  }

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <User className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">プロフィール設定</h2>
          </div>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <ProfileEditForm
          initialData={{
            name: currentProfile?.name || '',
            clinic_name: currentProfile?.clinic_name || '',
            organization_name: currentProfile?.organization_name || '',
            medical_license_number: currentProfile?.medical_license_number || '',
            phone: currentProfile?.phone || ''
          }}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <User className="w-5 h-5 text-gray-600" />
          <h2 className="text-lg font-semibold text-gray-900">プロフィール設定</h2>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
        >
          <Edit className="w-4 h-4" />
          編集
        </button>
      </div>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <p className="text-gray-900">{user.email}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            氏名
          </label>
          <p className="text-gray-900">{currentProfile?.name || '-'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            所属医療機関
          </label>
          <p className="text-gray-900">{currentProfile?.clinic_name || currentProfile?.organization_name || '-'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            医師免許番号
          </label>
          <p className="text-gray-900">{currentProfile?.medical_license_number || '-'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            電話番号
          </label>
          <p className="text-gray-900">{currentProfile?.phone || '-'}</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            役割
          </label>
          <p className="text-gray-900">医師</p>
        </div>
      </div>
    </div>
  )
}