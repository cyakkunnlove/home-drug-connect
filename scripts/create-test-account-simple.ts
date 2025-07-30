// テストアカウント情報
console.log('=== テストアカウント情報 ===')
console.log('メールアドレス: test-pharmacy@example.com')
console.log('パスワード: TestPassword123!')
console.log('会社名: テスト薬局株式会社')
console.log('電話番号: 03-1234-5678')
console.log('==============================')
console.log('')
console.log('このアカウントを作成するには:')
console.log('1. https://home-drug-connect-9dxudw55w-cyakkunnloves-projects.vercel.app/pharmacy/register にアクセス')
console.log('2. 上記の情報で新規登録')
console.log('3. メール認証をスキップする場合は、Supabaseダッシュボードで手動で有効化')
console.log('')
console.log('または、以下のcURLコマンドを使用:')
console.log('')

const formData = {
  email: 'test-pharmacy@example.com',
  password: 'TestPassword123!',
  organizationName: 'テスト薬局株式会社',
  phone: '03-1234-5678'
}

// サインアップAPIを直接呼び出すcURLコマンドを生成
const curlCommand = `curl -X POST \\
  '${process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL'}/auth/v1/signup' \\
  -H 'apikey: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'YOUR_ANON_KEY'}' \\
  -H 'Content-Type: application/json' \\
  -d '{
    "email": "${formData.email}",
    "password": "${formData.password}",
    "data": {
      "organizationName": "${formData.organizationName}",
      "phone": "${formData.phone}"
    }
  }'`

console.log(curlCommand)