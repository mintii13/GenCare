import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../../contexts/AuthContext';
import { navigateAfterLogin } from '../../utils/navigationUtils';
import { LoginFormData, validationSchemas } from '../../hooks/useFormValidation';
import { FormField } from '../../components/ui/FormField';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import { toast } from 'react-hot-toast';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();

  // React Hook Form với Zod validation
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(validationSchemas.loginSchema),
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      // Sử dụng apiClient thay vì axios trực tiếp
      const response = await apiClient.post(API.Auth.LOGIN, data);
      
      if ((response.data as any)?.success) {
        // Lưu thông tin đăng nhập
        const user = (response.data as any).user;
        login(user, (response.data as any).accessToken);
        
        // Redirect dựa trên role
        navigateAfterLogin(user, navigate);
        
        // Thông báo thành công dựa trên role
        if (user.role === 'customer') {
          toast.success(`Chào mừng ${user.full_name || user.email}! `);
        } else {
          toast.success('Đăng nhập thành công! Đang chuyển hướng...');
        }
      } else {
        toast.error((response.data as any)?.message || 'Đăng nhập thất bại');
      }
    } catch (error: any) {
      console.error('Login error:', error);
      const errorMessage = error?.response?.data?.details || 
                          error?.response?.data?.message || 
                          'Đăng nhập thất bại';
      toast.error(errorMessage);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Đăng nhập</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              name="email"
              control={control}
              type="email"
              placeholder="Email"
              error={errors.email?.message}
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
            
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;