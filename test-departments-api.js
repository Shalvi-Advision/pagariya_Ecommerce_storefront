// Test script for Departments and Categories API
// Run with: node test-departments-api.js

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';
const PROJECT_CODE = process.env.REACT_APP_PROJECT_CODE || 'your_project_code_here';
const STORE_CODE = process.env.REACT_APP_STORE_CODE || 'your_store_code_here';

async function testDepartmentsAPI() {
  console.log('Testing Departments and Categories API...\n');
  
  try {
    // Test 1: Get active departments
    console.log('1. Testing get_active_department_list...');
    const departmentsResponse = await fetch(`${API_BASE_URL}/departments/get_active_department_list`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        project_code: PROJECT_CODE
      })
    });

    if (!departmentsResponse.ok) {
      throw new Error(`HTTP error! status: ${departmentsResponse.status}`);
    }

    const departmentsData = await departmentsResponse.json();
    console.log('✅ Departments API Response:', JSON.stringify(departmentsData, null, 2));

    if (departmentsData.success && departmentsData.data.length > 0) {
      // Test 2: Get categories for first department
      const firstDepartment = departmentsData.data[0];
      console.log(`\n2. Testing get_active_categories_list for department: ${firstDepartment.department_name} (ID: ${firstDepartment.department_id})...`);
      
      const categoriesResponse = await fetch(`${API_BASE_URL}/categories/get_active_categories_list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          department_id: firstDepartment.department_id,
          store_code: STORE_CODE,
          project_code: PROJECT_CODE
        })
      });

      if (!categoriesResponse.ok) {
        throw new Error(`HTTP error! status: ${categoriesResponse.status}`);
      }

      const categoriesData = await categoriesResponse.json();
      console.log('✅ Categories API Response:', JSON.stringify(categoriesData, null, 2));
    }

    console.log('\n🎉 All API tests passed!');
    
  } catch (error) {
    console.error('❌ API test failed:', error.message);
    console.log('\n📝 Make sure to:');
    console.log('1. Set REACT_APP_API_URL to your actual API base URL');
    console.log('2. Set REACT_APP_PROJECT_CODE to your actual project code');
    console.log('3. Set REACT_APP_STORE_CODE to your actual store code');
    console.log('4. Ensure your API server is running');
  }
}

// Run the test
testDepartmentsAPI();
