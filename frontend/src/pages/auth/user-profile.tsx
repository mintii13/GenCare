import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface UserProfile {
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  registration_date: string;
  last_login?: string;
  status: boolean;
  email_verified: boolean;
  role: string;
}

const UserProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const res = await axios.get('/api/auth/profile', { withCredentials: true });
        setProfile(res.data.data);
      } catch (err: any) {
        setError('Không thể tải thông tin người dùng.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (error) return <div className="text-center text-red-500 py-10">{error}</div>;
  if (!profile) return <div className="text-center py-10">Không có thông tin người dùng.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Thông tin người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div><b>Email:</b> {profile.email}</div>
            <div><b>Họ tên:</b> {profile.full_name}</div>
            <div><b>Số điện thoại:</b> {profile.phone || 'Chưa cập nhật'}</div>
            <div><b>Ngày sinh:</b> {profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Chưa cập nhật'}</div>
            <div><b>Giới tính:</b> {profile.gender || 'Chưa cập nhật'}</div>
            <div><b>Ngày đăng ký:</b> {new Date(profile.registration_date).toLocaleDateString()}</div>
            <div><b>Lần đăng nhập cuối:</b> {profile.last_login ? new Date(profile.last_login).toLocaleString() : 'Chưa cập nhật'}</div>
            <div><b>Trạng thái:</b> {profile.status ? 'Hoạt động' : 'Bị khóa'}</div>
            <div><b>Xác thực email:</b> {profile.email_verified ? 'Đã xác thực' : 'Chưa xác thực'}</div>
            <div><b>Vai trò:</b> {profile.role}</div>
          </div>
          <div className="mt-6 text-center">
            <Button onClick={() => window.location.reload()}>Làm mới</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
