// Test environment variable loading
console.log('Environment Variables Test');
console.log('========================');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('REACT_APP_API_URL:', process.env.REACT_APP_API_URL);
console.log('All env vars with REACT_APP:');
Object.keys(process.env).filter(key => key.startsWith('REACT_APP')).forEach(key => {
  console.log(`${key}: ${process.env[key]}`);
});
