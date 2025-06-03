import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '../../contexts/AuthContext';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: string;
  status: boolean;
}

const UserProfilePage: React.FC = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (user && user.id && user.email && user.full_name && user.role && 'status' in user) {
      return user as UserProfile;
    }
    return null;
  });

  // Nếu sau này có API /profile thì có thể fetch ở đây
  // useEffect(() => { ... }, []);

  if (!profile) return <div className="text-center py-10">Không có thông tin người dùng.</div>;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Thông tin người dùng</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div><b>ID:</b> {profile.id}</div>
            <div><b>Email:</b> {profile.email}</div>
            <div><b>Họ tên:</b> {profile.full_name}</div>
            <div><b>Vai trò:</b> {profile.role}</div>
            <div><b>Trạng thái:</b> {profile.status ? 'Hoạt động' : 'Bị khóa'}</div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserProfilePage;
