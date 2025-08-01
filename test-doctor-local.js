const http = require('http');

// ローカルホストで医師登録テスト
const testDoctorLocal = () => {
  return new Promise((resolve) => {
    const testData = {
      email: `test-doctor-local-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: `テスト医師 ${Date.now()}`,
      phone: '090-1234-5678',
      hospitalName: 'テスト病院',
      department: '内科'
    };

    const postData = JSON.stringify(testData);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: '/api/auth/register-doctor',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('=== ローカル医師登録テスト ===');
    console.log('Email:', testData.email);

    const req = http.request(options, (res) => {
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
testDoctorLocal();