import { createClient } from '@supabase/supabase-js'

// Supabase接続情報
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hrbsbdyutqwdxfartyzz.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseServiceKey) {
  console.error('SUPABASE_SERVICE_ROLE_KEY is not set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  }
})

async function checkTriggerFunction() {
  console.log('=== Checking Trigger Function ===')
  
  try {
    // 1. トリガー関数の定義を取得
    const { data: functionDef, error: funcError } = await supabase.rpc('get_function_definition', {
      function_name: 'handle_new_user'
    })
    
    if (funcError) {
      console.error('Error getting function definition:', funcError)
      
      // 代替方法：直接SQLクエリ
      const { data: funcData, error: sqlError } = await supabase
        .from('pg_proc')
        .select('proname, prosrc')
        .eq('proname', 'handle_new_user')
        .single()
      
      if (sqlError) {
        console.error('Error with direct query:', sqlError)
      } else {
        console.log('Function found:', funcData)
      }
    } else {
      console.log('Function definition:', functionDef)
    }
    
    // 2. 最近のauth.usersとpublic.usersの不一致を確認
    const { data: mismatchData, error: mismatchError } = await supabase.rpc('check_user_mismatch')
    
    if (mismatchError) {
      console.error('Error checking mismatch:', mismatchError)
      
      // 代替方法：auth.usersの数を確認（Service Roleで可能）
      const { count: authCount, error: authCountError } = await supabase
        .from('auth.users')
        .select('*', { count: 'exact', head: true })
      
      const { count: publicCount, error: publicCountError } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true })
      
      console.log('Auth users count:', authCount)
      console.log('Public users count:', publicCount)
      console.log('Mismatch count:', (authCount || 0) - (publicCount || 0))
    } else {
      console.log('User mismatch data:', mismatchData)
    }
    
    // 3. 最新のユーザーを確認
    const { data: recentUsers, error: recentError } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log('Recent users:', recentUsers)
    
    // 4. companiesテーブルの最新データ
    const { data: recentCompanies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(5)
    
    console.log('Recent companies:', recentCompanies)
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// カスタムRPC関数を作成するSQL
const createHelperFunctions = `
-- ユーザーの不一致を確認する関数
CREATE OR REPLACE FUNCTION check_user_mismatch()
RETURNS TABLE(
  auth_user_id uuid,
  auth_email text,
  public_user_id uuid
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id as auth_user_id,
    au.email as auth_email,
    pu.id as public_user_id
  FROM auth.users au
  LEFT JOIN public.users pu ON au.id = pu.id
  WHERE pu.id IS NULL
  ORDER BY au.created_at DESC
  LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 関数定義を取得する関数
CREATE OR REPLACE FUNCTION get_function_definition(function_name text)
RETURNS text AS $$
DECLARE
  result text;
BEGIN
  SELECT pg_get_functiondef(oid) INTO result
  FROM pg_proc
  WHERE proname = function_name
  LIMIT 1;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

console.log('Run these SQL commands in Supabase SQL Editor first:')
console.log(createHelperFunctions)
console.log('\nThen run this script to check the trigger function.')

checkTriggerFunction()