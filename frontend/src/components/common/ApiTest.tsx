import React, { useState } from 'react';
import { userService, appointmentService, consultantService } from '../../services';
import { Spinner } from '../ui';
import LoginTest from '../auth/LoginTest';

const ApiTest: React.FC = () => {
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async (name: string, apiCall: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await apiCall();
      setResult({
        endpoint: name,
        success: true,
        data: response
      });
    } catch (err: any) {
      setError(`${name}: ${err.response?.data?.message || err.message}`);
      setResult({
        endpoint: name,
        success: false,
        error: err.response?.data || err.message
      });
    } finally {
      setLoading(false);
    }
  };

  const testProfile = () => testEndpoint('GET /profile/getUserProfile', () => userService.getProfile());
  const testConsultants = () => testEndpoint('GET /consultants', () => consultantService.getAllConsultants());
  const testAppointments = () => testEndpoint('GET /appointments/my-appointments', () => appointmentService.getMyAppointments());

  return (
    <div className="space-y-6 max-w-2xl mx-auto mt-8">
      <LoginTest />
      
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">🔧 API Connection Test</h2>
      
      <div className="space-y-3">
        <button
          onClick={testProfile}
          disabled={loading}
          className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Test Profile API
        </button>
        
        <button
          onClick={testConsultants}
          disabled={loading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Test Consultants API
        </button>
        
        <button
          onClick={testAppointments}
          disabled={loading}
          className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 flex items-center justify-center"
        >
          {loading ? <Spinner size="sm" className="mr-2" /> : null}
          Test Appointments API
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          <h3 className="font-bold">❌ Error:</h3>
          <p>{error}</p>
        </div>
      )}

      {result && (
        <div className="mt-4 p-3 bg-gray-100 border rounded">
          <h3 className="font-bold">📋 Result:</h3>
          <pre className="mt-2 text-sm overflow-auto">
            {JSON.stringify(result, null, 2)}
          </pre>
        </div>
      )}
      </div>
    </div>
  );
};

export default ApiTest; 