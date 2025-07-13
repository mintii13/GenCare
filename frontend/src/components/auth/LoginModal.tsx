import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { navigateAfterLogin } from '../../utils/navigationUtils';
import { FormField } from '../ui/FormField';
import { LoginFormData, validationSchemas } from '../../hooks/useFormValidation';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import { toast } from 'react-hot-toast';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOTP, setForgotOTP] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset
  } = useForm<LoginFormData>({
    resolver: zodResolver(validationSchemas.loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  if (!isOpen) return null;

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await apiClient.post(API.Auth.LOGIN, data);
      const responseData = response.data as any;
      
      if (responseData.success) {
        login(responseData.user, responseData.accessToken);
        toast.success('Đăng nhập thành công!');
        
        if (onSuccess) {
          onSuccess(responseData.user);
        } else {
          // Nếu không có callback success, tự động redirect đến dashboard
          navigateAfterLogin(responseData.user, navigate);
        }
        
        // Reset form and close modal
        reset();
        onClose();
      } else {
        toast.error(responseData.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.response?.data?.details || 
                          error?.response?.data?.message || 
                          'Đăng nhập thất bại';
      toast.error(errorMessage);
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL ?? 'http://localhost:3000/api'}${API.Auth.GOOGLE_VERIFY}`;
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  // Forgot password handlers
  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await apiClient.post(API.Auth.FORGOT_PASSWORD_REQUEST, { email: forgotEmail });
      const data = res.data as { success: boolean; message?: string };
      if (data.success) {
        toast.success('Đã gửi OTP về email!');
        setForgotStep(2);
      } else {
        toast.error(data.message || 'Không gửi được OTP');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Không gửi được OTP');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await apiClient.post(API.Auth.FORGOT_PASSWORD_VERIFY, { email: forgotEmail, otp: forgotOTP });
      const data = res.data as { success: boolean; message?: string };
      if (data.success) {
        toast.success('Xác thực OTP thành công!');
        setForgotStep(3);
      } else {
        toast.error(data.message || 'OTP không đúng');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'OTP không đúng');
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      const res = await apiClient.post(API.Auth.FORGOT_PASSWORD_RESET, { email: forgotEmail, new_password: forgotNewPassword });
      const data = res.data as { success: boolean; message?: string };
      if (data.success) {
        toast.success('Đặt lại mật khẩu thành công!');
        setShowForgot(false);
        setForgotStep(1);
        setForgotEmail('');
        setForgotOTP('');
        setForgotNewPassword('');
      } else {
        toast.error(data.message || 'Đặt lại mật khẩu thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đặt lại mật khẩu thất bại');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop với blur effect */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={handleClose}
      />
      
      {/* Modal Container - Centered */}
      <div className="relative bg-white w-full max-w-md mx-auto rounded-2xl shadow-2xl transform transition-all duration-300 scale-100 animate-in fade-in-0 zoom-in-95">
        {/* Header */}
        <div className="relative px-8 pt-8 pb-2">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors duration-200"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <div className="text-center">
            <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Chào mừng trở lại!</h2>
            <p className="text-gray-600 text-sm">Đăng nhập vào tài khoản GenCare của bạn</p>
          </div>
        </div>
        
        {/* Body */}
        <div className="px-8 pb-8">
          {!showForgot ? (
            <>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Email Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Email</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <FormField
                      name="email"
                      control={control}
                      type="email"
                      placeholder="your@email.com"
                      error={errors.email?.message}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Mật khẩu</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <FormField
                      name="password"
                      control={control}
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      error={errors.password?.message}
                      className="w-full pl-12 pr-12 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200 bg-gray-50 focus:bg-white"
                    />
                    <button
                      type="button"
                      onClick={togglePasswordVisibility}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 px-4 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center space-x-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Đang đăng nhập...</span>
                    </div>
                  ) : (
                    'Đăng nhập'
                  )}
                </button>
              </form>
              {/* Forgot password link */}
              <div className="mt-4 text-center">
                <button type="button" className="text-primary-600 hover:underline text-sm" onClick={() => setShowForgot(true)}>
                  Quên mật khẩu?
                </button>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {forgotStep === 1 && (
                <form onSubmit={handleForgotEmail} className="space-y-4">
                  <input
                    type="email"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nhập email của bạn"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    required
                  />
                  <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded" disabled={forgotLoading}>
                    {forgotLoading ? 'Đang gửi...' : 'Gửi OTP'}
                  </button>
                </form>
              )}
              {forgotStep === 2 && (
                <form onSubmit={handleForgotVerify} className="space-y-4">
                  <input
                    type="text"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nhập mã OTP"
                    value={forgotOTP}
                    onChange={e => setForgotOTP(e.target.value)}
                    required
                  />
                  <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded" disabled={forgotLoading}>
                    {forgotLoading ? 'Đang xác thực...' : 'Xác thực OTP'}
                  </button>
                </form>
              )}
              {forgotStep === 3 && (
                <form onSubmit={handleForgotReset} className="space-y-4">
                  <input
                    type="password"
                    className="w-full border rounded px-3 py-2"
                    placeholder="Nhập mật khẩu mới"
                    value={forgotNewPassword}
                    onChange={e => setForgotNewPassword(e.target.value)}
                    required
                  />
                  <button type="submit" className="w-full bg-primary-600 text-white py-2 rounded" disabled={forgotLoading}>
                    {forgotLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
                  </button>
                </form>
              )}
              <div className="text-center mt-2">
                <button type="button" className="text-gray-500 hover:underline text-xs" onClick={() => { setShowForgot(false); setForgotStep(1); }}>
                  Quay lại đăng nhập
                </button>
              </div>
            </div>
          )}

          {/* Divider */}
          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500 font-medium">Hoặc</span>
            </div>
          </div>

          {/* Google Login Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transform hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg width="20" height="20" viewBox="0 0 48 48" className="flex-shrink-0">
              <g>
                <path fill="#4285F4" d="M44.5 20H24v8.5h11.7C34.7 32.9 30.1 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 6.5 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.3-4z"/>
                <path fill="#34A853" d="M6.3 14.7l7 5.1C15.5 16.1 19.4 13 24 13c3.1 0 5.9 1.1 8.1 2.9l6.4-6.4C34.5 6.5 29.6 4 24 4c-7.1 0-13.1 3.7-16.7 9.7z"/>
                <path fill="#FBBC05" d="M24 44c5.1 0 9.8-1.7 13.4-4.7l-6.2-5.1C29.2 35.7 26.7 36.5 24 36.5c-6.1 0-10.7-3.1-12.7-7.6l-7 5.4C7 41.1 14.9 44 24 44z"/>
                <path fill="#EA4335" d="M44.5 20H24v8.5h11.7c-1.1 3.1-4.2 5.5-7.7 5.5-4.6 0-8.4-3.8-8.4-8.5s3.8-8.5 8.4-8.5c2.3 0 4.3.8 5.8 2.1l6.4-6.4C34.5 6.5 29.6 4 24 4c-7.1 0-13.1 3.7-16.7 9.7z"/>
              </g>
            </svg>
            <span>Tiếp tục với Google</span>
          </button>
          
          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Chưa có tài khoản?{' '}
              <button
                type="button"
                onClick={() => {
                  handleClose();
                  navigate('/register');
                }}
                className="text-primary-600 hover:text-primary-700 font-semibold hover:underline transition-colors duration-200"
                disabled={isSubmitting}
              >
                Đăng ký ngay
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;