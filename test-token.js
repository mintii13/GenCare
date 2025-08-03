const axios = require('axios');

// Test token và role
async function testToken() {
  try {
    // Lấy token từ localStorage (cần copy từ browser)
    const token = 'YOUR_TOKEN_HERE'; // Thay bằng token thực tế
    
    console.log('Testing token:', token);
    
    // Test endpoint /api/sti/orders
    const response = await axios.get('http://localhost:3000/api/sti/orders?page=1&limit=10', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response data:', response.data);
    
  } catch (error) {
    console.error('Error:', error.response?.status, error.response?.data);
  }
}

testToken(); 