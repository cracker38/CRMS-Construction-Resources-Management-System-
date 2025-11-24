require('dotenv').config();

console.log('Environment Variables Check:');
console.log('===========================');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✓ Set (' + process.env.JWT_SECRET.substring(0, 20) + '...)' : '✗ Missing');
console.log('JWT_REFRESH_SECRET:', process.env.JWT_REFRESH_SECRET ? '✓ Set (' + process.env.JWT_REFRESH_SECRET.substring(0, 20) + '...)' : '✗ Missing');
console.log('DB_NAME:', process.env.DB_NAME || '✗ Not set');
console.log('DB_HOST:', process.env.DB_HOST || '✗ Not set');
console.log('PORT:', process.env.PORT || '✗ Not set');
console.log('\n✅ All required variables are set!');




