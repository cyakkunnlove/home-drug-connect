import { NextRequest, NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'

export async function GET() {
  try {
    const supabase = await createClient()
    
    // 環境変数の確認
    const config = {
      hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      url: process.env.NEXT_PUBLIC_SUPABASE_URL?.trim(), // 改行文字を除去
    }
    
    // 既存ユーザーの確認
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, role')
      .limit(5)
    
    // companiesテーブルの確認
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('id, name')
      .limit(5)
    
    // RLSポリシーの確認（service roleで実行）
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies_info')
    
    return NextResponse.json({
      config,
      database: {
        users: {
          count: users?.length || 0,
          error: usersError?.message,
          sample: users
        },
        companies: {
          count: companies?.length || 0,
          error: companiesError?.message,
          sample: companies
        }
      },
      policies: {
        error: policiesError?.message,
        data: policies
      }
    })
  } catch (error) {
    return NextResponse.json({
      error: 'Configuration check failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { test } = await request.json()
    
    if (test === 'create-company') {
      const serviceClient = await createServiceClient()
      
      // Service Clientで直接companiesテーブルに挿入テスト（RLSをバイパス）
      const { data, error } = await serviceClient
        .from('companies')
        .insert({
          name: `Test Company ${Date.now()}`,
          headquarters_phone: '03-1234-5678',
          headquarters_email: 'test@example.com',
          status: 'active'
        })
        .select()
      
      return NextResponse.json({
        success: !error,
        data,
        error: error ? {
          message: error.message,
          code: error.code,
          details: error.details
        } : null
      })
    }
    
    return NextResponse.json({ error: 'Invalid test type' }, { status: 400 })
  } catch (error) {
    return NextResponse.json({
      error: 'Test failed',
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}