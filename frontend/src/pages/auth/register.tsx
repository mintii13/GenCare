import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '../../contexts/AuthContext';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import { toast } from 'react-hot-toast';
import LoginModal from '../../components/auth/LoginModal';

const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [otpError, setOTPError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [registerSuccess, setRegisterSuccess] = useState<boolean>(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // State cho form bước 1
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Form cho bước 2 (thông tin chi tiết)
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm({
    resolver: zodResolver(z.object({
      fullName: z.string().min(1, 'Họ tên là bắt buộc').min(2, 'Họ tên phải có ít nhất 2 ký tự'),
      password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
      confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
      phone: z.string().optional(),
      dateOfBirth: z.string().optional(),
      gender: z.enum(['male', 'female', 'other', '']).optional()
    }).refine((data) => data.password === data.confirmPassword, {
      message: "Mật khẩu không khớp",
      path: ["confirmPassword"],
    })),
    defaultValues: {
      fullName: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dateOfBirth: '',
      gender: ''
    },
    mode: 'onChange'
  });

  // Đếm ngược resend OTP
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (showOTP && resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showOTP, resendCountdown]);

  const checkEmailExists = async (email: string) => {
    try {
      setIsCheckingEmail(true);
      const response = await apiClient.post(API.Auth.CHECK_EMAIL, { email });
      return (response.data as any)?.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Bước 1: chỉ nhập email
  const handleEmailStep = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      setEmailError('Vui lòng nhập email');
      return;
    }
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Email không hợp lệ');
      return;
    }
    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      setEmailError('Email này đã được sử dụng');
      toast.error('Email này đã được sử dụng');
    } else {
      setEmailError('');
      setRegisterEmail(email);
      setStep(2);
    }
  };

  // Bước 2: nhập các trường còn lại
  const onSubmit = async (data: any) => {
    if (step === 1) return; // Không cho submit ở bước 1
    try {
      // Register API call - không gửi role vì backend không chấp nhận
      const response = await apiClient.post(API.Auth.REGISTER, {
        email: registerEmail,
        password: data.password,
        confirm_password: data.confirmPassword,
        full_name: data.fullName,
        phone: data.phone,
        date_of_birth: data.dateOfBirth,
        gender: data.gender
      });
      if ((response.data as any)?.success) {
        setShowOTP(true);
        setRegisterPassword(data.password);
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
      } else {
        toast.error((response.data as any)?.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      console.error('Register error:', error);
      const errorMessage = error?.response?.data?.details || 
                          error?.response?.data?.message || 
                          'Đăng ký thất bại';
      toast.error(errorMessage);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOTPError('');
    
    try {
      const response = await apiClient.post(API.Auth.VERIFY_OTP, {
        email: registerEmail,
        otp
      });

      if ((response.data as any)?.success) {
        setRegisterSuccess(true);
        
        // Auto login after successful verification
        try {
          const loginResponse = await apiClient.post(API.Auth.LOGIN, {
            email: registerEmail,
            password: registerPassword
          });
          
          if ((loginResponse.data as any)?.success) {
            login((loginResponse.data as any).user, (loginResponse.data as any).accessToken);
            toast.success('Xác thực thành công! Chào mừng bạn đến với GenCare!');
            navigate('/');
          } else {
            // Nếu auto login thất bại, vẫn thông báo thành công và cho user login thủ công
            toast.success('Xác thực thành công! Vui lòng đăng nhập.');
            navigate('/');
          }
        } catch (_loginError) {
          // Nếu auto login bị lỗi, vẫn thông báo thành công và cho user login thủ công
          toast.success('Xác thực thành công! Vui lòng đăng nhập.');
          navigate('/');
        }
      } else {
        setOTPError((response.data as any)?.message || 'OTP không hợp lệ');
        toast.error((response.data as any)?.message || 'OTP không hợp lệ');
      }
    } catch (error: any) {
      console.error('OTP verification error:', error);
      let errorMessage = 'Xác thực thất bại';
      
      if (error?.response?.data?.details) {
        errorMessage = error.response.data.details;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // Xử lý các loại lỗi cụ thể
      if (errorMessage.includes('save is not a function') || errorMessage.includes('TypeError')) {
        errorMessage = 'Có lỗi hệ thống khi xác thực. Vui lòng thử lại sau hoặc liên hệ hỗ trợ.';
      } else if (errorMessage === 'Server error') {
        errorMessage = 'Có lỗi máy chủ khi xác thực OTP. Vui lòng thử lại sau.';
      } else if (error?.response?.status === 400) {
        // Nếu là lỗi 400 nhưng không có message cụ thể
        if (!error?.response?.data?.message || error?.response?.data?.message === 'Server error') {
          errorMessage = 'Mã OTP không đúng hoặc đã hết hạn. Vui lòng kiểm tra lại.';
        }
      }
      
      setOTPError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API.Auth.GOOGLE_VERIFY}`;
  };

  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      const response = await apiClient.post(API.Auth.RESEND_OTP, {
        email: registerEmail
      });

      if ((response.data as any)?.success) {
        toast.success('OTP đã được gửi lại');
        setResendCountdown(60);
      } else {
        toast.error((response.data as any)?.message || 'Gửi lại OTP thất bại');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.details || 
                          error?.response?.data?.message || 
                          'Gửi lại OTP thất bại';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  // Render OTP verification form
  if (showOTP) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <Card className="w-full max-w-md rounded-2xl shadow-2xl">
          <CardHeader className="text-center p-8">
            <CardTitle className="text-2xl font-bold text-gray-900">Xác thực OTP</CardTitle>
            <CardDescription className="text-gray-600">
              Chúng tôi đã gửi mã xác thực đến email <span className="font-medium text-primary-600">{registerEmail}</span>
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8">
            <form onSubmit={handleVerifyOTP} className="space-y-6">
              <div>
                <Input
                  type="text"
                  placeholder="Nhập mã OTP"
                  value={otp}
                  onChange={(e) => setOTP(e.target.value)}
                  className="text-center text-3xl font-semibold tracking-[0.5em] py-3 rounded-xl bg-gray-50 focus:bg-white"
                  maxLength={6}
                />
                {otpError && (
                  <div className="mt-2 text-center">
                    <p className="text-red-500 text-sm">{otpError}</p>
                    {otpError.includes('Server error') || otpError.includes('hệ thống') ? (
                      <p className="text-gray-500 text-xs mt-1">
                         Gợi ý: Hãy thử gửi lại OTP hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
                      </p>
                    ) : (
                      <p className="text-gray-500 text-xs mt-1">
                         Gợi ý: Kiểm tra email (kể cả thư mục spam) và nhập đúng 6 chữ số.
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50"
                disabled={resendLoading}
              >
                Xác thực
              </Button>
            </form>
          </CardContent>
          <CardFooter className="px-8 pb-8 text-center">
            <div className="text-sm text-gray-600 w-full">
              {resendCountdown > 0 ? (
                `Bạn có thể gửi lại sau ${resendCountdown} giây`
              ) : (
                <button
                  onClick={handleResendOTP}
                  className="font-medium text-blue-600 hover:text-blue-500 underline disabled:text-gray-400"
                  disabled={resendLoading}
                >
                  {resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                </button>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    );
  }
  
  // Đồng bộ UI trang đăng ký với modal đăng nhập
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-lg rounded-2xl shadow-2xl animate-in fade-in-0 zoom-in-95">
        <div className="relative px-8 pt-8 pb-2 text-center">
          <div className="mx-auto w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Tạo tài khoản GenCare</h2>
          <p className="text-gray-600 text-sm">Bắt đầu hành trình chăm sóc sức khỏe của bạn</p>
        </div>

        <CardContent className="px-8 pb-8">
          {step === 1 && (
            <form onSubmit={handleEmailStep} className="space-y-5 mt-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Email</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                    </svg>
                  </div>
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`w-full pl-12 pr-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200 bg-gray-50 focus:bg-white ${emailError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}`}
                  />
                </div>
                {emailError && <p className="text-sm text-red-600">{emailError}</p>}
              </div>
              <Button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-primary-800 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98]" disabled={isCheckingEmail}>
                {isCheckingEmail ? 'Đang kiểm tra...' : 'Tiếp tục'}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 mt-6">
              {/* Fields for step 2 */}
              <Controller name="fullName" control={control} render={({ field }) => <Input placeholder="Họ và tên" {...field} error={errors.fullName?.message} />} />
              <Controller name="password" control={control} render={({ field }) => <Input type="password" placeholder="Mật khẩu" {...field} error={errors.password?.message} />} />
              <Controller name="confirmPassword" control={control} render={({ field }) => <Input type="password" placeholder="Xác nhận mật khẩu" {...field} error={errors.confirmPassword?.message} />} />
              <Controller name="phone" control={control} render={({ field }) => <Input placeholder="Số điện thoại (tùy chọn)" {...field} error={errors.phone?.message} />} />
              <Controller name="dateOfBirth" control={control} render={({ field }) => <Input type="date" placeholder="Ngày sinh (tùy chọn)" {...field} error={errors.dateOfBirth?.message} />} />
              <Controller
                name="gender"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Giới tính (tùy chọn)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Nam</SelectItem>
                      <SelectItem value="female">Nữ</SelectItem>
                      <SelectItem value="other">Khác</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.gender && <p className="text-sm text-red-600">{errors.gender.message}</p>}
              
              <div className="flex items-center gap-4">
                <Button type="button" variant="outline" onClick={() => setStep(1)} className="w-full">
                  Quay lại
                </Button>
                <Button type="submit" className="w-full bg-gradient-to-r from-primary-600 to-primary-700 text-white font-semibold" disabled={isSubmitting}>
                  {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                </Button>
              </div>
            </form>
          )}
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>
            
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-3 mt-4 bg-white border-2 border-gray-200 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 hover:bg-gray-50 hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 transform hover:scale-[1.02] active:scale-[0.98]"
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
          </div>
        </CardContent>
        
        <CardFooter className="text-center justify-center bg-gray-50 p-4 border-t rounded-b-2xl">
          <p className="text-sm text-gray-600">
            Đã có tài khoản?{' '}
            <button 
              onClick={() => setShowLoginModal(true)}
              className="font-medium text-blue-600 hover:text-blue-500 underline"
            >
              Đăng nhập ngay
            </button>
          </p>
        </CardFooter>
      </Card>
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
    </div>
  );
};

export default Register;