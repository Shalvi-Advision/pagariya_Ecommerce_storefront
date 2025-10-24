// Test script for the new product details API integration
// This script tests the new getProductByPcode function

const { getProductByPcode } = require('./src/api/productsApi');

async function testProductDetailsAPI() {
  console.log('🧪 Testing Product Details API Integration');
  console.log('==========================================');
  
  try {
    // Test with the example data from the API specification
    const testParams = {
      pcode: '2390',
      dept_id: '2',
      category_id: '89',
      sub_category_id: '349',
      store_code: 'AVB'
    };
    
    console.log('📋 Test Parameters:', testParams);
    console.log('📡 Making API call...');
    
    const result = await getProductByPcode(
      testParams.pcode,
      testParams.dept_id,
      testParams.category_id,
      testParams.sub_category_id,
      testParams.store_code
    );
    
    console.log('✅ API Call Successful!');
    console.log('📦 Response:', JSON.stringify(result, null, 2));
    
    if (result.success && result.data) {
      console.log('🎉 Product Details API Integration Test PASSED');
      console.log('📊 Product Data Summary:');
      console.log(`   - Product Name: ${result.data.product_name}`);
      console.log(`   - Product Code: ${result.data.p_code}`);
      console.log(`   - Price: ₹${result.data.our_price}`);
      console.log(`   - MRP: ₹${result.data.product_mrp}`);
      console.log(`   - Image: ${result.data.pcode_img}`);
    } else {
      console.log('❌ API returned unsuccessful response');
    }
    
  } catch (error) {
    console.error('❌ Test FAILED:', error.message);
    console.error('🔍 Error details:', error);
  }
}

// Run the test
testProductDetailsAPI();
