const axios = require('axios');

// Test staff login
async function testStaffLogin() {
  try {
    console.log('Testing staff login...');
    
    // Test login với staff account
    const loginResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'chinjsu1302052@gmail.com',
      password: 'password' // Mật khẩu mặc định
    });
    
    console.log('Login response status:', loginResponse.status);
    console.log('Login response data:', loginResponse.data);
    
    if (loginResponse.data.success && loginResponse.data.token) {
      const token = loginResponse.data.token;
      console.log('Token received:', token.substring(0, 50) + '...');
      
      // Test endpoint /api/sti/orders với token
      const ordersResponse = await axios.get('http://localhost:3000/api/sti/orders?page=1&limit=10', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log('Orders response status:', ordersResponse.status);
      console.log('Orders response data:', ordersResponse.data);
      
    }
    
  } catch (error) {
    console.error('Error status:', error.response?.status);
    console.error('Error data:', error.response?.data);
    console.error('Error message:', error.message);
    console.error('Full error:', error);
  }
}

testStaffLogin(); 