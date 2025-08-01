// テスト用薬局登録スクリプト
// Node.jsで実行: node test-registration.js

const testPharmacyRegistration = async () => {
  const testData = {
    email: `test-pharmacy-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    organizationName: `テスト薬局 ${new Date().toLocaleString('ja-JP')}`,
    phone: '03-1234-5678'
  };

  console.log('=== 薬局登録テスト開始 ===');
  console.log('テストデータ:', {
    ...testData,
    password: '***'
  });

  try {
    const response = await fetch('https://home-drug-connect-163owwm3n-cyakkunnloves-projects.vercel.app/api/auth/register-pharmacy-v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('\nレスポンスステータス:', response.status);
    console.log('レスポンス内容:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ 薬局登録成功！');
      console.log('ユーザーID:', result.user?.id);
      console.log('会社ID:', result.company?.id);
    } else {
      console.log('\n❌ 薬局登録失敗');
      console.log('エラー:', result.error);
    }
  } catch (error) {
    console.error('\n❌ リクエストエラー:', error.message);
  }
};

const testDoctorRegistration = async () => {
  const testData = {
    email: `test-doctor-${Date.now()}@example.com`,
    password: 'TestPassword123!',
    name: `テスト医師 ${new Date().toLocaleString('ja-JP')}`,
    phone: '090-1234-5678',
    hospitalName: 'テスト病院',
    department: '内科'
  };

  console.log('\n=== 医師登録テスト開始 ===');
  console.log('テストデータ:', {
    ...testData,
    password: '***'
  });

  try {
    const response = await fetch('https://home-drug-connect-163owwm3n-cyakkunnloves-projects.vercel.app/api/auth/register-doctor', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    
    console.log('\nレスポンスステータス:', response.status);
    console.log('レスポンス内容:', JSON.stringify(result, null, 2));

    if (response.ok) {
      console.log('\n✅ 医師登録成功！');
      console.log('ユーザーID:', result.user?.id);
      console.log('医師ID:', result.doctor?.id);
    } else {
      console.log('\n❌ 医師登録失敗');
      console.log('エラー:', result.error);
    }
  } catch (error) {
    console.error('\n❌ リクエストエラー:', error.message);
  }
};

// 実行
(async () => {
  await testPharmacyRegistration();
  // 少し待機してから医師登録もテスト
  setTimeout(async () => {
    await testDoctorRegistration();
  }, 2000);
})();