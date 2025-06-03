import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoginSuccess?: (user?: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onLoginSuccess }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(
        import.meta.env.VITE_API_URL + '/auth/login',
        form,
        { withCredentials: true }
      );
      if (res.data.success) {
        login(res.data.user);
        if (onLoginSuccess) onLoginSuccess(res.data.user);
        onClose();
      } else {
        setError(res.data.message || 'Đăng nhập thất bại');
      }
    } catch (err: any) {
      setError(err.response?.data?.details || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50">
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="fixed right-4 top-16 w-96 transform transition-all duration-300 ease-in-out">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Đăng nhập</h2>
              <button
                className="text-gray-500 hover:text-gray-700"
                onClick={onClose}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <input
                  type="password"
                  name="password"
                  placeholder="Mật khẩu"
                  value={form.password}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary-600 text-white py-2 rounded-md hover:bg-primary-700 transition-colors"
                disabled={loading}
              >
                {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </button>
            </form>

            {/* Nút Google OAuth */}
            <button
              className="w-full bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg mt-4 flex items-center justify-center"
              onClick={() => window.location.href = 'http://localhost:3000/api/auth/google/verify'}
            >
              <img src="/google-icon.svg" alt="Google" className="w-5 h-5 mr-2" />
              Tiếp tục với Google
            </button>
            
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Chưa có tài khoản?{' '}
                <button
                  onClick={() => {
                    onClose();
                    navigate('/register');
                  }}
                  className="text-primary-600 hover:underline"
                >
                  Đăng ký
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal; 