// ローカル環境変数チェック
require('dotenv').config({ path: '.env.local' });

console.log('=== 環境変数チェック ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('');

console.log('Supabase設定:');
console.log('- URL設定:', !!process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('- URL長さ:', process.env.NEXT_PUBLIC_SUPABASE_URL?.length);
console.log('- Anon Key設定:', !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
console.log('- Service Role Key設定:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('- Service Role Key値:', process.env.SUPABASE_SERVICE_ROLE_KEY);
console.log('');

console.log('その他:');
console.log('- Google Maps API Key設定:', !!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY);
console.log('- Resend API Key設定:', !!process.env.RESEND_API_KEY);
console.log('');

// Service Role Keyのチェック
if (process.env.SUPABASE_SERVICE_ROLE_KEY === 'YOUR_SERVICE_ROLE_KEY_HERE') {
  console.error('❌ エラー: Service Role Keyがプレースホルダーのままです！');
  console.error('   Supabase DashboardからService Role Keyを取得して設定してください。');
} else if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ エラー: Service Role Keyが設定されていません！');
} else {
  console.log('✅ Service Role Keyが設定されています');
  console.log('   最初の10文字:', process.env.SUPABASE_SERVICE_ROLE_KEY.substring(0, 10) + '...');
}