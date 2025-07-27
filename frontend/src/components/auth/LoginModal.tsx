import React, { useState, useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, X, Mail, Lock, User, Phone, Calendar, ArrowLeft, ArrowRight } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authService } from '../../services/auth';
import { API } from '../../config/apiEndpoints';
import apiClient from '../../services/apiClient';
import toast from 'react-hot-toast';
import { Button, Input } from '../design-system';

// Validation schemas
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const loginSchema = z.object({
  email: z.string().trim().regex(emailRegex, { message: 'Email không hợp lệ' }),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
});

// Schema cho Step 1: Email và Password
const step1Schema = z.object({
  email: z.string().trim().regex(emailRegex, { message: 'Email không hợp lệ' }),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

// Schema cho Step 2: Thông tin cá nhân
const step2Schema = z.object({
  fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional()
});

const registerSchema = z.object({
  email: z.string().trim().regex(emailRegex, { message: 'Email không hợp lệ' }),
  fullName: z.string().trim().min(2, 'Họ tên phải có ít nhất 2 ký tự'),
  password: z.string().min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  confirmPassword: z.string().min(1, 'Xác nhận mật khẩu là bắt buộc'),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', '']).optional()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ["confirmPassword"],
});

type LoginFormData = z.infer<typeof loginSchema>;
type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;
type RegisterFormData = z.infer<typeof registerSchema>;

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register';
}

type ModalState = 'login' | 'register';
type RegisterStep = 1 | 2 | 3; // Step 1: Email check, Step 2: Register info, Step 3: OTP

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [modalState, setModalState] = useState<ModalState>(initialMode);
  const [registerStep, setRegisterStep] = useState<RegisterStep>(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Register-specific states (improved from register page)
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [emailError, setEmailError] = useState('');
  const [otp, setOTP] = useState('');
  const [otpError, setOTPError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  
  const { login } = useAuth();

  // Form instances
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const step1Form = useForm<Step1FormData>({
    resolver: zodResolver(step1Schema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: ''
    },
    mode: 'onChange',
    reValidateMode: 'onChange'
  });

  const registerForm = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: '',
      fullName: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dateOfBirth: '',
      gender: ''
    },
    mode: 'onChange',
    reValidateMode: 'onChange'
  });

  // Reset forms when modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setModalState(initialMode);
      setRegisterStep(1);
      setRegisterEmail('');
      setRegisterPassword('');
      setEmailError('');
      setOTP('');
      setOTPError('');
      setResendCountdown(60);
      loginForm.reset();
      step1Form.reset();
      registerForm.reset({
        email: '',
        fullName: '',
        password: '',
        confirmPassword: '',
        phone: '',
        dateOfBirth: '',
        gender: ''
      });
    }
  }, [isOpen, initialMode]);

  // Countdown timer for OTP resend
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (registerStep === 3 && resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [registerStep, resendCountdown]);
  
  // Handle closing modal on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  // Handle login
  const handleLogin = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const response = await authService.login(data.email, data.password);
      login(response.data.user, response.data.accessToken);
      
      // Thông báo thành công dựa trên role
      if (response.data.user.role === 'customer') {
        toast.success(`Chào mừng ${response.data.user.full_name || response.data.user.email}! `);
      } else {
        toast.success('Đăng nhập thành công! Đang chuyển hướng...');
      }
      
        onClose();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Đăng nhập thất bại');
    } finally {
      setLoading(false);
    }
  };

  // Handle Google login
  const handleGoogleLogin = () => {
    window.location.href = `${import.meta.env.VITE_API_URL}${API.Auth.GOOGLE_VERIFY}`;
  };

  // Check email exists (Step 1) - Improved from register page
  const checkEmailExists = async (email: string) => {
    try {
      setIsCheckingEmail(true);
      const response = await apiClient.post(API.Auth.CHECK_EMAIL, { email });
      return (response.data as any)?.exists;
    } catch (error) {
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleEmailPasswordStep = async (data: Step1FormData) => {
    // Check if email exists
    const emailExists = await checkEmailExists(data.email);
    if (emailExists) {
      setEmailError('Email này đã được sử dụng');
      toast.error('Email này đã được sử dụng');
    } else {
      setEmailError('');
      setRegisterEmail(data.email);
      setRegisterPassword(data.password);
      // Copy data to registerForm for Step 2
      registerForm.setValue('email', data.email);
      registerForm.setValue('password', data.password);
      registerForm.setValue('confirmPassword', data.confirmPassword);
      setRegisterStep(2);
    }
  };

  // Handle registration (Step 2) - Improved from register page
  const handleRegister = async (data: RegisterFormData) => {
    setLoading(true);
    try {
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
        setRegisterPassword(data.password);
        setRegisterStep(3);
        setResendCountdown(60);
        toast.success('Đăng ký thành công! Vui lòng kiểm tra email để xác thực.');
      } else {
        toast.error((response.data as any)?.message || 'Đăng ký thất bại');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.details || error?.response?.data?.message || 'Đăng ký thất bại';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle OTP verification (Step 3) - Improved from register page
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOTPError('');
    setLoading(true);
    try {
      const response = await apiClient.post(API.Auth.VERIFY_OTP, {
        email: registerEmail,
        otp
      });
      if ((response.data as any)?.success) {
        try {
          const loginResponse = await apiClient.post(API.Auth.LOGIN, {
            email: registerEmail,
            password: registerPassword
          });
          if ((loginResponse.data as any)?.success) {
            const user = (loginResponse.data as any).user;
            login(user, (loginResponse.data as any).accessToken);
            
            // Thông báo thành công dựa trên role
            if (user.role === 'customer') {
              toast.success(`Chào mừng ${user.full_name || user.email} đến với GenCare! `);
            } else {
              toast.success('Xác thực thành công! Đang chuyển hướng...');
            }
            
            onClose();
          } else {
            toast.success('Xác thực thành công! Vui lòng đăng nhập.');
            setModalState('login');
            setRegisterStep(1);
          }
        } catch (_loginError) {
          toast.success('Xác thực thành công! Vui lòng đăng nhập.');
          setModalState('login');
          setRegisterStep(1);
        }
      } else {
        setOTPError((response.data as any)?.message || 'OTP không hợp lệ');
        toast.error((response.data as any)?.message || 'OTP không hợp lệ');
      }
    } catch (error: any) {
      let errorMessage = 'Xác thực thất bại';
      if (error?.response?.data?.details) errorMessage = error.response.data.details;
      else if (error?.response?.data?.message) errorMessage = error.response.data.message;
      else if (error?.message) errorMessage = error.message;
      setOTPError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Handle resend OTP - Improved from register page
  const handleResendOTP = async () => {
    try {
      setResendLoading(true);
      const response = await apiClient.post(API.Auth.RESEND_OTP, { email: registerEmail });
      if ((response.data as any)?.success) {
        toast.success('OTP đã được gửi lại');
        setResendCountdown(60);
      } else {
        toast.error((response.data as any)?.message || 'Gửi lại OTP thất bại');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.details || error?.response?.data?.message || 'Gửi lại OTP thất bại';
      toast.error(errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  // Handle state transitions
  const switchToRegister = () => {
    setModalState('register');
    setRegisterStep(1);
  };

  const switchToLogin = () => {
    setModalState('login');
    setRegisterStep(1);
  };

  const goBackStep = () => {
    if (registerStep > 1) {
      setRegisterStep((prev) => (prev - 1) as RegisterStep);
      // Clear form errors when going back
      step1Form.clearErrors();
      registerForm.clearErrors();
      setEmailError('');
    }
  };

  if (!isOpen) return null;

  // Content based on state
  const getContent = () => {
    if (modalState === 'login') {
      return {
        title: 'Chào mừng trở lại!',
        subtitle: 'Đăng nhập để tiếp tục sử dụng các dịch vụ chăm sóc sức khỏe của GenCare',
        description: 'Theo dõi chu kỳ kinh nguyệt, đặt lịch tư vấn và nhiều tính năng hữu ích khác đang chờ bạn.'
      };
    } else {
      return {
        title: 'Tham gia GenCare',
        subtitle: 'Đăng ký để sử dụng các dịch vụ của chúng tôi',
        description: 'Tạo tài khoản để trải nghiệm đầy đủ các dịch vụ chăm sóc sức khỏe phụ nữ hiện đại và chuyên nghiệp.'
      };
    }
  };

  const content = getContent();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div ref={modalRef} className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex min-h-[600px] relative">
          {/* Login Form - Fixed Left */}
          <div className={`w-1/2 p-12 flex flex-col justify-center bg-white transition-opacity duration-800 ${
            modalState === 'login' ? 'opacity-100 z-10' : 'opacity-30 z-0'
          }`}>
            <div className="max-w-sm mx-auto w-full">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-blue-600 mb-2">Đăng nhập</h3>
                <p className="text-gray-600">Nhập thông tin để truy cập tài khoản</p>
              </div>

              <form onSubmit={loginForm.handleSubmit((data) => handleLogin({
                email: data.email.trim(),
                password: data.password.trim(),
              }))} className="space-y-6">
                {/* Email field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...loginForm.register('email')}
                    type="email"
                    name="email"
                    autoComplete="username"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    placeholder="Email"
                    disabled={modalState !== 'login'}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                  />
                  {loginForm.formState.errors.email && (
                    <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.email.message}</p>
                  )}
                </div>

                {/* Password field */}
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    {...loginForm.register('password')}
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    autoCorrect="off"
                    autoCapitalize="off"
                    spellCheck="false"
                    placeholder="Mật khẩu"
                    disabled={modalState !== 'login'}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={modalState !== 'login'}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                  {loginForm.formState.errors.password && (
                    <p className="mt-1 text-sm text-red-600">{loginForm.formState.errors.password.message}</p>
                  )}
                </div>

                {/* Login button */}
          <Button
                  type="submit"
                  disabled={loading || modalState !== 'login'}
                  className="w-full"
                  loading={loading}
          >
                  Đăng nhập
          </Button>
          
                {/* Divider */}
                <div className="flex items-center my-6">
                  <hr className="flex-1 border-gray-300" />
                  <span className="px-4 text-gray-400 text-sm">HOẶC</span>
                  <hr className="flex-1 border-gray-300" />
                </div>

                {/* Google Login Button */}
                <button
                  type="button"
                  onClick={handleGoogleLogin}
                  disabled={modalState !== 'login'}
                  className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50"
                >
                  <img 
                    src="https://www.svgrepo.com/show/475656/google-color.svg" 
                    className="w-5 h-5" 
                    alt="Google" 
                  />
                  Đăng nhập với Google
                </button>
              </form>
            </div>
          </div>

          {/* Register Form - Fixed Right */}
          <div className={`w-1/2 p-12 flex flex-col justify-center bg-white transition-opacity duration-800 ${
            modalState === 'register' ? 'opacity-100 z-10' : 'opacity-30 z-0'
          }`}>
            <div className="max-w-sm mx-auto w-full">
              <div className="mb-8">
                <h3 className="text-2xl font-bold text-blue-600 mb-2">Đăng ký tài khoản</h3>
                <p className="text-gray-600">
                  Bước {registerStep}/3: {
                    registerStep === 1 ? 'Email và mật khẩu' :
                    registerStep === 2 ? 'Thông tin cá nhân' :
                    'Xác thực OTP'
                  }
                </p>
              </div>

              {/* Step progress */}
              <div className="mb-8">
                <div className="flex items-center space-x-4">
                  {[1, 2, 3].map((step) => (
                    <div key={step} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        step <= registerStep 
                          ? 'bg-cyan-500 text-white' 
                          : 'bg-gray-200 text-gray-600'
                      }`}>
                        {step}
                      </div>
                      {step < 3 && (
                        <div className={`w-12 h-1 ${
                          step < registerStep ? 'bg-cyan-500' : 'bg-gray-200'
                        }`} />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Form Container với fixed height */}
              <div className="min-h-[400px] flex flex-col justify-start">
        
              {/* Step 1: Email và Password */}
              {registerStep === 1 && (
                <form key="register-step-1" onSubmit={step1Form.handleSubmit(handleEmailPasswordStep)} className="space-y-4" autoComplete="new-password">
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...step1Form.register('email')}
                      type="email"
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      placeholder="Nhập email của bạn"
                      disabled={modalState !== 'register'}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                    />
                    {(emailError || step1Form.formState.errors.email) && (
                      <p className="mt-1 text-sm text-red-600">
                        {emailError || step1Form.formState.errors.email?.message}
                      </p>
                    )}
                  </div>

                  {/* Password */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...step1Form.register('password')}
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      placeholder="Mật khẩu"
                      disabled={modalState !== 'register'}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={modalState !== 'register'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {step1Form.formState.errors.password && (
                      <p className="mt-1 text-sm text-red-600">{step1Form.formState.errors.password.message}</p>
                    )}
                  </div>

                  {/* Confirm Password */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...step1Form.register('confirmPassword')}
                      type={showConfirmPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      placeholder="Xác nhận mật khẩu"
                      disabled={modalState !== 'register'}
                      className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      disabled={modalState !== 'register'}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center disabled:opacity-50"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400" />
                      )}
                    </button>
                    {step1Form.formState.errors.confirmPassword && (
                      <p className="mt-1 text-sm text-red-600">{step1Form.formState.errors.confirmPassword.message}</p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    disabled={isCheckingEmail || modalState !== 'register'}
                    className="w-full"
                    loading={isCheckingEmail}
                  >
                    Tiếp tục
                  </Button>

                  {/* Divider */}
                  <div className="flex items-center my-4">
                    <hr className="flex-1 border-gray-300" />
                    <span className="px-4 text-gray-400 text-sm">HOẶC</span>
                    <hr className="flex-1 border-gray-300" />
                  </div>

                  {/* Google Register Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={modalState !== 'register'}
                    className="w-full flex items-center justify-center gap-3 py-3 px-4 border border-gray-300 rounded-lg bg-white hover:bg-gray-50 transition-colors font-medium text-gray-700 disabled:opacity-50"
                  >
                    <img
                      src="https://www.svgrepo.com/show/475656/google-color.svg"
                      className="w-5 h-5"
                      alt="Google"
                    />
                    Đăng ký với Google
                  </button>
                </form>
              )}

              {/* Step 2: Registration Info */}
              {registerStep === 2 && (
                <form key="register-step-2" onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4" autoComplete="off">
                  {/* Full Name */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerForm.register('fullName')}
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="words"
                      spellCheck="false"
                      placeholder="Họ và tên"
                      disabled={modalState !== 'register'}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                    />
                    {registerForm.formState.errors.fullName && (
                      <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.fullName.message}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Phone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerForm.register('phone')}
                      type="text"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      placeholder="Số điện thoại (tùy chọn)"
                      disabled={modalState !== 'register'}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                    />
                    {registerForm.formState.errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.phone.message}</p>
                    )}
                  </div>

                  {/* Date of Birth */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Calendar className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...registerForm.register('dateOfBirth')}
                      type="date"
                      autoComplete="off"
                      disabled={modalState !== 'register'}
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors disabled:bg-gray-100"
                    />
                    {registerForm.formState.errors.dateOfBirth && (
                      <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.dateOfBirth.message}</p>
                    )}
                  </div>

                  {/* Gender */}
                  <div className="relative">
                    <select
                      {...registerForm.register('gender')}
                      autoComplete="off"
                      disabled={modalState !== 'register'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors bg-white disabled:bg-gray-100"
                    >
                      <option value="">Giới tính (tùy chọn)</option>
                      <option value="male">Nam</option>
                      <option value="female">Nữ</option>
                      <option value="other">Khác</option>
                    </select>
                    {registerForm.formState.errors.gender && (
                      <p className="mt-1 text-sm text-red-600">{registerForm.formState.errors.gender.message}</p>
                    )}
                  </div>

                  <div className="flex space-x-4 pt-4">
                    <Button
                      type="button"
                      onClick={goBackStep}
                      disabled={modalState !== 'register'}
                      variant="secondary"
                      className="flex-1"
                    >
                      Quay lại
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || modalState !== 'register'}
                      className="flex-1"
                      loading={loading}
                    >
                      Đăng ký
                    </Button>
                  </div>
                </form>
              )}

              {/* Step 3: OTP Verification */}
              {registerStep === 3 && (
                <form key="register-step-3" onSubmit={handleVerifyOTP} className="space-y-6" autoComplete="off">
                  <div className="text-center mb-6">
                    <p className="text-gray-600">
                      Mã OTP đã được gửi đến email: <strong>{registerEmail}</strong>
                    </p>
                  </div>

                  <div className="relative">
                  <input
                    type="text"
                      name="verificationCode"
                      placeholder="Nhập mã OTP (6 số)"
                      value={otp}
                      onChange={e => setOTP(e.target.value)}
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="off"
                      spellCheck="false"
                      maxLength={6}
                      disabled={modalState !== 'register'}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-colors text-center text-lg tracking-widest disabled:bg-gray-100"
                    required
                  />
                    {otpError && (
                      <p className="mt-1 text-sm text-red-600 text-center">{otpError}</p>
                    )}
                  </div>

                  <div className="flex space-x-4">
                    <Button
                      type="button"
                      onClick={goBackStep}
                      disabled={modalState !== 'register'}
                      variant="secondary"
                      className="flex-1"
                    >
                      Quay lại
                    </Button>
                    <Button
                      type="submit"
                      disabled={loading || modalState !== 'register'}
                      className="flex-1"
                      loading={loading}
                    >
                      Xác thực
                    </Button>
                  </div>

                  {/* Resend OTP */}
                  <div className="text-sm text-gray-600 text-center">
                    {resendCountdown > 0 ? (
                      `Bạn có thể gửi lại sau ${resendCountdown} giây`
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOTP}
                        disabled={resendLoading || modalState !== 'register'}
                        className="font-medium text-cyan-600 hover:text-cyan-500 underline disabled:text-gray-400"
                      >
                        {resendLoading ? 'Đang gửi...' : 'Gửi lại mã OTP'}
                  </button>
                    )}
                  </div>
                </form>
              )}
              </div> {/* Đóng Form Container */}
            </div>
          </div>

          {/* Sliding Side Content - Absolute positioned */}
          <div className={`absolute top-0 w-1/2 h-full bg-gradient-to-br from-cyan-500 to-blue-600 p-12 flex flex-col justify-center text-white transition-all duration-1000 ease-in-out z-20 ${
            modalState === 'login' ? 'right-0' : 'left-0'
          }`}>
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white bg-opacity-10 rounded-full -translate-y-16 translate-x-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white bg-opacity-10 rounded-full translate-y-12 -translate-x-12"></div>
            
            {/* Logo */}
            <div className="mb-8">
              <img 
                src="/src/assets/logo/logo.png" 
                alt="GenCare Logo" 
                className="w-16 h-16 mb-4"
              />
              <h1 className="text-3xl font-bold">GenCare</h1>
            </div>

            {/* Dynamic Content */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold">{content.title}</h2>
              <p className="text-lg opacity-90">{content.subtitle}</p>
              <p className="text-sm opacity-75 leading-relaxed">{content.description}</p>
          </div>

            {/* Switch button */}
            <div className="mt-8">
              {modalState === 'login' ? (
          <button
                  onClick={switchToRegister}
                  className="flex items-center space-x-2 text-white hover:text-cyan-200 transition-colors"
                >
                  <span>Chưa có tài khoản? Đăng ký ngay</span>
                  <ArrowRight className="w-4 h-4" />
          </button>
              ) : (
              <button
                  onClick={switchToLogin}
                  className="flex items-center space-x-2 text-white hover:text-cyan-200 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Đã có tài khoản? Đăng nhập</span>
              </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;