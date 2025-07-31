'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import type { Database } from '@/types/supabase'

type UserRole = Database['public']['Enums']['user_role']

export async function signUp(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const organizationName = formData.get('organizationName') as string
  const phone = formData.get('phone') as string
  const role: UserRole = 'pharmacy_admin'

  // Supabase Authでユーザーを作成
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
  })

  if (authError) {
    return { error: authError.message }
  }

  if (authData.user) {
    // まず会社を作成
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: organizationName,
        headquarters_phone: phone,
        headquarters_email: email,
        status: 'active',
      })
      .select()
      .single()

    if (companyError) {
      console.error('会社作成エラー:', companyError)
      return { error: '会社情報の作成に失敗しました。' }
    }

    // トリガーが自動的にusersテーブルにレコードを作成するので、
    // organization_name、phone、company_idを更新
    const { error: updateError } = await supabase
      .from('users')
      .update({
        organization_name: organizationName,
        phone,
        company_id: company.id,
      })
      .eq('id', authData.user.id)

    if (updateError) {
      // 更新に失敗した場合は、少し待ってから再試行
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { error: retryError } = await supabase
        .from('users')
        .update({
          organization_name: organizationName,
          phone,
          company_id: company.id,
        })
        .eq('id', authData.user.id)
      
      if (retryError) {
        // 会社を削除
        await supabase.from('companies').delete().eq('id', company.id)
        return { error: '組織情報の保存に失敗しました。' }
      }
    }
  }

  redirect('/dashboard')
}

export async function signUpDoctor(formData: FormData) {
  const supabase = await createClient()

  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const doctorName = formData.get('doctorName') as string
  const clinicName = formData.get('clinicName') as string
  const phone = formData.get('phone') as string
  const medicalLicenseNumber = formData.get('medicalLicenseNumber') as string
  
  // 医師免許番号のバリデーション（将来的には専用テーブルに保存）
  if (!medicalLicenseNumber || medicalLicenseNumber.trim().length === 0) {
    return { error: '医師免許番号は必須です。' }
  }
  const role: UserRole = 'doctor'

  // Supabase Authでユーザーを作成（メタデータにroleを含める）
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        role: 'doctor',
        doctor_name: doctorName,
        clinic_name: clinicName
      }
    }
  })

  if (authError) {
    return { error: authError.message }
  }

  if (authData.user) {
    // まずクリニック/病院の会社を作成
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .insert({
        name: clinicName,
        headquarters_phone: phone,
        headquarters_email: email,
        status: 'active',
      })
      .select()
      .single()

    if (companyError) {
      console.error('クリニック情報作成エラー:', companyError)
      return { error: 'クリニック情報の作成に失敗しました。' }
    }

    // トリガーが自動的にusersテーブルにレコードを作成するが、
    // タイミングの問題があるので、リトライロジックを実装
    let existingUser = null
    let checkError = null
    let retryCount = 0
    const maxRetries = 5
    
    while (retryCount < maxRetries) {
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒待機
      
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user.id)
        .single()
      
      if (data || (error && error.code !== 'PGRST116')) { // PGRST116 = no rows
        existingUser = data
        checkError = error
        break
      }
      
      retryCount++
      console.log(`ユーザーレコード待機中... (${retryCount}/${maxRetries})`)
    }
    
    console.log('既存ユーザー確認:', { existingUser, checkError })
    
    if (!existingUser && !checkError) {
      // レコードが存在しない場合は作成
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email,
          organization_name: `Dr. ${doctorName} (${clinicName}) - License: ${medicalLicenseNumber}`,
          phone,
          role: 'doctor',
          company_id: company.id
        })
      
      if (insertError) {
        console.error('ユーザー作成エラー:', insertError)
        await supabase.from('companies').delete().eq('id', company.id)
        return { error: 'ユーザー情報の作成に失敗しました。' }
      }
    } else {
      // レコードが存在する場合は更新
      console.log('医師登録 - ロール設定:', { userId: authData.user.id, role })
      const { error: updateError } = await supabase
        .from('users')
        .update({
          organization_name: `Dr. ${doctorName} (${clinicName}) - License: ${medicalLicenseNumber}`,
          phone,
          role: 'doctor', // 明示的に文字列で指定
          company_id: company.id, // company_idも設定
        })
        .eq('id', authData.user.id)

      if (updateError) {
        // 更新に失敗した場合は、少し待ってから再試行
        await new Promise(resolve => setTimeout(resolve, 1000))
      
      const { error: retryError } = await supabase
        .from('users')
        .update({
          organization_name: `Dr. ${doctorName} (${clinicName}) - License: ${medicalLicenseNumber}`,
          phone,
          role: 'doctor', // 明示的に文字列で指定
          company_id: company.id, // company_idも設定
        })
        .eq('id', authData.user.id)
      
        if (retryError) {
          // 会社を削除
          await supabase.from('companies').delete().eq('id', company.id)
          return { error: '医師情報の保存に失敗しました。' }
        }
      }
    }
    
    // 更新後のユーザー情報を確認
    const { data: finalUserData } = await supabase
      .from('users')
      .select('*')
      .eq('id', authData.user.id)
      .single()
    
    console.log('医師登録完了 - 最終ユーザー情報:', finalUserData)
  }

  console.log('医師登録完了 - /doctorにリダイレクトします')
  redirect('/doctor')
}

export async function signIn(formData: FormData): Promise<{ error?: string; details?: any } | void> {
  try {
    const supabase = await createClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    console.log('ログイン試行:', { email, passwordLength: password?.length })

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('Supabaseログインエラー:', {
        message: error.message,
        status: error.status,
        name: error.name,
      })
      return { 
        error: error.message,
        details: {
          status: error.status,
          name: error.name,
          rawError: JSON.stringify(error)
        }
      }
    }

    console.log('ログイン成功:', { userId: data.user?.id })

    // ユーザー情報を確認
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', data.user.id)
      .single()

    if (userError) {
      console.error('ユーザーデータ取得エラー:', userError)
      return {
        error: 'ユーザー情報の取得に失敗しました。',
        details: {
          userError: JSON.stringify(userError)
        }
      }
    } else {
      console.log('ユーザーデータ:', userData)
    }

    // ユーザーの役割に応じてリダイレクト
    if (userData?.role === 'doctor') {
      redirect('/doctor')
    } else {
      redirect('/dashboard')
    }
  } catch (error) {
    console.error('予期せぬエラー:', error)
    return { 
      error: '予期せぬエラーが発生しました。',
      details: {
        errorType: error instanceof Error ? error.constructor.name : 'unknown',
        message: error instanceof Error ? error.message : JSON.stringify(error),
        stack: error instanceof Error ? error.stack : undefined
      }
    }
  }
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}