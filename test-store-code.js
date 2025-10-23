// Test script to check localStorage structure
const testLocationData = {
  pincode: "400001",
  store: {
    store_code: "STORE123",
    store_name: "Test Store"
  }
};

console.log("Expected structure:", JSON.stringify(testLocationData, null, 2));
console.log("\nAccessing store_code:");
console.log("locationData?.store?.store_code:", testLocationData?.store?.store_code);
