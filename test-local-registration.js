// ローカルでのテスト用スクリプト
const https = require('https');

const testData = {
  email: `test-pharmacy-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  organizationName: `テスト薬局 ${new Date().toISOString()}`,
  phone: '03-1234-5678'
};

const postData = JSON.stringify(testData);

const options = {
  hostname: 'home-drug-connect-163owwm3n-cyakkunnloves-projects.vercel.app',
  port: 443,
  path: '/api/auth/register-pharmacy-v2',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(postData)
  }
};

console.log('=== 薬局登録テスト ===');
console.log('テストデータ:', {
  ...testData,
  password: '***'
});

const req = https.request(options, (res) => {
  console.log(`\nステータスコード: ${res.statusCode}`);
  console.log('ヘッダー:', res.headers);
  
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\nレスポンス:');
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed, null, 2));
    } catch (e) {
      console.log(data);
    }
  });
});

req.on('error', (e) => {
  console.error(`問題が発生しました: ${e.message}`);
});

req.write(postData);
req.end();