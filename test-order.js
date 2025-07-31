const axios = require('axios');

const orderId = '688836e17f971c7ccdfcc9b6';
const baseURL = 'http://localhost:3000/api';

async function testOrderAPI() {
  try {
    console.log('🔍 Testing order ID:', orderId);
    
    // Test GET_ORDER endpoint
    console.log('\n📡 Testing GET_ORDER endpoint...');
    const orderResponse = await axios.get(`${baseURL}/sti/getStiOrder/${orderId}`);
    console.log(' Order response:', orderResponse.data);
    
    // Test GET_TESTS_FROM_ORDER endpoint
    console.log('\n📡 Testing GET_TESTS_FROM_ORDER endpoint...');
    const testsResponse = await axios.get(`${baseURL}/sti/sti-test/${orderId}`);
    console.log(' Tests response:', testsResponse.data);
    
    // Test GET_STI_RESULT endpoint
    console.log('\n📡 Testing GET_STI_RESULT endpoint...');
    const resultResponse = await axios.get(`${baseURL}/sti/sti-result/${orderId}`);
    console.log(' Result response:', resultResponse.data);
    
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    console.error('Status:', error.response?.status);
  }
}

testOrderAPI(); 