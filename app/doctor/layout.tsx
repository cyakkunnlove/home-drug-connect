import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DoctorLayoutClient from './DoctorLayoutClient'

export default async function DoctorLayout({
  children,
}: {
  children: ReactNode
}) {
  const supabase = await createClient()
  
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    redirect('/doctor/login')
  }

  const { data: userData } = await supabase
    .from('users')
    .select('role, name, clinic_name, organization_name')
    .eq('id', user.id)
    .single()

  console.log('医師レイアウト - ユーザー情報:', { userId: user.id, role: userData?.role })

  if (!userData || userData.role !== 'doctor') {
    console.log('医師レイアウト - 権限エラー: ユーザーロールが医師ではありません', userData)
    redirect('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <DoctorLayoutClient 
        userEmail={user.email || ''}
        doctorName={userData?.name}
        clinicName={userData?.clinic_name}
        organizationName={userData?.organization_name}
      >
        {children}
      </DoctorLayoutClient>
    </div>
  )
}