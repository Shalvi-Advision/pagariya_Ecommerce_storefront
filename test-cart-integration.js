// Cart API Integration Test
// Simple test to verify cart API integration works

import cartService from '../services/cartService';
import { createCartItemFromProduct, isUserAuthenticated } from '../utils/cartUtils';

// Test data
const testProduct = {
  p_code: 'TEST001',
  product_name: 'Test Product',
  our_price: 100,
  product_mrp: 120,
  package_size: 500,
  package_unit: 'GM',
  brand_name: 'Test Brand',
  pcode_img: 'https://example.com/test.jpg',
  store_quantity: 10,
  max_quantity_allowed: 5
};

const testCartItem = createCartItemFromProduct(testProduct, 2);

console.log('🧪 Cart API Integration Test');
console.log('============================');

// Test 1: Check if user is authenticated
console.log('1. User Authentication Check:');
console.log('   - Is authenticated:', isUserAuthenticated());
console.log('   - User mobile:', cartService.getUserMobile());
console.log('   - Store code:', cartService.getStoreCode());

// Test 2: Test cart item creation
console.log('\n2. Cart Item Creation:');
console.log('   - Test product:', testProduct);
console.log('   - Created cart item:', testCartItem);

// Test 3: Test data transformation
console.log('\n3. Data Transformation:');
const apiFormat = cartService.transformToApiFormat(testCartItem);
console.log('   - Frontend to API format:', apiFormat);

const frontendFormat = cartService.transformFromApiFormat(apiFormat);
console.log('   - API to Frontend format:', frontendFormat);

// Test 4: Test cart totals calculation
console.log('\n4. Cart Totals Calculation:');
const totals = cartService.calculateCartTotals([testCartItem]);
console.log('   - Cart totals:', totals);

// Test 5: Test API methods (will only work if authenticated)
console.log('\n5. API Methods Test:');
if (isUserAuthenticated()) {
  console.log('   - User is authenticated, API calls will work');
  console.log('   - Available methods:');
  console.log('     * saveCart()');
  console.log('     * validateCart()');
  console.log('     * getCart()');
  console.log('     * clearCart()');
  console.log('     * addItemToCart()');
  console.log('     * getAllCarts()');
  console.log('     * mergeGuestCart()');
} else {
  console.log('   - User is not authenticated, API calls will be skipped');
  console.log('   - Cart operations will work in guest mode');
}

console.log('\n✅ Cart API Integration Test Complete');
console.log('=====================================');

// Export for use in other test files
export {
  testProduct,
  testCartItem,
  cartService
};
