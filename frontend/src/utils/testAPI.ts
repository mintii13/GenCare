const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export interface APITestResult {
    endpoint: string;
    success: boolean;
    status?: number;
    data?: any;
    error?: string;
}

export const testBlogAPI = async (): Promise<APITestResult> => {
    try {
        console.log('🧪 Testing Blog API endpoint:', `${API_URL}/blogs`);
        
        const response = await fetch(`${API_URL}/blogs`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        console.log('📊 Blog API Response:', {
            status: response.status,
            success: data.success,
            blogCount: data.data?.blogs?.length || 0
        });
        
        return {
            endpoint: '/blogs',
            success: response.ok && data.success,
            status: response.status,
            data: data
        };
    } catch (error) {
        console.error('❌ Blog API Error:', error);
        return {
            endpoint: '/blogs',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const testAuthAPI = async (): Promise<APITestResult> => {
    try {
        console.log('🔐 Testing Auth API endpoint:', `${API_URL}/auth/profile`);
        
        const response = await fetch(`${API_URL}/auth/profile`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        const data = await response.json();
        
        console.log('📊 Auth API Response:', {
            status: response.status,
            data: data
        });
        
        return {
            endpoint: '/auth/profile',
            success: response.status === 401 || response.ok, // 401 is expected for unauthorized access
            status: response.status,
            data: data
        };
    } catch (error) {
        console.error('❌ Auth API Error:', error);
        return {
            endpoint: '/auth/profile',
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
};

export const runAllAPITests = async (): Promise<APITestResult[]> => {
    console.log('🚀 Starting Frontend-Backend API Connection Tests...\n');
    
    const results: APITestResult[] = [];
    
    // Test Blog API
    const blogResult = await testBlogAPI();
    results.push(blogResult);
    
    // Test Auth API
    const authResult = await testAuthAPI();
    results.push(authResult);
    
    // Log summary
    console.log('\n📊 API Test Summary:');
    results.forEach(result => {
        const status = result.success ? '✅ PASSED' : '❌ FAILED';
        console.log(`   ${result.endpoint}: ${status} (Status: ${result.status || 'Error'})`);
    });
    
    const allPassed = results.every(r => r.success);
    
    if (allPassed) {
        console.log('\n🎉 All API connections are working!');
        console.log('Frontend can successfully connect to Backend.');
    } else {
        console.log('\n⚠️  Some API connections failed.');
        console.log('Please check if Backend server is running on http://localhost:3000');
    }
    
    return results;
}; 