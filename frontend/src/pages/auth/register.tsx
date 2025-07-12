import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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

const Register: React.FC = () => {
  const [step, setStep] = useState(1);
  const [showOTP, setShowOTP] = useState(false);
  const [otp, setOTP] = useState('');
  const [registerEmail, setRegisterEmail] = useState('');
  const [registerPassword, setRegisterPassword] = useState('');
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [otpError, setOTPError] = useState('');
  const [emailChecked, setEmailChecked] = useState(false);
  const [emailCheckError, setEmailCheckError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(60);
  const [resendLoading, setResendLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    getValues,
    trigger,
    formState: { errors, isSubmitting }
  } = useForm<RegisterFormData>({
    resolver: zodResolver(validationSchemas.registerSchema) as any,
    defaultValues: {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      role: 'customer'
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

  const handleNextStep = async () => {
    // Validate step 1 fields
    const step1Valid = await trigger(['email', 'password', 'confirmPassword']);
    
    if (step1Valid) {
      const values = getValues();
      const emailExists = await checkEmailExists(values.email);
      
      if (emailExists) {
        setEmailCheckError('Email này đã được sử dụng');
        toast.error('Email này đã được sử dụng');
      } else {
        setEmailCheckError('');
        setStep(2);
      }
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (step === 1) {
      await handleNextStep();
      return;
    }

    try {
      // Register API call
      const response = await apiClient.post(API.Auth.REGISTER, {
        email: data.email,
        password: data.password,
        confirm_password: data.confirmPassword,
        full_name: data.fullName,
        phone: data.phone,
        date_of_birth: data.dateOfBirth,
        gender: data.gender,
        role: data.role
      });

      if ((response.data as any)?.success) {
        setShowOTP(true);
        setRegisterEmail(data.email);
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
          }
        } catch (loginError) {
          toast.success('Xác thực thành công! Vui lòng đăng nhập.');
          navigate('/login');
        }
      } else {
        setOTPError((response.data as any)?.message || 'OTP không hợp lệ');
        toast.error((response.data as any)?.message || 'OTP không hợp lệ');
      }
    } catch (error: any) {
      const errorMessage = error?.response?.data?.details || 
                          error?.response?.data?.message || 
                          'Xác thực thất bại';
      setOTPError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = `${API.Auth.GOOGLE_VERIFY}`;
  };

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    const values = getValues();
    
    if (!values.email) {
      setEmailCheckError('Vui lòng nhập email');
      return;
    }

    const emailExists = await checkEmailExists(values.email);
    if (emailExists) {
      setEmailCheckError('Email này đã được sử dụng');
      toast.error('Email này đã được sử dụng');
    } else {
      setEmailChecked(true);
      setEmailCheckError('');
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
                {otpError && <p className="text-red-500 text-sm mt-1">{otpError}</p>}
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
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {step === 1 && (
              <>
                <FormField
                  name="email"
                  control={control}
                  type="email"
                  placeholder="Email"
                  error={errors.email?.message || emailCheckError}
                  className="w-full"
                />
                
                <FormField
                  name="password"
                  control={control}
                  type="password"
                  placeholder="Mật khẩu"
                  error={errors.password?.message}
                  className="w-full"
                />
                
                <FormField
                  name="confirmPassword"
                  control={control}
                  type="password"
                  placeholder="Xác nhận mật khẩu"
                  error={errors.confirmPassword?.message}
                  className="w-full"
                />
                
                <Button
                  type="submit"
                  className="w-full"
                  disabled={isSubmitting || isCheckingEmail}
                >
                  {isCheckingEmail ? 'Đang kiểm tra...' : 'Tiếp tục'}
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                <FormField
                  name="fullName"
                  control={control}
                  type="text"
                  placeholder="Họ và tên"
                  error={errors.fullName?.message}
                  className="w-full"
                />
                
                <FormField
                  name="phone"
                  control={control}
                  type="tel"
                  placeholder="Số điện thoại (tùy chọn)"
                  error={errors.phone?.message}
                  className="w-full"
                />
                
                <FormField
                  name="dateOfBirth"
                  control={control}
                  type="date"
                  placeholder="Ngày sinh (tùy chọn)"
                  error={errors.dateOfBirth?.message}
                  className="w-full"
                />
                
                <FormSelect
                  name="gender"
                  control={control}
                  placeholder="Giới tính (tùy chọn)"
                  error={errors.gender?.message}
                  options={[
                    { value: 'male', label: 'Nam' },
                    { value: 'female', label: 'Nữ' },
                    { value: 'other', label: 'Khác' }
                  ]}
                  className="w-full"
                />
                
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="flex-1"
                  >
                    Quay lại
                  </Button>
                  
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Đang đăng ký...' : 'Đăng ký'}
                  </Button>
                </div>
              </>
            )}
          </form>
          
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
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              Đăng nhập ngay
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register;