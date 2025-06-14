import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/Input";
import {
  Tabs,
  TabsList,
  TabsTrigger,
  TabsContent,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from 'react-hot-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface User {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  date_of_birth?: string;
  gender?: string;
  role: string;
  status: boolean;
  avatar?: string;
  registration_date: string;
  last_login?: string;
  email_verified: boolean;
}

interface PaginationInfo {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

interface RoleStats {
  customer: number;
  staff: number;
  consultant: number;
  [key: string]: number;
}

interface UserTableProps {
  users: User[];
  loading: boolean;
  onStatusChange: (userId: string, newStatus: boolean) => Promise<void>;
}

// Các tiêu đề cho từng loại role
const ROLE_TITLES = {
  customer: 'Danh sách khách hàng',
  staff: 'Danh sách nhân viên',
  consultant: 'Danh sách tư vấn viên'
} as const;

const UserTable: React.FC<UserTableProps> = ({ users, loading, onStatusChange }) => {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showStatusDialog, setShowStatusDialog] = useState(false);
  const [newStatus, setNewStatus] = useState(false);

  const handleStatusChange = async () => {
    if (selectedUser) {
      await onStatusChange(selectedUser.id, newStatus);
      setShowStatusDialog(false);
    }
  };

  if (loading) {
    return <div className="text-center py-4">Đang tải...</div>;
  }

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Người dùng</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Số điện thoại</TableHead>
            <TableHead>Ngày đăng ký</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Hành động</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user.id}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={user.avatar} alt={user.full_name} />
                    <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{user.full_name}</div>
                    <div className="text-sm text-gray-500">{user.role}</div>
                  </div>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>{user.phone || 'N/A'}</TableCell>
              <TableCell>
                {new Date(user.registration_date).toLocaleDateString('vi-VN')}
              </TableCell>
              <TableCell>
                <span className={`px-2 py-1 rounded text-sm ${
                  user.status
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {user.status ? 'Hoạt động' : 'Đã khóa'}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  variant={user.status ? "destructive" : "default"}
                  size="sm"
                  onClick={() => {
                    setSelectedUser(user);
                    setNewStatus(!user.status);
                    setShowStatusDialog(true);
                  }}
                >
                  {user.status ? 'Khóa' : 'Kích hoạt'}
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={showStatusDialog} onOpenChange={setShowStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {newStatus ? 'Kích hoạt tài khoản' : 'Khóa tài khoản'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {newStatus
                ? `Bạn có chắc chắn muốn kích hoạt tài khoản của ${selectedUser?.full_name}?`
                : `Bạn có chắc chắn muốn khóa tài khoản của ${selectedUser?.full_name}? Họ sẽ không thể đăng nhập cho đến khi tài khoản được kích hoạt lại.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleStatusChange}>
              Xác nhận
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const UserManagement: React.FC = () => {
  const { user } = useAuth();
  const [selectedRole, setSelectedRole] = useState('customer');
  const [users, setUsers] = useState<User[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY);
      if (!token) {
        toast.error('Phiên đăng nhập đã hết hạn');
        return;
      }

      let url = `${import.meta.env.VITE_API_URL}/profile/getAllUsers?page=${pagination.page}&limit=${pagination.limit}&role=${selectedRole}`;
      if (search) url += `&search=${search}`;
      if (statusFilter !== 'all') url += `&status=${statusFilter}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.success) {
        setUsers(data.data.users);
        setPagination(data.data.pagination);
      } else {
        toast.error(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      const token = localStorage.getItem(import.meta.env.VITE_AUTH_TOKEN_KEY);
      if (!token) {
        toast.error('Phiên đăng nhập đã hết hạn');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/profile/${userId}/status`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({ status: newStatus })
        }
      );

      const data = await response.json();
      if (data.success) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
        toast.success(data.message);
      } else {
        toast.error(data.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái tài khoản');
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [selectedRole, pagination.page, search, statusFilter]);

  const roleStats: RoleStats = {
    customer: users.filter(u => u.role === 'customer').length,
    staff: users.filter(u => u.role === 'staff').length,
    consultant: users.filter(u => u.role === 'consultant').length
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Quản lý người dùng</h1>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {Object.entries(roleStats).map(([role, count]) => (
          <Card key={role}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {role === 'customer' && 'Khách hàng'}
                {role === 'staff' && 'Nhân viên'}
                {role === 'consultant' && 'Tư vấn viên'}
              </CardTitle>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                className="h-4 w-4 text-primary"
              >
                {role === 'customer' && (
                  <>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                  </>
                )}
                {role === 'staff' && (
                  <>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </>
                )}
                {role === 'consultant' && (
                  <>
                    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <line x1="19" y1="8" x2="19" y2="14" />
                    <line x1="22" y1="11" x2="16" y2="11" />
                  </>
                )}
              </svg>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{count}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedRole} onValueChange={setSelectedRole} className="space-y-4">
        <TabsList>
          <TabsTrigger value="customer">Khách hàng</TabsTrigger>
          <TabsTrigger value="staff">Nhân viên</TabsTrigger>
          <TabsTrigger value="consultant">Tư vấn viên</TabsTrigger>
        </TabsList>

        {Object.entries(ROLE_TITLES).map(([role, title]) => (
          <TabsContent key={role} value={role}>
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl font-semibold">{title}</CardTitle>
                  {role !== 'customer' && (
                    <Button variant="default">
                      Thêm {role === 'staff' ? 'nhân viên' : 'tư vấn viên'} mới
                    </Button>
                  )}
                </div>
                <div className="flex gap-4 mt-4">
                  <div className="flex-1">
                    <Input
                      placeholder="Tìm kiếm theo tên hoặc email..."
                      value={search}
                      
                      onChange={(e) => setSearch(e.target.value)}
                    />
                  </div>
                  <Select
                    value={statusFilter}
                    onValueChange={setStatusFilter}
                  >
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Trạng thái" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả</SelectItem>
                      <SelectItem value="true">Đang hoạt động</SelectItem>
                      <SelectItem value="false">Đã khóa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <UserTable
                  users={users}
                  loading={loading}
                  onStatusChange={handleStatusChange}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default UserManagement;
