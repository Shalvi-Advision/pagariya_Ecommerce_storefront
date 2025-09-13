// Test script to verify API configuration
import { APP_CONSTANTS } from './src/constants/index.js';

console.log('🔍 API Configuration Test');
console.log('========================');
console.log('Environment:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('API_BASE_URL:', APP_CONSTANTS.API_BASE_URL);
console.log('IMAGE_BASE_URL:', APP_CONSTANTS.IMAGE_BASE_URL);

// Test API connection
const testAPI = async () => {
  try {
    console.log('\n🧪 Testing API Connection...');
    const response = await fetch(`${APP_CONSTANTS.API_BASE_URL}/auth/login`, {
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
    console.log('✅ API Response:', data);
  } catch (error) {
    console.error('❌ API Error:', error.message);
  }
};

testAPI();
