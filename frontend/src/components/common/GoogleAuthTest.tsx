import React, { useState } from 'react';
import { testBlogAPI, testAuthAPI } from '../../utils/testAPI';
import { config } from '../../config/constants';

const GoogleAuthTest: React.FC = () => {
  const [backendStatus, setBackendStatus] = useState<string>('');
  const [authStatus, setAuthStatus] = useState<string>('');
  const [loading, setLoading] = useState<{ [key: string]: boolean }>({});

  const handleTestBackend = async () => {
    setLoading({ ...loading, backend: true });
    try {
      const result = await testBlogAPI();
      setBackendStatus(result.success ? 
        `✅ Backend OK - Status: ${result.status}` : 
        `❌ Backend Error: ${result.error || 'Unknown error'}`
      );
    } catch (error) {
      setBackendStatus(`❌ Backend Error: ${error}`);
    }
    setLoading({ ...loading, backend: false });
  };

  const handleTestAuth = async () => {
    setLoading({ ...loading, auth: true });
    try {
      const result = await testAuthAPI();
      setAuthStatus(result.success ? 
        `✅ Auth OK - Status: ${result.status}` : 
        `❌ Auth Error: ${result.error || 'Unknown error'}`
      );
    } catch (error) {
      setAuthStatus(`❌ Auth Error: ${error}`);
    }
    setLoading({ ...loading, auth: false });
  };

  const handleGoogleLogin = () => {
    console.log('🚀 Redirecting to Google OAuth...');
    window.location.href = 'http://localhost:3000/api/auth/google/verify';
  };

  const clearLocalStorage = () => {
    localStorage.clear();
    console.log('🧹 LocalStorage cleared');
    alert('LocalStorage đã được xóa');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md p-6">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            🔐 Google OAuth Test
          </h1>
          <p className="text-gray-600">
            Debug tool cho Google Authentication
          </p>
        </div>

        <div className="space-y-4">
          {/* Test Backend Connection */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">1. Test Backend Connection</h3>
            <button
              onClick={handleTestBackend}
              disabled={loading.backend}
              className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600 disabled:opacity-50"
            >
              {loading.backend ? 'Testing...' : 'Test Backend'}
            </button>
            {backendStatus && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                {backendStatus}
              </div>
            )}
          </div>

          {/* Test Auth Endpoint */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">2. Test Auth Endpoint</h3>
            <button
              onClick={handleTestAuth}
              disabled={loading.auth}
              className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600 disabled:opacity-50"
            >
              {loading.auth ? 'Testing...' : 'Test Auth API'}
            </button>
            {authStatus && (
              <div className="mt-2 p-2 bg-gray-100 rounded text-sm">
                {authStatus}
              </div>
            )}
          </div>

          {/* Google OAuth Test */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">3. Test Google OAuth</h3>
            <button
              onClick={handleGoogleLogin}
              className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600 flex items-center justify-center gap-2"
            >
              <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2">
                <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 32.9 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.3-4z"/>
                <path fill="#34A853" d="M6.3 14.7l7 5.1C15.5 16.1 19.4 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 6.5 29.6 4 24 4c-7.1 0-13.1 3.7-16.7 9.7z"/>
                <path fill="#FBBC05" d="M24 44c5.1 0 9.8-1.7 13.4-4.7l-6.2-5.1C29.2 35.7 26.7 36.5 24 36.5c-6.1 0-10.7-3.1-12.7-7.6l-7 5.4C7 41.1 14.9 44 24 44z"/>
                <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.1 3.1-4.2 5.5-7.7 5.5-4.6 0-8.4-3.8-8.4-8.5s3.8-8.5 8.4-8.5c2.3 0 4.3.8 5.8 2.1l6.4-6.4C34.5 6.5 29.6 4 24 4c-7.1 0-13.1 3.7-16.7 9.7z"/>
              </svg>
              Đăng nhập với Google
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Sẽ redirect đến Google OAuth flow
            </p>
          </div>

          {/* Utility Actions */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">4. Utilities</h3>
            <button
              onClick={clearLocalStorage}
              className="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600"
            >
              Clear LocalStorage
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Xóa tất cả tokens và data đã lưu
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <a 
            href="/" 
            className="text-blue-500 hover:underline"
          >
            ← Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuthTest; 