import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    role: 'customer'
  });

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    role: ''
  });

  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
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

  const { login } = useAuth();
  const navigate = useNavigate();

  // Đếm ngược resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showOTP && resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown(resendCountdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [showOTP, resendCountdown]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Chỉ reset lỗi khi trường hợp hợp lệ
    if (name === 'email' && emailCheckError) {
      if (/\S+@\S+\.\S+/.test(value)) {
        setEmailCheckError('');
      }
    }
    // Không reset errors cho các trường khác ở đây
  };

  const validateStep1 = () => {
    let isValid = true;
    const newErrors = {
      ...errors,
      email: '',
      password: '',
      confirmPassword: ''
    };

    if (!formData.email.trim()) {
      newErrors.email = 'Vui lòng nhập email';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email không hợp lệ';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Mật khẩu phải có ít nhất 6 ký tự';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu không khớp';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const validateStep2 = () => {
    let isValid = true;
    const newErrors = {
      ...errors,
      fullName: '',
      phone: '',
      dateOfBirth: '',
      gender: ''
    };

    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ tên';
      isValid = false;
    }

    if (formData.phone && !/^[0-9]{10}$/.test(formData.phone)) {
      newErrors.phone = 'Số điện thoại không hợp lệ';
      isValid = false;
    }

    if (formData.dateOfBirth) {
      const date = new Date(formData.dateOfBirth);
      if (isNaN(date.getTime())) {
        newErrors.dateOfBirth = 'Ngày sinh không hợp lệ';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const checkEmailExists = async () => {
    try {
      setIsCheckingEmail(true);
      const response = await axios.post('http://localhost:3000/api/auth/check-email', {
        email: formData.email
      });
      return response.data.exists;
    } catch (error) {
      console.error('Error checking email:', error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleNextStep = async () => {
    if (validateStep1()) {
      const emailExists = await checkEmailExists();
      if (emailExists) {
        setErrors(prev => ({
          ...prev,
          email: 'Email này đã được sử dụng'
        }));
      } else {
        setStep(2);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateStep2()) {
      try {
        const res = await axios.post('http://localhost:3000/api/auth/register', {
          email: formData.email,
          password: formData.password,
          confirm_password: formData.confirmPassword,
          full_name: formData.fullName,
          phone: formData.phone,
          date_of_birth: formData.dateOfBirth,
          gender: formData.gender
        });
        if (res.data.success) {
          setShowOTP(true);
          setRegisterEmail(formData.email);
          setRegisterPassword(formData.password);
        } else {
          alert(res.data.message || 'Đăng ký thất bại');
        }
      } catch (error: any) {
        alert(error.response?.data?.details || 'Đăng ký thất bại');
      }
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOTPError('');
    try {
      const res = await axios.post('http://localhost:3000/api/auth/verifyOTP', {
        email: registerEmail,
        otp
      });
      if (res.data.success) {
        // Tự động đăng nhập
        const loginRes = await axios.post('http://localhost:3000/api/auth/login', {
          email: registerEmail,
          password: registerPassword
        });
        if (loginRes.data.success) {
          login(loginRes.data.user);
          navigate('/');
        } else {
          setRegisterSuccess(true); // fallback: chỉ báo thành công nếu login lỗi
        }
      } else {
        setOTPError(res.data.message || 'Xác thực OTP thất bại');
      }
    } catch (error: any) {
      setOTPError(error.response?.data?.details || 'Xác thực OTP thất bại');
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = "http://localhost:3000/api/auth/google/verify";
    console.log('Google sign-in clicked');
  };

  const handleCheckEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailCheckError('');
    if (!formData.email.trim()) {
      setEmailCheckError('Vui lòng nhập email');
      return;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setEmailCheckError('Email không hợp lệ');
      return;
    }
    try {
      setIsCheckingEmail(true);
      const response = await axios.post('http://localhost:3000/api/auth/check-email', {
        email: formData.email
      });
      if (response.data.exists) {
        setEmailCheckError('Email này đã được sử dụng');
      } else {
        setEmailChecked(true);
      }
    } catch (error) {
      setEmailCheckError('Lỗi kiểm tra email');
    } finally {
      setIsCheckingEmail(false);
    }
  };

  const handleResendOTP = async () => {
    setResendLoading(true);
    setOTPError('');
    try {
      await axios.get(`http://localhost:3000/api/auth/otpForm?email=${registerEmail}`);
      setResendCountdown(60);
    } catch (error) {
      setOTPError('Gửi lại OTP thất bại.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">Đăng ký tài khoản</CardTitle>
          <CardDescription className="text-center">
            {step === 1 ? 'Bước 1: Thông tin đăng nhập' : 'Bước 2: Thông tin cá nhân'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {showOTP ? (
            <form onSubmit={handleVerifyOTP} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  name="otp"
                  placeholder="Nhập mã OTP gửi về email"
                  value={otp}
                  onChange={e => setOTP(e.target.value)}
                />
                {otpError && <p className="text-red-500 text-sm">{otpError}</p>}
              </div>
              <Button type="submit" className="w-full">Xác thực OTP</Button>
              <div className="text-center mt-2">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={handleResendOTP}
                  disabled={resendCountdown > 0 || resendLoading}
                >
                  {resendCountdown > 0 ? `Gửi lại OTP sau ${resendCountdown}s` : resendLoading ? 'Đang gửi...' : 'Gửi lại OTP'}
                </Button>
              </div>
            </form>
          ) : registerSuccess ? (
            <div className="text-green-600 text-center font-semibold py-8">
              Đăng ký thành công! Bạn có thể <Link to="/login" className="text-primary underline">đăng nhập</Link> ngay.
            </div>
          ) : !emailChecked ? (
            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  error={emailCheckError}
                />
              </div>
              <Button type="submit" className="w-full" disabled={isCheckingEmail}>
                {isCheckingEmail ? 'Đang kiểm tra...' : 'Tiếp tục'}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="password"
                  name="password"
                  placeholder="Mật khẩu"
                  value={formData.password}
                  onChange={handleChange}
                  error={errors.password}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Xác nhận mật khẩu"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  error={errors.confirmPassword}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="text"
                  name="fullName"
                  placeholder="Họ và tên"
                  value={formData.fullName}
                  onChange={handleChange}
                  error={errors.fullName}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="tel"
                  name="phone"
                  placeholder="Số điện thoại"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                />
              </div>
              <div className="space-y-2">
                <Input
                  type="date"
                  name="dateOfBirth"
                  placeholder="Ngày sinh"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  error={errors.dateOfBirth}
                />
              </div>
              <div className="space-y-2">
                <Select
                  name="gender"
                  value={formData.gender}
                  onValueChange={(value: string) => handleChange({ target: { name: 'gender', value } } as any)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn giới tính" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Nam</SelectItem>
                    <SelectItem value="female">Nữ</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
                {errors.gender && <p className="text-red-500 text-sm">{errors.gender}</p>}
              </div>
              <div className="flex space-x-4">
                <Button type="button" variant="outline" className="w-full" onClick={() => setEmailChecked(false)}>
                  Quay lại
                </Button>
                <Button type="submit" className="w-full">
                  Đăng ký
                </Button>
              </div>
            </form>
          )}

          {step === 1 && (
            <>
              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">Hoặc tiếp tục với</span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleGoogleSignIn}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    fill="#4285F4"
                  />
                  <path
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    fill="#34A853"
                  />
                  <path
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    fill="#FBBC05"
                  />
                  <path
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    fill="#EA4335"
                  />
                </svg>
                Đăng ký với Google
              </Button>
            </>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-4">
          <p className="text-sm text-gray-500 text-center">
            Đã có tài khoản?{' '}
            <Link to="/login" className="text-primary hover:underline">
              Đăng nhập
            </Link>
          </p>
          <p className="text-sm text-gray-500 text-center">
            Bằng cách đăng ký, bạn đồng ý với{' '}
            <Link to="/terms" className="text-primary hover:underline">
              Điều khoản dịch vụ
            </Link>{' '}
            và{' '}
            <Link to="/privacy" className="text-primary hover:underline">
              Chính sách bảo mật
            </Link>{' '}
            của chúng tôi
          </p>
        </CardFooter>
      </Card>
    </div>
  );
};

export default Register; 