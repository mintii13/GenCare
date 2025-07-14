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
import { RegisterFormData, validationSchemas } from '../../hooks/useFormValidation';
import { FormField, FormSelect } from '../../components/ui/FormField';
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
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [otpError, setOTPError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // State cho form bước 1
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');

  // Form cho bước 2 (thông tin chi tiết)
  const {
    control,
    handleSubmit,
    getValues,
    setValue,
    trigger,
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
            navigate('/dashboard');
          } else {
            // Nếu auto login thất bại, vẫn thông báo thành công và cho user login thủ công
            toast.success('Xác thực thành công! Vui lòng đăng nhập.');
            navigate('/');
          }
        } catch (loginError) {
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

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setEmailError('Vui lòng nhập email');
      return;
    }

    const emailExists = await checkEmailExists(email);
    if (emailExists) {
      setEmailError('Email này đã được sử dụng');
      toast.error('Email này đã được sử dụng');
    } else {
      setEmailError('');
      toast.success('Email có thể sử dụng');
    }
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
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Xác thực OTP</CardTitle>
            <CardDescription className="text-center">
              Chúng tôi đã gửi mã xác thực đến email {registerEmail}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div>
                <Input
                  type="text"
                  placeholder="Nhập mã OTP"
                  value={otp}
                  onChange={(e) => setOTP(e.target.value)}
                  className="text-center text-2xl tracking-widest"
                  maxLength={6}
                />
                {otpError && (
                  <div className="mt-2">
                    <p className="text-red-500 text-sm">{otpError}</p>
                    {otpError.includes('Server error') || otpError.includes('hệ thống') ? (
                      <p className="text-gray-500 text-xs mt-1">
                        💡 Gợi ý: Hãy thử gửi lại OTP hoặc liên hệ hỗ trợ nếu vấn đề vẫn tiếp tục.
                      </p>
                    ) : (
                      <p className="text-gray-500 text-xs mt-1">
                        💡 Gợi ý: Kiểm tra email (kể cả thư mục spam) và nhập đúng 6 chữ số.
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <Button type="submit" className="w-full">
                Xác thực
              </Button>
              
              <div className="text-center">
                {resendCountdown > 0 ? (
                  <p className="text-gray-500">
                    Gửi lại OTP trong {resendCountdown}s
                  </p>
                ) : (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResendOTP}
                    disabled={resendLoading}
                    className="w-full"
                  >
                    {resendLoading ? 'Đang gửi...' : 'Gửi lại OTP'}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            Đăng ký tài khoản
          </CardTitle>
          <CardDescription className="text-center">
            Bước {step} / 2: {step === 1 ? 'Thông tin đăng nhập' : 'Thông tin cá nhân'}
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {step === 1 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Kiểm tra email</h3>
              <form onSubmit={handleEmailStep} className="space-y-4" autoComplete="off">
                <Input
                  type="email"
                  name="register-email"
                  placeholder="Nhập email của bạn"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={emailError}
                  disabled={isCheckingEmail}
                  autoComplete="new-email"
                />
                {emailError && <div className="text-red-500 text-sm">{emailError}</div>}
                <Button type="submit" className="w-full" disabled={isCheckingEmail}>Tiếp tục</Button>
              </form>
            </div>
          )}
          {step === 2 && !showOTP && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin đăng ký</h3>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
                <Controller
                  name="fullName"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      name="register-fullname"
                      placeholder="Nhập họ và tên" 
                      error={errors.fullName?.message}
                      autoComplete="new-name"
                    />
                  )}
                />
                <Controller
                  name="password"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      type="password" 
                      name="register-password"
                      placeholder="Nhập mật khẩu" 
                      error={errors.password?.message}
                      autoComplete="new-password"
                    />
                  )}
                />
                <Controller
                  name="confirmPassword"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      type="password" 
                      name="register-confirm-password"
                      placeholder="Nhập lại mật khẩu" 
                      error={errors.confirmPassword?.message}
                      autoComplete="new-password"
                    />
                  )}
                />
                <Controller
                  name="phone"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      name="register-phone"
                      placeholder="Nhập số điện thoại" 
                      error={errors.phone?.message}
                      autoComplete="new-tel"
                    />
                  )}
                />
                <Controller
                  name="dateOfBirth"
                  control={control}
                  render={({ field }) => (
                    <Input 
                      {...field} 
                      type="date" 
                      name="register-dob"
                      placeholder="Chọn ngày sinh" 
                      error={errors.dateOfBirth?.message}
                      autoComplete="new-bday"
                    />
                  )}
                />
                <Controller
                  name="gender"
                  control={control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Chọn giới tính" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Nam</SelectItem>
                        <SelectItem value="female">Nữ</SelectItem>
                        <SelectItem value="other">Khác</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                <Button type="submit" className="w-full" disabled={isSubmitting}>Đăng ký</Button>
              </form>
            </div>
          )}
          
          <div className="mt-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Hoặc</span>
              </div>
            </div>
            
            <Button
              type="button"
              variant="outline"
              className="w-full mt-4"
              onClick={handleGoogleSignIn}
            >
              Đăng ký với Google
            </Button>
          </div>
        </CardContent>
        
        <CardFooter className="text-center">
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