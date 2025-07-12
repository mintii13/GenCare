import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Calendar, Mail, Edit3, Save, X, Camera, MapPin } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { userService } from '../../services/userService';

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

const UserProfilePage: React.FC = () => {
  const { user, updateUserInfo } = useAuth();
  const [profile, setProfile] = useState(user);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);

  useEffect(() => {
    setProfile(user);
    if (user) {
      setFormData({
        full_name: user.full_name,
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        gender: (user.gender as 'male' | 'female' | 'other' | undefined),
      });
    } else {
      setFormData({});
    }
  }, [user]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => {
      if (name === 'gender') {
        // Only allow allowed values or undefined
        const genderVal = value === '' ? undefined : (value as 'male' | 'female' | 'other');
        return { ...prev, gender: genderVal };
      }
      return { ...prev, [name]: value };
    });
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setAvatar(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Only send allowed fields
      const allowedGenders = ['male', 'female', 'other'] as const;
      const gender = allowedGenders.includes(formData.gender as any)
        ? (formData.gender as 'male' | 'female' | 'other')
        : undefined;
      const submitData = {
        full_name: formData.full_name,
        phone: formData.phone,
        date_of_birth: formData.date_of_birth,
        gender,
      };
      const res = await userService.updateProfile(submitData);
      let updatedUser = res.user;
      if (avatar) {
        const form = new FormData();
        form.append('avatar', avatar);
        const avatarRes = await userService.uploadAvatar(form);
        if (avatarRes.success) {
          updatedUser = { ...updatedUser, avatar: avatarRes.avatar_url };
        }
      }
      setProfile(updatedUser);
      updateUserInfo(updatedUser);
      setIsEditing(false);
      setAvatarPreview(null);
      setAvatar(null);
    } catch (error) {
      // Toast error message here if needed
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
                <p className="text-gray-600 mb-2">{profile.role}</p>
                <div className="flex items-center justify-center sm:justify-start gap-2 text-gray-500 text-sm">
                  <MapPin className="w-4 h-4" />
                  <span>Hồ Chí Minh, Việt Nam</span>
                </div>
              </div>

              {!isEditing && (
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
                    onClick={() => setIsEditing(false)}
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

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1 block">Trạng thái</label>
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full`} style={{ backgroundColor: profile.status ? '#52c41a' : '#ff4d4f' }}></div>
                      <span className={`text-sm font-medium`} style={{ color: profile.status ? '#52c41a' : '#ff4d4f' }}>
                        {profile.status ? 'Hoạt động' : 'Bị khóa'}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Edit Mode */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="full_name" className="text-sm font-medium text-gray-700 mb-2 block">
                        Họ tên
                      </Label>
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name || ''}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none transition-colors"
                        style={{ 
                          borderColor: '#e6f7ff',
                          backgroundColor: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e6f7ff';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-2 block">
                        Số điện thoại
                      </Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        pattern="[0-9]{10}"
                        title="Số điện thoại phải có 10 chữ số"
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none transition-colors"
                        style={{ 
                          borderColor: '#e6f7ff',
                          backgroundColor: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e6f7ff';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="date_of_birth" className="text-sm font-medium text-gray-700 mb-2 block">
                        Ngày sinh
                      </Label>
                      <Input
                        id="date_of_birth"
                        name="date_of_birth"
                        type="date"
                        value={formData.date_of_birth || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none transition-colors"
                        style={{ 
                          borderColor: '#e6f7ff',
                          backgroundColor: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e6f7ff';
                          e.target.style.boxShadow = 'none';
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="gender" className="text-sm font-medium text-gray-700 mb-2 block">
                        Giới tính
                      </Label>
                      <select
                        id="gender"
                        name="gender"
                        value={formData.gender || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:outline-none transition-colors"
                        style={{ 
                          borderColor: '#e6f7ff',
                          backgroundColor: '#ffffff'
                        }}
                        onFocus={(e) => {
                          e.target.style.borderColor = '#1890ff';
                          e.target.style.boxShadow = '0 0 0 2px rgba(24, 144, 255, 0.2)';
                        }}
                        onBlur={(e) => {
                          e.target.style.borderColor = '#e6f7ff';
                          e.target.style.boxShadow = 'none';
                        }}
                      >
                        <option value="">Chọn giới tính</option>
                        <option value="male">Nam</option>
                        <option value="female">Nữ</option>
                        <option value="other">Khác</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button 
                      type="button" 
                      variant="outline" 
                      className="px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      style={{ borderColor: '#e6f7ff' }}
                      onClick={() => {
                        setIsEditing(false);
                        setAvatarPreview(null);
                        setAvatar(null);
                      }}
                    >
                      Hủy
                    </Button>
                    <Button 
                      type="submit" 
                      className="px-4 py-2 text-white flex items-center gap-2 transition-colors"
                      style={{ backgroundColor: '#1890ff' }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#40a9ff'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#1890ff'}
                      onClick={handleSubmit}
                    >
                      <Save className="w-4 h-4" />
                      Lưu thay đổi
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserProfilePage;