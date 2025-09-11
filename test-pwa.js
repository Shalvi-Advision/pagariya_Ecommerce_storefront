// PWA Testing Script
// Run this in the browser console to test PWA functionality

console.log('🔍 Testing PWA Implementation...');

// Test 1: Check if Service Worker is supported
function testServiceWorkerSupport() {
  console.log('\n1. Testing Service Worker Support:');
  if ('serviceWorker' in navigator) {
    console.log('✅ Service Worker is supported');
    return true;
  } else {
    console.log('❌ Service Worker is not supported');
    return false;
  }
}

// Test 2: Check if Service Worker is registered
async function testServiceWorkerRegistration() {
  console.log('\n2. Testing Service Worker Registration:');
  try {
    const registration = await navigator.serviceWorker.getRegistration();
    if (registration) {
      console.log('✅ Service Worker is registered');
      console.log('   Scope:', registration.scope);
      console.log('   State:', registration.active ? registration.active.state : 'No active worker');
      return true;
    } else {
      console.log('❌ No Service Worker registered');
      return false;
    }
  } catch (error) {
    console.log('❌ Error checking Service Worker:', error);
    return false;
  }
}

// Test 3: Check if Manifest is loaded
async function testManifest() {
  console.log('\n3. Testing Web App Manifest:');
  try {
    const response = await fetch('/manifest.json');
    if (response.ok) {
      const manifest = await response.json();
      console.log('✅ Manifest loaded successfully');
      console.log('   Name:', manifest.name);
      console.log('   Short Name:', manifest.short_name);
      console.log('   Display Mode:', manifest.display);
      console.log('   Icons:', manifest.icons.length, 'icons defined');
      return true;
    } else {
      console.log('❌ Manifest not found or invalid');
      return false;
    }
  } catch (error) {
    console.log('❌ Error loading manifest:', error);
    return false;
  }
}

// Test 4: Check if app is installable
function testInstallability() {
  console.log('\n4. Testing Installability:');
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const isInStandaloneMode = ('standalone' in window.navigator) && window.navigator.standalone;
  
  if (isStandalone || (isIOS && isInStandaloneMode)) {
    console.log('✅ App is already installed/running in standalone mode');
  } else {
    console.log('ℹ️  App is not installed (this is normal for first visit)');
  }
  
  // Check PWA criteria
  const hasManifest = document.querySelector('link[rel="manifest"]') !== null;
  const hasServiceWorker = 'serviceWorker' in navigator;
  const isHTTPS = location.protocol === 'https:' || location.hostname === 'localhost';
  
  console.log('   Has Manifest:', hasManifest ? '✅' : '❌');
  console.log('   Has Service Worker:', hasServiceWorker ? '✅' : '❌');
  console.log('   HTTPS/Localhost:', isHTTPS ? '✅' : '❌');
  
  return hasManifest && hasServiceWorker && isHTTPS;
}

// Test 5: Check offline functionality
async function testOfflineFunctionality() {
  console.log('\n5. Testing Offline Functionality:');
  
  // Check if we're online
  const isOnline = navigator.onLine;
  console.log('   Online Status:', isOnline ? '🟢 Online' : '🔴 Offline');
  
  // Test cache
  if ('caches' in window) {
    try {
      const cacheNames = await caches.keys();
      console.log('   Available Caches:', cacheNames.length);
      cacheNames.forEach(name => console.log('     -', name));
      
      // Check if our cache exists
      const ourCache = cacheNames.find(name => name.includes('shalvi-ecommerce'));
      if (ourCache) {
        console.log('✅ PWA cache found:', ourCache);
        return true;
      } else {
        console.log('❌ PWA cache not found');
        return false;
      }
    } catch (error) {
      console.log('❌ Error checking caches:', error);
      return false;
    }
  } else {
    console.log('❌ Cache API not supported');
    return false;
  }
}

// Test 6: Check PWA components
function testPWAComponents() {
  console.log('\n6. Testing PWA Components:');
  
  // Check if PWA components are rendered
  const installPrompt = document.querySelector('[data-testid="pwa-install-prompt"]') || 
                       document.querySelector('.fixed.bottom-4');
  const statusIndicator = document.querySelector('.fixed.top-4.right-4');
  
  console.log('   Install Prompt:', installPrompt ? '✅' : '❌');
  console.log('   Status Indicator:', statusIndicator ? '✅' : '❌');
  
  return installPrompt || statusIndicator;
}

// Run all tests
async function runAllTests() {
  console.log('🚀 Starting PWA Tests...\n');
  
  const results = {
    serviceWorkerSupport: testServiceWorkerSupport(),
    serviceWorkerRegistration: await testServiceWorkerRegistration(),
    manifest: await testManifest(),
    installability: testInstallability(),
    offlineFunctionality: await testOfflineFunctionality(),
    pwaComponents: testPWAComponents()
  };
  
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}`);
  });
  
  console.log(`\n🎯 Score: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All PWA tests passed! Your app is PWA-ready!');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
  }
  
  return results;
}

// Auto-run tests
runAllTests();

// Export for manual testing
window.testPWA = runAllTests;
