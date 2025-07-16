import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Edit3, Save, X, Camera, MapPin } from 'lucide-react';
import { ProfileFormData, validationSchemas } from '../../hooks/useFormValidation';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { AxiosResponse } from 'axios';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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
      return convertToUserProfile(user);
    }
    return null;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [changePwdLoading, setChangePwdLoading] = useState(false);

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
    const fetchProfile = async () => {
      try {
        const res: AxiosResponse<any> = await apiClient.get(API.Profile.GET);
        if (res.data.success) {
          setProfile(res.data.user);
          toast.success('Profile loaded');
        }
      } catch (error: any) {
        if (error.response?.data?.message?.includes('Google')) {
          toast.error('Lỗi Google login, hãy thử lại');
        } else {
          toast.error('Lỗi lấy profile');
        }
      }
    };
    fetchProfile();
  }, []);

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
      const formDataToSend = new FormData();
      
      // Append form data fields
      formDataToSend.append('full_name', data.fullName);
      if (data.phone) formDataToSend.append('phone', data.phone);
      if (data.dateOfBirth) formDataToSend.append('date_of_birth', data.dateOfBirth);
      if (data.gender) formDataToSend.append('gender', data.gender);
      
      if (avatar) {
        formDataToSend.append('avatar', avatar);
 
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
        
        // Chỉ cập nhật local state, không gọi updateUserInfo để tránh re-render AuthContext
        setProfile(updatedProfile);
        setIsEditing(false);
        setAvatar(null);
        setAvatarPreview(null);
        
        // Cập nhật user info sau một delay ngắn để tránh conflict
        setTimeout(() => {
          if (updateUserInfo) {
            updateUserInfo((response.data as any).user);
          }
        }, 100);
      } else {
        toast.error((response.data as any)?.message || 'Có lỗi xảy ra');
      }
    } catch (error: any) {
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

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword || !newPassword || !confirmNewPassword) {
      toast.error('Vui lòng nhập đầy đủ thông tin');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      toast.error('Mật khẩu mới không khớp');
      return;
    }
    setChangePwdLoading(true);
    try {
      const res = await apiClient.put(API.Auth.CHANGE_PASSWORD, {
        old_password: oldPassword,
        new_password: newPassword
      });
      const data = res.data as any;
      if (data.success) {
        toast.success('Đổi mật khẩu thành công!');
        setShowChangePassword(false);
        setOldPassword('');
        setNewPassword('');
        setConfirmNewPassword('');
      } else {
        toast.error(data.message || 'Đổi mật khẩu thất bại');
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setChangePwdLoading(false);
    }
  };

  if (!profile) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center py-10">
          <p className="text-gray-600">Không có thông tin người dùng.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold mb-2" style={{ color: '#1890ff' }}>Hồ sơ cá nhân</h1>
          <p className="text-gray-600">Quản lý thông tin cá nhân của bạn</p>
        </div>
        {/* Nút đổi mật khẩu */}
        <div className="mb-6">
          <Button variant="outline" onClick={() => setShowChangePassword(true)}>
            Đổi mật khẩu
          </Button>
        </div>


        {/* Profile Card */}
        <Card className="shadow-sm border" style={{ backgroundColor: '#ffffff', borderColor: '#e6f7ff' }}>
          <CardContent className="p-8">
            {/* Avatar and Basic Info */}
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 mb-8">
              <div className="relative">
                <Avatar className="h-24 w-24 border-2" style={{ borderColor: '#e6f7ff' }}>
                  <AvatarImage 
                    src={avatarPreview || profile.avatar || '/api/placeholder/150/150'} 
                    className="object-cover"
                  />
                  <AvatarFallback className="text-xl font-semibold" style={{ backgroundColor: '#e6f7ff', color: '#1890ff' }}>
                    {profile.full_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <Label
                    htmlFor="avatar-upload"
                    className="absolute -bottom-1 -right-1 text-white rounded-full p-2 cursor-pointer transition-colors shadow-lg"
                    style={{ backgroundColor: '#1890ff' }}
                    onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#40a9ff'}
                    onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
                  >
                    <Camera className="w-3 h-3" />
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
              
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-xl font-semibold text-gray-900 mb-1">{profile.full_name}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mb-2">
                  <p className="text-gray-600">{profile.role}</p>
                  <div className="flex items-center gap-1">
                    <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: profile.status ? '#52c41a' : '#ff4d4f' }}></div>
                    <span className={`text-xs font-medium`} style={{ color: profile.status ? '#52c41a' : '#ff4d4f' }}>
                      {profile.status ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Hồ Chí Minh, Việt Nam</span>
                </div>
              </div>

              {!isEditing && (
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    style={{ borderColor: '#1890ff', color: '#1890ff' }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.backgroundColor = '#e6f7ff';
                      e.currentTarget.style.borderColor = '#40a9ff';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.backgroundColor = '#ffffff';
                      e.currentTarget.style.borderColor = '#1890ff';
                    }}
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit3 className="w-4 h-4" />
                    Chỉnh sửa
                  </Button>
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowChangePassword(true)}
                  >
                    Đổi mật khẩu
                  </Button>
                </div>
              )}
            </div>

            {/* Personal Information Section */}
            <div className="border-t pt-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-medium text-gray-900">Thông tin cá nhân</h3>
                {isEditing && (
                  <Button 
                    variant="outline"
                    className="flex items-center gap-2 px-3 py-2 text-sm border-gray-300 text-gray-700 hover:bg-gray-50"
                    onClick={handleCancelEdit}
                  >
                    <X className="w-4 h-4" />
                    Hủy
                  </Button>
                )}
              </div>

              {!isEditing ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  {/* Display Mode */}
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Họ tên</label>
                    <p className="text-gray-900">{profile.full_name}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
                    <p className="text-gray-900">{profile.email}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Số điện thoại</label>
                    <p className="text-gray-900">{profile.phone || 'Chưa cập nhật'}</p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Ngày sinh</label>
                    <p className="text-gray-900">
                      {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Giới tính</label>
                    <p className="text-gray-900">
                      {profile.gender === 'male' ? 'Nam' : 
                       profile.gender === 'female' ? 'Nữ' : 
                       profile.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
                    </p>
                  </div>


                </div>
              ) : (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Edit Mode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="fullName" className="text-sm font-medium text-gray-700 mb-2 block">
                        Họ tên
                      </Label>
                      <Input
                        id="fullName"
                        {...control.register('fullName')}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none transition-colors"
                        style={{ 
                          borderColor: errors.fullName ? '#ff4d4f' : '#e6f7ff',
                          backgroundColor: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.fullName ? '#ff4d4f' : '#e6f7ff';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {errors.fullName && (
                        <p className="text-sm text-red-500 mt-1">{errors.fullName.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                        Số điện thoại
                      </Label>
                      <Input
                        id="phone"
                        {...control.register('phone')}
                        pattern="[0-9]{10}"
                        title="Số điện thoại phải có 10 chữ số"
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none transition-colors"
                        style={{ 
                          borderColor: errors.phone ? '#ff4d4f' : '#e6f7ff',
                          backgroundColor: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.phone ? '#ff4d4f' : '#e6f7ff';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {errors.phone && (
                        <p className="text-sm text-red-500 mt-1">{errors.phone.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 mb-2 block">
                        Ngày sinh
                      </Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        {...control.register('dateOfBirth')}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none transition-colors"
                        style={{ 
                          borderColor: errors.dateOfBirth ? '#ff4d4f' : '#e6f7ff',
                          backgroundColor: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.dateOfBirth ? '#ff4d4f' : '#e6f7ff';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                      {errors.dateOfBirth && (
                        <p className="text-sm text-red-500 mt-1">{errors.dateOfBirth.message}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium text-gray-700 mb-2 block">
                        Giới tính
                      </Label>
                      <select
                        id="gender"
                        {...control.register('gender')}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none transition-colors"
                        style={{ 
                          borderColor: errors.gender ? '#ff4d4f' : '#e6f7ff',
                          backgroundColor: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = errors.gender ? '#ff4d4f' : '#e6f7ff';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                      {errors.gender && (
                        <p className="text-sm text-red-500 mt-1">{errors.gender.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      style={{ borderColor: '#e6f7ff' }}
                      onClick={handleCancelEdit}
                      disabled={isSubmitting}
                    >
                      Hủy
                    </Button>
                    <Button 
                      type="submit" 
                      className="px-4 py-2 text-white flex items-center gap-2 transition-colors"
                      style={{ backgroundColor: '#1890ff' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#40a9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
                      disabled={isSubmitting}
                    >
                      <Save className="w-4 h-4" />
                      {isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </CardContent>
        </Card>
        {/* Modal đổi mật khẩu */}
        <Dialog open={showChangePassword} onOpenChange={setShowChangePassword}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Đổi mật khẩu</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleChangePassword} className="space-y-4">
              <Input
                type="password"
                placeholder="Mật khẩu hiện tại"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Mật khẩu mới"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                required
              />
              <Input
                type="password"
                placeholder="Xác nhận mật khẩu mới"
                value={confirmNewPassword}
                onChange={e => setConfirmNewPassword(e.target.value)}
                required
              />
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setShowChangePassword(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={changePwdLoading}>
                  {changePwdLoading ? 'Đang đổi...' : 'Đổi mật khẩu'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default UserProfilePage;