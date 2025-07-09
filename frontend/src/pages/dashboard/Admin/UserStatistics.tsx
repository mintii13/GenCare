import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  FaUsers, 
  FaUserCheck, 
  FaUserTimes, 
  FaUserShield,
  FaChartLine,
  FaSync
} from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { UserManagementService, UserStatistics } from '@/services/userManagementService';

const UserStatisticsPage: React.FC = () => {
  const [statistics, setStatistics] = useState<UserStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStatistics = async () => {
    try {
      setLoading(true);
      const response = await UserManagementService.getUserStatistics();
      
      if (response.success && response.data) {
        setStatistics(response.data);
      } else {
        toast.error(response.message || 'Không thể tải thống kê');
      }
    } catch (error) {
      console.error('Error fetching user statistics:', error);
      toast.error('Có lỗi xảy ra khi tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatistics();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center h-64">
          <div className="text-lg">Đang tải thống kê...</div>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center justify-center h-64">
          <p className="text-lg text-gray-600 mb-4">Không thể tải thống kê người dùng</p>
          <Button onClick={fetchStatistics}>
            <FaSync className="mr-2" />
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  const formatNumber = (num: number): string => {
    return new Intl.NumberFormat('vi-VN').format(num);
  };

  const calculatePercentage = (part: number, total: number): string => {
    if (total === 0) return '0';
    return ((part / total) * 100).toFixed(1);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Thống kê người dùng</h1>
        <Button onClick={fetchStatistics} variant="outline">
          <FaSync className="mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng người dùng</CardTitle>
            <FaUsers className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatNumber(statistics.total_users)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Tất cả tài khoản trong hệ thống
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đang hoạt động</CardTitle>
            <FaUserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatNumber(statistics.active_users)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {calculatePercentage(statistics.active_users, statistics.total_users)}% 
              tổng số người dùng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Đã khóa</CardTitle>
            <FaUserTimes className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatNumber(statistics.inactive_users)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {calculatePercentage(statistics.inactive_users, statistics.total_users)}% 
              tổng số người dùng
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Email đã xác thực</CardTitle>
            <FaUserShield className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {formatNumber(statistics.verified_users)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {calculatePercentage(statistics.verified_users, statistics.total_users)}% 
              đã xác thực email
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Role Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FaUsers className="mr-2" />
              Phân bố theo vai trò
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                  <span>Khách hàng</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">{formatNumber(statistics.by_role.customer)}</span>
                  <Badge variant="secondary">
                    {calculatePercentage(statistics.by_role.customer, statistics.total_users)}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <span>Tư vấn viên</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">{formatNumber(statistics.by_role.consultant)}</span>
                  <Badge variant="secondary">
                    {calculatePercentage(statistics.by_role.consultant, statistics.total_users)}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <span>Nhân viên</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">{formatNumber(statistics.by_role.staff)}</span>
                  <Badge variant="secondary">
                    {calculatePercentage(statistics.by_role.staff, statistics.total_users)}%
                  </Badge>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <span>Quản trị viên</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="font-bold">{formatNumber(statistics.by_role.admin)}</span>
                  <Badge variant="secondary">
                    {calculatePercentage(statistics.by_role.admin, statistics.total_users)}%
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <FaChartLine className="mr-2" />
              Đăng ký gần đây
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary">
                  {formatNumber(statistics.recent_registrations.total)}
                </div>
                <p className="text-sm text-muted-foreground">
                  Đăng ký trong {statistics.recent_registrations.period}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-lg font-semibold text-green-600">
                    {formatNumber(statistics.verified_users)}
                  </div>
                  <div className="text-sm text-green-600">Đã xác thực</div>
                </div>
                
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-lg font-semibold text-orange-600">
                    {formatNumber(statistics.unverified_users)}
                  </div>
                  <div className="text-sm text-orange-600">Chưa xác thực</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Statistics */}
      <Card>
        <CardHeader>
          <CardTitle>Tổng quan chi tiết</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">Trạng thái tài khoản</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Hoạt động:</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatNumber(statistics.active_users)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Đã khóa:</span>
                  <span className="text-sm font-medium text-red-600">
                    {formatNumber(statistics.inactive_users)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">Xác thực email</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Đã xác thực:</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatNumber(statistics.verified_users)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Chưa xác thực:</span>
                  <span className="text-sm font-medium text-orange-600">
                    {formatNumber(statistics.unverified_users)}
                  </span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <h4 className="font-semibold text-gray-700">Tổng số vai trò</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-sm">Khách hàng:</span>
                  <span className="text-sm font-medium">{formatNumber(statistics.by_role.customer)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Nhân viên hệ thống:</span>
                  <span className="text-sm font-medium">
                    {formatNumber(statistics.by_role.staff + statistics.by_role.consultant + statistics.by_role.admin)}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserStatisticsPage; 