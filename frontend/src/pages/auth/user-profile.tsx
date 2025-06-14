import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/label';
import { toast } from 'react-hot-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Phone, Calendar, Users, Mail, Shield, Edit3, Save, X, Camera, Heart } from 'lucide-react';

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

const UserProfilePage: React.FC = () => {  const { user, updateUserInfo } = useAuth();  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (user) {
      console.log('User data:', user);
      return convertToUserProfile(user);
    }
    return null;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [avatar, setAvatar] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  useEffect(() => {
    if (profile) {
      let formattedDate = '';
      if (profile.date_of_birth) {
        const date = new Date(profile.date_of_birth);
        formattedDate = date.toISOString().split('T')[0];
      }
      
      setFormData({
        full_name: profile.full_name,
        phone: profile.phone || '',
        date_of_birth: formattedDate,
        gender: profile.gender || ''
      });
    }
  }, [profile]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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
      console.log('Starting form submission...');
      const formDataToSend = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        if (value) {
          formDataToSend.append(key, value.toString());
          console.log(`Adding to FormData: ${key} = ${value}`);
        }
      });
      
      if (avatar) {
        formDataToSend.append('avatar', avatar);
        console.log('Avatar file added to FormData');
      }
      
      const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY);
      if (!token) {
        toast.error('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL}/profile/updateUserProfile`, {
        method: 'PUT',
        body: formDataToSend,
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();      if (data.success) {
        toast.success('Cập nhật thông tin thành công');
        const updatedProfile = convertToUserProfile(data.user);
        if (updateUserInfo) {
          updateUserInfo(data.user);
        }
        setProfile(updatedProfile);
        setIsEditing(false);
      } else {
        toast.error(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Có lỗi xảy ra khi cập nhật thông tin');
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
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <Heart className="w-8 h-8 text-cyan-600 mr-3" />
            <h1 className="text-3xl font-bold text-gray-800">Hệ Thống Chăm Sóc Sức Khỏe</h1>
          </div>
          <p className="text-gray-600">Quản lý thông tin cá nhân của bạn</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="lg:col-span-2">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-t-lg">
                <CardTitle className="text-2xl font-bold flex items-center">
                  <User className="w-6 h-6 mr-2" />
                  Thông Tin Cá Nhân
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8">
                {/* Avatar Section */}
                <div className="flex justify-center mb-8">
                  <div className="relative group">
                    <div className="relative">
                      <Avatar className="h-32 w-32 border-4 border-cyan-200 shadow-lg">
                        <AvatarImage 
                          src={avatarPreview || profile.avatar || '/default-avatar.png'} 
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white text-2xl font-bold">
                          {profile.full_name?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      {isEditing && (
                        <Label
                          htmlFor="avatar-upload"
                          className="absolute -bottom-2 -right-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-full p-3 cursor-pointer hover:from-cyan-600 hover:to-blue-600 transition-all duration-200 shadow-lg group-hover:scale-110"
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
                    <div className="text-center mt-4">
                      <h3 className="text-xl font-semibold text-gray-800">{profile.full_name}</h3>
                      <p className="text-cyan-600 font-medium">{profile.role}</p>
                    </div>
                  </div>
                </div>

                {!isEditing ? (
                  <div className="space-y-6">
                    {/* Information Display */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="flex items-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100">
                          <Mail className="w-5 h-5 text-cyan-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Email</p>
                            <p className="text-gray-800">{profile.email}</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100">
                          <Phone className="w-5 h-5 text-cyan-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Số điện thoại</p>
                            <p className="text-gray-800">{profile.phone || 'Chưa cập nhật'}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="flex items-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100">
                          <Calendar className="w-5 h-5 text-cyan-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Ngày sinh</p>
                            <p className="text-gray-800">
                              {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center p-4 bg-gradient-to-r from-cyan-50 to-blue-50 rounded-lg border border-cyan-100">
                          <Users className="w-5 h-5 text-cyan-600 mr-3" />
                          <div>
                            <p className="text-sm text-gray-600 font-medium">Giới tính</p>
                            <p className="text-gray-800">
                              {profile.gender === 'male' ? 'Nam' : profile.gender === 'female' ? 'Nữ' : profile.gender === 'other' ? 'Khác' : 'Chưa cập nhật'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white py-3 text-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      onClick={() => setIsEditing(true)}
                    >
                      <Edit3 className="w-5 h-5 mr-2" />
                      Chỉnh sửa thông tin
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="full_name" className="text-sm font-semibold text-gray-700 flex items-center">
                          <User className="w-4 h-4 mr-2 text-cyan-600" />
                          Họ tên
                        </Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name || ''}
                          onChange={handleInputChange}
                          required
                          className="border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Phone className="w-4 h-4 mr-2 text-cyan-600" />
                          Số điện thoại
                        </Label>
                        <Input
                          id="phone"
                          name="phone"
                          value={formData.phone || ''}
                          onChange={handleInputChange}
                          pattern="[0-9]{10}"
                          title="Số điện thoại phải có 10 chữ số"
                          className="border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="date_of_birth" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Calendar className="w-4 h-4 mr-2 text-cyan-600" />
                          Ngày sinh
                        </Label>
                        <Input
                          id="date_of_birth"
                          name="date_of_birth"
                          type="date"
                          value={formData.date_of_birth || ''}
                          onChange={handleInputChange}
                          className="border-cyan-200 focus:border-cyan-500 focus:ring-cyan-500 rounded-lg"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="gender" className="text-sm font-semibold text-gray-700 flex items-center">
                          <Users className="w-4 h-4 mr-2 text-cyan-600" />
                          Giới tính
                        </Label>
                        <select
                          id="gender"
                          name="gender"
                          value={formData.gender || ''}
                          onChange={handleInputChange}
                          className="w-full p-3 border border-cyan-200 rounded-lg focus:border-cyan-500 focus:ring-cyan-500 focus:outline-none transition-colors"
                        >
                          <option value="">Chọn giới tính</option>
                          <option value="male">Nam</option>
                          <option value="female">Nữ</option>
                          <option value="other">Khác</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex space-x-4 pt-4">
                      <Button 
                        type="submit" 
                        className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white py-3 font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        <Save className="w-5 h-5 mr-2" />
                        Lưu thay đổi
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        className="flex-1 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 py-3 font-medium transition-all duration-200"
                        onClick={() => {
                          setIsEditing(false);
                          setAvatarPreview(null);
                          setAvatar(null);
                        }}
                      >
                        <X className="w-5 h-5 mr-2" />
                        Hủy
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Status Card */}
          <div className="space-y-6">
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-emerald-500 to-green-500 text-white rounded-t-lg">
                <CardTitle className="text-lg font-bold flex items-center">
                  <Shield className="w-5 h-5 mr-2" />
                  Trạng Thái Tài Khoản
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="text-center">                  <div className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-semibold ${                    profile.status
                      ? 'bg-green-100 text-green-800 border border-green-200' 
                      : 'bg-red-100 text-red-800 border border-red-200'
                  }`}>
                    <div className={`w-2 h-2 rounded-full mr-2 ${
                      profile.status ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    {profile.status ? 'Hoạt động' : 'Bị khóa'}
                  </div>
                  <p className="text-gray-600 mt-3 text-sm">
                    {profile.status
                      ? 'Tài khoản của bạn đang hoạt động bình thường'
                      : 'Tài khoản của bạn đang bị tạm khóa'
                    }
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Healthcare Info Card */}
            <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-t-lg">
                <CardTitle className="text-lg font-bold flex items-center">
                  <Heart className="w-5 h-5 mr-2" />
                  Thông Tin Y Tế
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-3 text-sm">
                 
                  <div className="flex justify-between">
                    <span className="text-gray-600">Email:</span>
                    <span className="font-semibold text-cyan-700">{profile.email}</span>  
                  </div>
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