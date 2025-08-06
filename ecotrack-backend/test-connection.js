// test-connection.js
require('dotenv').config();
const DatabaseService = require('./services/DatabaseService');

async function runTests() {
  console.log('🧪 Testing database connections...\n');
  
  try {
    // Esperar conexión MongoDB
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Test conexiones
    const connected = await DatabaseService.testConnections();
    
    if (!connected) {
      console.log('❌ Some connections failed');
      return;
    }
    
    console.log('\n🧪 Testing authentication...');
    
    // Test login
    const authResult = await DatabaseService.authenticateUser(
      'admin@ecotrack.com', 
      '123456'
    );
    
    console.log('✅ Authentication successful:');
    console.log('📧 User:', authResult.user.email);
    console.log('👤 Role:', authResult.user.role);
    console.log('🏢 Company:', authResult.user.companyId);
    console.log('🔑 Token generated:', authResult.token.substring(0, 20) + '...');
    
    console.log('\n🧪 Testing MongoDB operations...');
    
    // Test MongoDB query
    const assignments = await DatabaseService.getUserAssignments(authResult.user.id);
    console.log('📋 Assignments found:', assignments.length);
    
    console.log('\n✅ All tests passed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
  
  process.exit(0);
}

runTests();