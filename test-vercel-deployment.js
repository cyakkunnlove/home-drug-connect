const https = require('https');

// 新しいVercelデプロイメントでテスト
const testPharmacyVercel = () => {
  return new Promise((resolve) => {
    const testData = {
      email: `test-pharmacy-vercel-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      organizationName: `テスト薬局 Vercel ${new Date().toISOString()}`,
      phone: '03-1234-5678'
    };

    const postData = JSON.stringify(testData);
    const options = {
      hostname: 'home-drug-connect-dfzdy218w-cyakkunnloves-projects.vercel.app',
      port: 443,
      path: '/api/auth/register-pharmacy-v2',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('=== Vercel薬局登録テスト ===');
    console.log('Email:', testData.email);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
          const result = JSON.parse(data);
          console.log('Response:', JSON.stringify(result, null, 2));
          if (result.success) {
            console.log('✅ 登録成功！');
          } else {
            console.log('❌ 登録失敗');
          }
        } catch (e) {
          console.log('Response:', data.substring(0, 200));
        }
        console.log('');
        resolve();
      });
    });

    req.on('error', (e) => {
      console.error('Error:', e.message);
      resolve();
    });

    req.write(postData);
    req.end();
  });
};

// 実行
testPharmacyVercel();