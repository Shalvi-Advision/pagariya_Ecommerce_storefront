#!/usr/bin/env node

/**
 * Clear PWA Cache Script
 * This script helps clear the service worker cache during development
 */

const fs = require('fs');
const path = require('path');

console.log('🧹 PWA Cache Clearer');
console.log('==================');

// Check if we're in development
const isDevelopment = process.env.NODE_ENV === 'development' || 
                     process.argv.includes('--dev') ||
                     process.argv.includes('--development');

if (!isDevelopment) {
  console.log('⚠️  This script is intended for development use only.');
  console.log('   Use --dev flag to force run in production.');
  process.exit(1);
}

console.log('📱 Clearing PWA caches...');

// Instructions for manual cache clearing
console.log('\n📋 Manual Cache Clearing Steps:');
console.log('1. Open Chrome DevTools (F12)');
console.log('2. Go to Application tab');
console.log('3. Click on "Storage" in the left sidebar');
console.log('4. Click "Clear site data"');
console.log('5. Or click on "Service Workers" and "Unregister"');

console.log('\n🔧 Alternative: Use the DevTools component in the app');
console.log('   - Look for the 🔧 button in the bottom-right corner');
console.log('   - Click "Clear Cache" or "Force Update & Reload"');

console.log('\n✅ Cache clearing instructions provided!');
console.log('   The updated service worker will now use Network First strategy in development.');
