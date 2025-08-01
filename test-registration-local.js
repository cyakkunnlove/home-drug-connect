const https = require('https');

// テスト1: 薬局登録
const testPharmacy = () => {
  return new Promise((resolve) => {
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
    console.log('Email:', testData.email);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
          const result = JSON.parse(data);
          console.log('Response:', JSON.stringify(result, null, 2));
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

// テスト2: 医師登録
const testDoctor = () => {
  return new Promise((resolve) => {
    const testData = {
      email: `test-doctor-${Date.now()}@example.com`,
      password: 'TestPassword123!',
      name: `テスト医師 ${Date.now()}`,
      phone: '090-1234-5678',
      hospitalName: 'テスト病院',
      department: '内科'
    };

    const postData = JSON.stringify(testData);
    const options = {
      hostname: 'home-drug-connect-163owwm3n-cyakkunnloves-projects.vercel.app',
      port: 443,
      path: '/api/auth/register-doctor',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('=== 医師登録テスト ===');
    console.log('Email:', testData.email);

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        console.log('Status:', res.statusCode);
        try {
          const result = JSON.parse(data);
          console.log('Response:', JSON.stringify(result, null, 2));
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
(async () => {
  await testPharmacy();
  await testDoctor();
})();