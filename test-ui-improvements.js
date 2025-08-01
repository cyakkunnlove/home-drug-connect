const http = require('http');

// ローカルホストで薬局登録UIテスト
const testPharmacyUI = () => {
  console.log('=== 薬局登録UI改善テスト ===');
  console.log('1. 薬局登録画面を開く: http://localhost:3000/pharmacy/register');
  console.log('2. フォームに入力して登録ボタンをクリック');
  console.log('3. 成功メッセージが表示されることを確認');
  console.log('4. 3秒後にダッシュボードへ自動遷移することを確認');
  console.log('');
};

// ローカルホストで医師登録UIテスト
const testDoctorUI = () => {
  console.log('=== 医師登録UI改善テスト ===');
  console.log('1. 医師登録画面を開く: http://localhost:3000/doctor/register');
  console.log('2. フォームに入力して登録ボタンをクリック');
  console.log('3. 成功メッセージが表示されることを確認');
  console.log('4. 3秒後にダッシュボードへ自動遷移することを確認');
  console.log('');
};

// テスト手順を表示
console.log('=== UI/UX改善テスト手順 ===\n');
testPharmacyUI();
testDoctorUI();

console.log('=== テストデータ例 ===');
console.log('薬局登録:');
console.log('  会社名: テスト薬局株式会社');
console.log('  メール: test-pharmacy-' + Date.now() + '@example.com');
console.log('  電話番号: 03-1234-5678');
console.log('  パスワード: TestPassword123!');
console.log('');
console.log('医師登録:');
console.log('  医師名: テスト太郎');
console.log('  メール: test-doctor-' + Date.now() + '@example.com');
console.log('  所属: テストクリニック');
console.log('  電話番号: 090-1234-5678');
console.log('  医師免許番号: 第123456号');
console.log('  パスワード: TestPassword123!');