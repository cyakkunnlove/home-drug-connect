// E2E test script for 在宅薬局ナビ
const API_BASE = 'http://localhost:3002';

// Test data
const timestamp = Date.now();
const pharmacyEmail = `test-pharmacy-${timestamp}@example.com`;
const doctorEmail = `test-doctor-${timestamp}@example.com`;
const password = 'TestPass123!';

// Helper function to make API calls
async function apiCall(endpoint, method = 'GET', body = null, headers = {}) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    }
  };
  
  if (body && method !== 'GET') {
    options.body = JSON.stringify(body);
  }
  
  try {
    const response = await fetch(`${API_BASE}${endpoint}`, options);
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { status: 500, error: error.message };
  }
}

// Test scenarios
async function runTests() {
  console.log('🧪 在宅薬局ナビ E2E テスト開始\n');
  
  // 1. Create test accounts using the test endpoint
  console.log('📋 テスト 1: テストアカウント作成');
  
  // Create pharmacy account
  console.log('  → 薬局アカウント作成中...');
  const pharmacyCreate = await apiCall('/api/test/create-account', 'POST', {
    email: pharmacyEmail,
    password: password,
    role: 'pharmacy_admin',
    name: `テスト薬局 ${timestamp}`,
    address: '東京都渋谷区道玄坂1-2-3',
    phone: '03-1234-5678'
  });
  console.log('  薬局アカウント:', pharmacyCreate);
  
  // Create doctor account
  console.log('  → 医師アカウント作成中...');
  const doctorCreate = await apiCall('/api/test/create-account', 'POST', {
    email: doctorEmail,
    password: password,
    role: 'doctor',
    name: `テスト医師 ${timestamp}`,
    organization: `テストクリニック ${timestamp}`
  });
  console.log('  医師アカウント:', doctorCreate);
  
  // 2. Test login functionality
  console.log('\n📋 テスト 2: ログイン機能');
  
  // Login as pharmacy
  console.log('  → 薬局としてログイン...');
  const pharmacyLogin = await apiCall('/api/auth/login', 'POST', {
    email: pharmacyEmail,
    password: password
  });
  console.log('  薬局ログイン結果:', pharmacyLogin);
  
  // Login as doctor
  console.log('  → 医師としてログイン...');
  const doctorLogin = await apiCall('/api/auth/login', 'POST', {
    email: doctorEmail,
    password: password
  });
  console.log('  医師ログイン結果:', doctorLogin);
  
  // 3. Test pharmacy search
  console.log('\n📋 テスト 3: 薬局検索機能');
  const searchResult = await apiCall('/api/pharmacies/search?address=東京都&radius=10');
  console.log('  検索結果:', searchResult);
  
  // 4. Test creating a request from doctor to pharmacy
  if (searchResult.data && searchResult.data.pharmacies && searchResult.data.pharmacies.length > 0) {
    console.log('\n📋 テスト 4: 医師から薬局への依頼作成');
    const targetPharmacy = searchResult.data.pharmacies[0];
    
    const requestCreate = await apiCall('/api/requests', 'POST', {
      pharmacy_id: targetPharmacy.id,
      doctor_id: doctorLogin.data?.user?.id,
      patient_info: {
        medications: [
          { name: 'テスト薬A', dosage: '100mg', frequency: '1日2回' }
        ],
        conditions: ['高血圧'],
        treatmentPlan: 'テスト治療計画'
      },
      request_text: 'テスト依頼文書',
      urgency: 'normal'
    });
    console.log('  依頼作成結果:', requestCreate);
  }
  
  // 5. Test contact form
  console.log('\n📋 テスト 5: お問い合わせ機能');
  const contactResult = await apiCall('/api/contact', 'POST', {
    name: 'テストユーザー',
    email: 'test@example.com',
    message: 'これはテストメッセージです'
  });
  console.log('  お問い合わせ結果:', contactResult);
  
  // 6. Test data generation
  console.log('\n📋 テスト 6: テストデータ生成');
  const testDataResult = await apiCall('/api/test/create-data', 'POST');
  console.log('  テストデータ生成結果:', testDataResult);
  
  console.log('\n✅ E2Eテスト完了');
  console.log('\n📝 作成したテストアカウント:');
  console.log(`  薬局: ${pharmacyEmail} / ${password}`);
  console.log(`  医師: ${doctorEmail} / ${password}`);
}

// Run the tests
runTests().catch(error => {
  console.error('❌ テストエラー:', error);
});