// Test script to check API URL configuration
console.log('🔍 Testing API URL Configuration');
console.log('================================');

// Simulate the constants import
const APP_CONSTANTS = {
  API_BASE_URL: process.env.REACT_APP_API_URL || "https://ecom-api-ozl0.onrender.com/api"
};

console.log('Environment Variables:');
console.log('- NODE_ENV:', process.env.NODE_ENV);
console.log('- REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('- API_BASE_URL:', APP_CONSTANTS.API_BASE_URL);

// Test the actual API
const testAPI = async () => {
  try {
    console.log('\n🧪 Testing API Connection...');
    console.log('URL:', APP_CONSTANTS.API_BASE_URL + '/auth/login');
    
    const response = await fetch(APP_CONSTANTS.API_BASE_URL + '/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'test123'
      })
    });
    
    const data = await response.json();
    console.log('✅ API Response Status:', response.status);
    console.log('✅ API Response:', data);
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
};

testAPI();
