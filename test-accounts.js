// Test accounts creation script
const API_BASE = 'https://home-drug-connect-fwca6k6wa-cyakkunnloves-projects.vercel.app';

async function createPharmacyAccount() {
  const timestamp = Date.now();
  const email = `test-pharmacy-${timestamp}@example.com`;
  const password = 'TestPass123!';
  
  console.log('Creating pharmacy account:', email);
  
  // First, we need to create a Supabase auth account
  const signupResponse = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      role: 'pharmacy_admin',
      organizationName: `テスト薬局 ${timestamp}`
    })
  });
  
  const signupData = await signupResponse.json();
  console.log('Signup response:', signupData);
  
  return { email, password };
}

async function createDoctorAccount() {
  const timestamp = Date.now();
  const email = `test-doctor-${timestamp}@example.com`;
  const password = 'TestPass123!';
  
  console.log('Creating doctor account:', email);
  
  // Create doctor account via signup
  const signupResponse = await fetch(`${API_BASE}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      role: 'doctor',
      organizationName: `テストクリニック ${timestamp}`
    })
  });
  
  const signupData = await signupResponse.json();
  console.log('Signup response:', signupData);
  
  return { email, password };
}

async function loginAndTest(email, password, role) {
  console.log(`\nLogging in as ${role}:`, email);
  
  const loginResponse = await fetch(`${API_BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const loginData = await loginResponse.json();
  console.log('Login response:', loginData);
  
  return loginData;
}

async function searchPharmacies() {
  console.log('\nSearching for pharmacies...');
  
  const searchResponse = await fetch(`${API_BASE}/api/pharmacies/search?` + new URLSearchParams({
    address: '東京都',
    radius: '10'
  }));
  
  const searchData = await searchResponse.json();
  console.log('Search results:', searchData);
  
  return searchData;
}

// Run tests
async function runTests() {
  try {
    // 1. Create pharmacy account
    const pharmacy = await createPharmacyAccount();
    
    // 2. Create doctor account
    const doctor = await createDoctorAccount();
    
    // 3. Login as pharmacy
    await loginAndTest(pharmacy.email, pharmacy.password, 'pharmacy');
    
    // 4. Login as doctor
    await loginAndTest(doctor.email, doctor.password, 'doctor');
    
    // 5. Search pharmacies
    await searchPharmacies();
    
    console.log('\nTest accounts created successfully!');
    console.log('Pharmacy:', pharmacy);
    console.log('Doctor:', doctor);
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

runTests();