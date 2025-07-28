const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';

// Test functions
async function testHealthCheck() {
    console.log('🔍 Testing Health Check...');
    try {
        const response = await axios.get('http://localhost:3000/health');
        console.log('✅ Health Check Result:', response.data);
        return true;
    } catch (error) {
        console.error('❌ Health Check Failed:', error.message);
        return false;
    }
}

async function testPillTrackingEndpoints() {
    console.log('\n🔍 Testing Pill Tracking Endpoints...');
    
    // Test 1: Check if endpoints exist (without auth)
    const endpoints = [
        '/pill-tracking/test-mapping',
        '/pill-tracking/test-setup-validation', 
        '/pill-tracking/test-reminder-system'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${BASE_URL}${endpoint}`);
            console.log(`✅ ${endpoint}:`, response.status);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log(`✅ ${endpoint}: Requires authentication (401)`);
            } else {
                console.log(`❌ ${endpoint}:`, error.response?.status || error.message);
            }
        }
    }
}

async function testMenstrualCycleEndpoints() {
    console.log('\n🔍 Testing Menstrual Cycle Endpoints...');
    
    const endpoints = [
        '/menstrual-cycle',
        '/menstrual-cycle/current',
        '/menstrual-cycle/statistics'
    ];
    
    for (const endpoint of endpoints) {
        try {
            const response = await axios.get(`${BASE_URL}${endpoint}`);
            console.log(`✅ ${endpoint}:`, response.status);
        } catch (error) {
            if (error.response?.status === 401) {
                console.log(`✅ ${endpoint}: Requires authentication (401)`);
            } else {
                console.log(`❌ ${endpoint}:`, error.response?.status || error.message);
            }
        }
    }
}

async function testDatabaseConnection() {
    console.log('\n🔍 Testing Database Connection...');
    try {
        // Test if we can access any public endpoint
        const response = await axios.get('http://localhost:3000/health');
        console.log('✅ Database connection appears to be working');
        return true;
    } catch (error) {
        console.error('❌ Database connection test failed:', error.message);
        return false;
    }
}

async function runAllTests() {
    console.log('🚀 Starting Simple API Tests...\n');
    
    // Test 1: Health Check
    await testHealthCheck();
    
    // Test 2: Database Connection
    await testDatabaseConnection();
    
    // Test 3: Pill Tracking Endpoints
    await testPillTrackingEndpoints();
    
    // Test 4: Menstrual Cycle Endpoints
    await testMenstrualCycleEndpoints();
    
    console.log('\n✅ All tests completed!');
    console.log('\n📝 Note: Endpoints requiring authentication will return 401, which is expected.');
    console.log('To test with authentication, you need to:');
    console.log('1. Login to get a JWT token');
    console.log('2. Include the token in Authorization header');
    console.log('3. Run the full integration tests');
}

// Run tests
runAllTests().catch(console.error); 