import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Calendar, Users, Mail, Shield, Edit3, Save, X, Camera, Heart } from 'lucide-react';
import { ProfileFormData, validationSchemas } from '../../hooks/useFormValidation';
import { FormField, FormSelect } from '../../components/ui/FormField';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  role: string;
  status: boolean;
  avatar?: string;
}

// Hàm chuyển đổi dữ liệu user thành UserProfile
const convertToUserProfile = (user: any): UserProfile => {
  return {
    id: user.id,
    email: user.email,
    full_name: user.full_name,
    phone: user.phone || '',
    date_of_birth: user.date_of_birth || '',
    gender: user.gender || '',
    role: user.role,
    status: Boolean(user.status),
    avatar: user.avatar
  };
};

const UserProfilePage: React.FC = () => {
  const { user, updateUserInfo } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (user) {
      console.log('User data:', user);
      return convertToUserProfile(user);
    }
    return null;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  // React Hook Form setup
  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<ProfileFormData>({
    resolver: zodResolver(validationSchemas.profileSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      dateOfBirth: '',
      gender: ''
    }
  });

  useEffect(() => {
    if (profile) {
      let formattedDate = '';
      if (profile.date_of_birth) {
        const date = new Date(profile.date_of_birth);
        formattedDate = date.toISOString().split('T')[0];
      }
      
      reset({
        fullName: profile.full_name,
        phone: profile.phone || '',
        dateOfBirth: formattedDate,
        gender: (profile.gender as '' | 'male' | 'female' | 'other') || ''
      });
    }
  }, [profile, reset]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const onSubmit = async (data: ProfileFormData) => {
    try {
      console.log('Starting form submission...');
      const formDataToSend = new FormData();
      
      // Append form data fields
      formDataToSend.append('full_name', data.fullName);
      if (data.phone) formDataToSend.append('phone', data.phone);
      if (data.dateOfBirth) formDataToSend.append('date_of_birth', data.dateOfBirth);
      if (data.gender) formDataToSend.append('gender', data.gender);
      
      if (avatar) {
        formDataToSend.append('avatar', avatar);
        console.log('Avatar file added to FormData');
      }
      
      // Use apiClient with FormData and custom headers
      const response = await apiClient.put(API.Profile.UPDATE, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if ((response.data as any)?.success) {
        toast.success('Cập nhật thông tin thành công');
        const updatedProfile = convertToUserProfile((response.data as any).user);
        if (updateUserInfo) {
          updateUserInfo((response.data as any).user);
        }
        setProfile(updatedProfile);
        setIsEditing(false);
        setAvatar(null);
        setAvatarPreview(null);
      } else {
        toast.error((response.data as any)?.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
      console.error('Profile update error:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.details || 
                          'Có lỗi xảy ra khi cập nhật thông tin';
      toast.error(errorMessage);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setAvatar(null);
    setAvatarPreview(null);
    // Reset form to original values
    if (profile) {
      let formattedDate = '';
      if (profile.date_of_birth) {
        const date = new Date(profile.date_of_birth);
        formattedDate = date.toISOString().split('T')[0];
      }
      
      reset({
        fullName: profile.full_name,
        phone: profile.phone || '',
        dateOfBirth: formattedDate,
        gender: (profile.gender as '' | 'male' | 'female' | 'other') || ''
      });
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 flex items-center justify-center">
        <div className="text-center py-10">
          <Heart className="w-12 h-12 text-cyan-600 mx-auto mb-4" />
          <p className="text-gray-600">Không có thông tin người dùng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-teal-50 py-8 px-4">
      {/* Cover & Avatar */}
      <div className="relative">
        {/* Cover banner */}
        <div className="h-56 w-full bg-gradient-to-r from-primary-600 to-primary-700" />
        {/* Avatar overlapping bottom center */}
        <div className="absolute left-1/2 -bottom-16 transform -translate-x-1/2">
          <div className="relative group">
            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
              <AvatarImage src={avatarPreview || profile.avatar || '/default-avatar.png'} className="object-cover" />
              <AvatarFallback className="bg-cyan-600 text-white text-2xl font-bold">
                {profile.full_name?.charAt(0)}
              </AvatarFallback>
            </Avatar>
            {isEditing && (
              <Label
                htmlFor="avatar-upload"
                className="absolute bottom-0 -right-2 bg-cyan-600 text-white rounded-full p-2 cursor-pointer hover:bg-cyan-700 transition"
              >
                <Camera className="w-4 h-4" />
                <Input
                  id="avatar-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleAvatarChange}
                />
              </Label>
            )}
          </div>
        </div>
      </div>
      {/* Name & role */}
      <div className="mt-20 text-center">
        <h2 className="text-2xl font-bold text-gray-800 mb-1">{profile.full_name}</h2>
        <p className="text-cyan-600 font-medium">{profile.role}</p>
      </div>

      <div className="max-w-4xl mx-auto mt-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="flex items-center justify-between px-6 py-4 border-b border-primary-200 bg-white rounded-t-lg">
                <CardTitle className="text-lg font-semibold flex items-center text-gray-800 tracking-tight">
                  <User className="w-5 h-5 mr-2 text-primary-600" />Thông tin cá nhân
                </CardTitle>
                  {!isEditing && (
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(true)} className="text-primary-600 hover:bg-primary-50">
                      <Edit3 className="w-4 h-4 mr-1" />
                      Chỉnh sửa
                    </Button>
                  )}
              </CardHeader>
              <CardContent className="p-8">
                 {/* Avatar bên cover, nên không cần hiển thị lại trong card */}
                <div className="text-center mt-4">
                  <h3 className="text-xl font-semibold text-gray-800">{profile.full_name}</h3>
                  <p className="text-cyan-600 font-medium">{profile.role}</p>
                </div>

                {!isEditing ? (
                  // Display Mode
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <Mail className="w-5 h-5 text-cyan-600" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium">{profile.email}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <Phone className="w-5 h-5 text-cyan-600" />
                        <div>
                          <p className="text-sm text-gray-500">Số điện thoại</p>
                          <p className="font-medium">{profile.phone || 'Chưa cập nhật'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <Calendar className="w-5 h-5 text-cyan-600" />
                        <div>
                          <p className="text-sm text-gray-500">Ngày sinh</p>
                          <p className="font-medium">
                            {profile.date_of_birth 
                              ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN')
                              : 'Chưa cập nhật'
                            }
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
                        <Users className="w-5 h-5 text-cyan-600" />
                        <div>
                          <p className="text-sm text-gray-500">Giới tính</p>
                          <p className="font-medium">
                            {profile.gender === 'male' ? 'Nam' : 
                             profile.gender === 'female' ? 'Nữ' : 
                             profile.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  // Edit Mode
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        name="fullName"
                        control={control}
                        type="text"
                        placeholder="Họ và tên"
                        label="Họ và tên"
                        error={errors.fullName?.message}
                        className="w-full"
                      />
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Email</Label>
                        <Input
                          value={profile.email}
                          disabled
                          className="bg-gray-100 text-gray-500"
                        />
                        <p className="text-xs text-gray-500">Email không thể thay đổi</p>
                      </div>
                      
                      <FormField
                        name="phone"
                        control={control}
                        type="tel"
                        placeholder="Số điện thoại"
                        label="Số điện thoại"
                        error={errors.phone?.message}
                        className="w-full"
                      />
                      
                      <FormField
                        name="dateOfBirth"
                        control={control}
                        type="date"
                        placeholder="Ngày sinh"
                        label="Ngày sinh"
                        error={errors.dateOfBirth?.message}
                        className="w-full"
                      />
                      
                      <FormSelect
                        name="gender"
                        control={control}
                        placeholder="Chọn giới tính"
                        label="Giới tính"
                        error={errors.gender?.message}
                        options={[
                          { value: 'male', label: 'Nam' },
                          { value: 'female', label: 'Nữ' },
                          { value: 'other', label: 'Khác' }
                        ]}
                        className="w-full"
                      />
                      
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-gray-700">Vai trò</Label>
                        <Input
                          value={profile.role}
                          disabled
                          className="bg-gray-100 text-gray-500"
                        />
                        <p className="text-xs text-gray-500">Vai trò không thể thay đổi</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-end space-x-4 pt-6 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleCancelEdit}
                        disabled={isSubmitting}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Hủy
                      </Button>
                      <Button
                        type="submit"
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700"
                      >
                        <Save className="w-4 h-4 mr-1" />
                        {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Stats/Info Card */}
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Trạng thái tài khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Tình trạng:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      profile.status 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {profile.status ? 'Hoạt động' : 'Tạm khóa'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Vai trò:</span>
                    <span className="font-medium text-cyan-600">{profile.role}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-t-lg">
                <CardTitle>Tips</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm text-gray-600">
                  <p>• Cập nhật đầy đủ thông tin để nhận được dịch vụ tốt nhất</p>
                  <p>• Số điện thoại giúp chúng tôi liên hệ khi cần thiết</p>
                  <p>• Hình đại diện giúp bác sĩ dễ nhận diện bạn hơn</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfilePage;