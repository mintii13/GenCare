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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../../../components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FaEye, FaEdit, FaTrash, FaPlus, FaUser, FaMale, FaFemale } from 'react-icons/fa';
import { UserManagementService, UserData, CreateUserData, UpdateUserData } from '@/services/userManagementService';
import { analyticsService } from '@/services/analyticsService';
import { any } from 'zod';
import { SpecializationType } from '../../../../../backend/src/models/Consultant';

const AUTH_TOKEN_KEY = "gencare_auth_token";

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
  users: UserData[];
  loading: boolean;
  onStatusChange: (userId: string, newStatus: boolean) => Promise<void>;
  onViewUser: (user: UserData) => void;
  onEditUser: (user: UserData) => void;
  onDeleteUser: (user: UserData) => void;
}

// Các tiêu đề cho từng loại role
const ROLE_TITLES = {
  customer: 'Danh sách khách hàng',
  staff: 'Danh sách nhân viên',
  consultant: 'Danh sách tư vấn viên'
} as const;

const SPECIALIZATION_LABELS: Record<SpecializationType, string> = {
  [SpecializationType.General]: 'Nam Phụ khoa',
  [SpecializationType.SexualHealth]: 'Sức khỏe sinh sản',
};
// Create User Modal Component
interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  role: 'staff' | 'consultant';
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({ isOpen, onClose, onSuccess, role }) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState<CreateUserData>({
    email: '',
    password: '',
    full_name: '',
    phone: undefined,
    date_of_birth: undefined,
    gender: undefined,
    role: role,
    // Staff fields
    department: undefined,
    hire_date: undefined,
    // Consultant fields
    specialization: undefined,
    qualifications: undefined,
    experience_years: undefined
  });
  
  // Debug logging when modal opens or role changes
  React.useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, role: role }));
    }
  }, [isOpen, role]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Client-side validation
    const errors: string[] = [];
    
    if (!formData.email.trim()) errors.push('Email là bắt buộc');
    if (!formData.password) errors.push('Mật khẩu là bắt buộc');
    if (!formData.full_name.trim()) errors.push('Họ và tên là bắt buộc');
    
    // Date validation - only validate if provided
    if (formData.date_of_birth && formData.date_of_birth.trim()) {
      const dobDate = new Date(formData.date_of_birth);
      if (isNaN(dobDate.getTime())) {
        errors.push('Ngày sinh không hợp lệ');
      } else {
        // Age validation
        const now = new Date();
        const age = now.getFullYear() - dobDate.getFullYear();
        if (age < 13 || age > 100) {
          errors.push('Tuổi phải từ 13-100');
        }
      }
    }
    
    if (role === 'staff') {
      if (!formData.department?.trim()) errors.push('Phòng ban là bắt buộc');
      if (!formData.hire_date?.trim()) errors.push('Ngày bắt đầu làm việc là bắt buộc');
      else {
        const hireDateObj = new Date(formData.hire_date);
        if (isNaN(hireDateObj.getTime())) {
          errors.push('Ngày bắt đầu làm việc không hợp lệ');
        }
      }
    } else if (role === 'consultant') {
      if (!formData.specialization?.trim()) errors.push('Chuyên môn là bắt buộc');
      if (!formData.qualifications?.trim()) errors.push('Bằng cấp/Chứng chỉ là bắt buộc');
      if (!formData.experience_years || formData.experience_years <= 0) errors.push('Số năm kinh nghiệm phải lớn hơn 0');
    }

    
    if (errors.length > 0) {
      toast.error(errors.join(', '));
      setLoading(false);
      return;
    }

    try {
      // Clean data before sending - Include role-specific fields
      const cleanData: any = {
        email: formData.email.trim(),
        password: formData.password,
        full_name: formData.full_name.trim(),
        role: formData.role
      };

      // Optional basic fields - only if they have meaningful values
      if (formData.phone?.trim()) {
        cleanData.phone = formData.phone.trim();
      }
      if (formData.date_of_birth?.trim()) {
        cleanData.date_of_birth = formData.date_of_birth.trim();
      }
      if (formData.gender) {
        cleanData.gender = formData.gender;
      }

      // Role-specific fields - REQUIRED fields must be included
      if (role === 'staff') {
        // Required for Staff model
        cleanData.department = formData.department?.trim();
        cleanData.hire_date = formData.hire_date?.trim();
      } else if (role === 'consultant') {
        // Required for Consultant model
        cleanData.specialization = formData.specialization?.trim();
        cleanData.qualifications = formData.qualifications?.trim();
        cleanData.experience_years = formData.experience_years;
      }

      
      
      const response = await UserManagementService.createUser(cleanData);
      
      
      if (response.success) {
        toast.success(`Tạo ${role === 'staff' ? 'nhân viên' : 'tư vấn viên'} thành công! Email đã được xác thực tự động.`);
        onSuccess();
        onClose();
        setFormData({
          email: '',
          password: '',
          full_name: '',
          phone: undefined,
          date_of_birth: undefined,
          gender: undefined,
          role: role,
          // Staff fields
          department: undefined,
          hire_date: undefined,
          // Consultant fields
          specialization: undefined,
          qualifications: undefined,
          experience_years: undefined
        });
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
      } 
    } catch (error: any) {
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.errors?.join(', ') || 
                          'Không thể tạo tài khoản mới';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="shrink-0">
          <DialogTitle>
            Tạo {role === 'staff' ? 'nhân viên' : 'tư vấn viên'} mới
          </DialogTitle>
          <DialogDescription>
            Nhập thông tin để tạo tài khoản mới
            <div className="text-xs text-blue-600 mt-1 font-medium">
              ℹ️ Tài khoản được tạo bởi admin sẽ tự động xác thực email
            </div>

          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2">
          <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <Label htmlFor="full_name">Họ và tên *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
              required
            />
          </div>

          <div>
            <Label htmlFor="password">Mật khẩu *</Label>
            <Input
              id="password"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
              required
              minLength={6}
              placeholder="Tối thiểu 6 ký tự"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="phone">Số điện thoại <span className="text-gray-400">(tuỳ chọn)</span></Label>
              <Input
                id="phone"
                value={formData.phone || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value || undefined }))}
                placeholder="Nhập số điện thoại"
              />
            </div>

            <div>
              <Label htmlFor="date_of_birth">Ngày sinh <span className="text-gray-400">(tuỳ chọn)</span></Label>
              <Input
                id="date_of_birth"
                type="date"
                value={formData.date_of_birth || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value || undefined }))}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="gender">Giới tính <span className="text-gray-400">(tuỳ chọn)</span></Label>
            <Select
              value={formData.gender}
              onValueChange={(value: 'male' | 'female' | 'other') => setFormData(prev => ({ ...prev, gender: value }))}
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
          </div>

          {/* Staff-specific fields */}
          {role === 'staff' && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="department">Phòng ban *</Label>
                  <Select
                    value={formData.department || ''}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Chọn phòng ban" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Hành chính</SelectItem>
                      <SelectItem value="hr">Nhân sự</SelectItem>
                      <SelectItem value="finance">Tài chính</SelectItem>
                      <SelectItem value="it">Công nghệ thông tin</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="medical">Y tế</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="hire_date">Ngày bắt đầu làm việc *</Label>
                  <Input
                    id="hire_date"
                    type="date"
                    value={formData.hire_date || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, hire_date: e.target.value || undefined }))}
                  />
                </div>
              </div>
            </>
          )}

          {/* Consultant-specific fields */}
          {role === 'consultant' && (
            <>
              <div>
                <Label htmlFor="specialization">Chuyên môn *</Label>
                <Select
                  value={formData.specialization || ''}
                  onValueChange={(value) =>
                    setFormData((prev) => ({ ...prev, specialization: value as SpecializationType }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Chọn chuyên môn" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={SpecializationType.General}>
                      {SPECIALIZATION_LABELS[SpecializationType.General]}
                    </SelectItem>
                    <SelectItem value={SpecializationType.SexualHealth}>
                      {SPECIALIZATION_LABELS[SpecializationType.SexualHealth]}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="qualifications">Bằng cấp/Chứng chỉ *</Label>
                  <Input
                    id="qualifications"
                    value={formData.qualifications || ''}
                    onChange={(e) => setFormData(prev => ({ ...prev, qualifications: e.target.value || undefined }))}
                    placeholder="VD: Bác sĩ chuyên khoa I..."
                  />
                </div>

                <div>
                  <Label htmlFor="experience_years">Số năm kinh nghiệm *</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    min="0"
                    max="50"
                    value={formData.experience_years || ''}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      experience_years: e.target.value ? parseInt(e.target.value) : undefined 
                    }))}
                    placeholder="Năm"
                  />
                </div>
              </div>
            </>
          )}

            <DialogFooter className="shrink-0 mt-3 gap-2">
              <Button type="button" variant="outline" onClick={onClose} size="sm">
                Hủy
              </Button>
              <Button type="submit" disabled={loading} size="sm">
                {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Edit User Modal Component
interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  user: UserData | null;
}

const EditUserModal: React.FC<EditUserModalProps> = ({ isOpen, onClose, onSuccess, user }) => {
  const [formData, setFormData] = useState<UpdateUserData>({
    full_name: '',
    phone: '',
    date_of_birth: '',
    gender: undefined
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        date_of_birth: user.date_of_birth || '',
        gender: user.gender || undefined
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      const response = await UserManagementService.updateUser(user.id, formData);
      if (response.success) {
        toast.success('Cập nhật thông tin thành công!');
        onSuccess();
        onClose();
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Không thể cập nhật thông tin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Chỉnh sửa thông tin người dùng</DialogTitle>
          <DialogDescription>
            Cập nhật thông tin cho {user?.full_name}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="edit_full_name">Họ và tên</Label>
            <Input
              id="edit_full_name"
              value={formData.full_name}
              onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit_phone">Số điện thoại</Label>
            <Input
              id="edit_phone"
              value={formData.phone}
              onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit_date_of_birth">Ngày sinh</Label>
            <Input
              id="edit_date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={(e) => setFormData(prev => ({ ...prev, date_of_birth: e.target.value }))}
            />
          </div>

          <div>
            <Label htmlFor="edit_gender">Giới tính</Label>
            <Select
              value={formData.gender}
              onValueChange={(value: 'male' | 'female' | 'other') => setFormData(prev => ({ ...prev, gender: value }))}
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
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Hủy
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Đang cập nhật...' : 'Cập nhật'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// User Detail Modal Component
interface UserDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserData | null;
}

const UserDetailModal: React.FC<UserDetailModalProps> = ({ isOpen, onClose, user }) => {
  const [revenue, setRevenue] = useState<number | null>(null);
  const [loadingRevenue, setLoadingRevenue] = useState(false);

  useEffect(() => {
    if (isOpen && user && user.role === 'customer') {
      const fetchRevenue = async () => {
        setLoadingRevenue(true);
        try {

              const response = await analyticsService.getRevenueByCustomer(user.id);

 
          if (response.success) {
            setRevenue(response.data?.total_revenue || 0);
          }
        } catch (error) {
          console.error("Failed to fetch customer revenue", error);
        } finally {
          setLoadingRevenue(false);
        }
      };
      fetchRevenue();
    } else {
      setRevenue(null);
    }
  }, [isOpen, user]);

  if (!isOpen || !user) {
    return null;
  }

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('vi-VN');
    } catch {
      return 'N/A';
    }
  };

  const getRoleDisplay = (role: string) => {
    const roleMap = {
      customer: 'Khách hàng',
      staff: 'Nhân viên', 
      consultant: 'Tư vấn viên',
      admin: 'Quản trị viên'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getGenderDisplay = (gender?: string) => {
    const genderMap = {
      male: 'Nam',
      female: 'Nữ',
      other: 'Khác'
    };
    return gender ? genderMap[gender as keyof typeof genderMap] || 'Chưa cập nhật' : 'Chưa cập nhật';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Thông tin chi tiết</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Avatar và thông tin cơ bản */}
          <div className="flex items-center space-x-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={user.avatar} alt={user.full_name} />
              <AvatarFallback className="text-lg">{user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <h3 className="text-lg font-semibold">{user.full_name}</h3>
              <Badge variant={user.role === 'customer' ? 'default' : user.role === 'staff' ? 'secondary' : 'outline'}>
                {getRoleDisplay(user.role)}
              </Badge>
            </div>
          </div>

          {/* Thông tin liên hệ */}
          <div className="space-y-3">
            <div>
              <Label className="text-sm font-medium text-gray-600">Email</Label>
              <p className="text-sm">{user.email}</p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Số điện thoại</Label>
              <p className="text-sm">{user.phone || 'Chưa cập nhật'}</p>
            </div>
            
            <div className="flex flex-col">
              <span className="text-sm text-gray-500">Ngày sinh</span>
              <span className="font-medium">{user.date_of_birth ? formatDate(user.date_of_birth) : 'N/A'}</span>
            </div>

            {user.role === 'customer' && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-semibold text-lg mb-2">Thông tin mua hàng</h4>
                <div className="flex items-center">
                  <span className="text-sm text-gray-500">Tổng chi tiêu:</span>
                  <span className="font-medium ml-2">
                    {loadingRevenue ? 'Đang tải...' : revenue !== null ? `${revenue.toLocaleString()} VND` : 'Không có dữ liệu'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Thông tin tài khoản */}
          <div className="space-y-3 border-t pt-4">
            <div>
              <Label className="text-sm font-medium text-gray-600">Trạng thái tài khoản</Label>
              <p>
                <Badge variant={user.status ? 'default' : 'destructive'}>
                  {user.status ? 'Đang hoạt động' : 'Đã khóa'}
                </Badge>
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Email đã xác thực</Label>
              <p>
                <Badge variant={user.email_verified ? 'default' : 'secondary'}>
                  {user.email_verified ? 'Đã xác thực' : 'Chưa xác thực'}
                </Badge>
              </p>
            </div>
            
            <div>
              <Label className="text-sm font-medium text-gray-600">Ngày đăng ký</Label>
              <p className="text-sm">{formatDate(user.registration_date)}</p>
            </div>
            
            {user.last_login && (
              <div>
                <Label className="text-sm font-medium text-gray-600">Đăng nhập lần cuối</Label>
                <p className="text-sm">{formatDate(user.last_login)}</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

const UserTable: React.FC<UserTableProps> = ({ 
  users, 
  loading, 
  onStatusChange, 
  onViewUser, 
  onEditUser, 
  onDeleteUser 
}) => {
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
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
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewUser(user)}
                    title="Xem chi tiết"
                  >
                    <FaEye className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEditUser(user)}
                    title="Chỉnh sửa"
                  >
                    <FaEdit className="w-4 h-4" />
                  </Button>
                  
                  <Button
                    variant={user.status ? "destructive" : "default"}
                    size="sm"
                    onClick={() => {
                      setSelectedUser(user);
                      setNewStatus(!user.status);
                      setShowStatusDialog(true);
                    }}
                    title={user.status ? 'Khóa tài khoản' : 'Kích hoạt tài khoản'}
                  >
                    {user.status ? 'Khóa' : 'Kích hoạt'}
                  </Button>
                  
                  {user.role !== 'customer' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDeleteUser(user)}
                      title="Xóa tài khoản"
                      className="text-red-600 hover:text-red-700"
                    >
                      <FaTrash className="w-4 h-4" />
                    </Button>
                  )}
                </div>
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
  const [users, setUsers] = useState<UserData[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    totalPages: 1,
    limit: 10
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createModalRole, setCreateModalRole] = useState<'staff' | 'consultant'>('staff');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await UserManagementService.getUsers({
        page: pagination.page,
        limit: pagination.limit,
        role: selectedRole as any,
        search,
        status: statusFilter === 'all' ? undefined : statusFilter === 'true'
      });

      if (response.success && response.data) {
        setUsers(response.data.users);
        setPagination(response.data.pagination);
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (userId: string, newStatus: boolean) => {
    try {
      const response = await UserManagementService.updateUserStatus(userId, newStatus);
      if (response.success) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, status: newStatus } : u
        ));
        toast.success(response.message || 'Cập nhật trạng thái thành công');
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Không thể cập nhật trạng thái tài khoản');
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      const response = await UserManagementService.deleteUser(selectedUser.id);
      if (response.success) {
        setUsers(users.filter(u => u.id !== selectedUser.id));
        toast.success('Xóa tài khoản thành công');
        setShowDeleteDialog(false);
        setSelectedUser(null);
      } else {
        toast.error(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      toast.error('Không thể xóa tài khoản');
    }
  };

  const handleViewUser = (user: UserData) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleEditUser = (user: UserData) => {
    setSelectedUser(user);
    setShowEditModal(true);
  };

  const handleDeleteUserConfirm = (user: UserData) => {
    setSelectedUser(user);
    setShowDeleteDialog(true);
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
                    <Button variant="default" onClick={() => {
                      setCreateModalRole(role as 'staff' | 'consultant');
                      setShowCreateModal(true);
                    }}>
                      <FaPlus className="mr-2" /> Thêm {role === 'staff' ? 'nhân viên' : 'tư vấn viên'} mới
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
                  onViewUser={handleViewUser}
                  onEditUser={handleEditUser}
                  onDeleteUser={handleDeleteUserConfirm}
                />
                
                {/* Pagination Controls */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6">
                    <div className="text-sm text-gray-500">
                      Hiển thị {(pagination.page - 1) * pagination.limit + 1}-{Math.min(pagination.page * pagination.limit, pagination.total)} của {pagination.total} người dùng
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                        disabled={pagination.page === 1}
                      >
                        Trước
                      </Button>
                      
                      <div className="flex space-x-1">
                        {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                          let pageNum;
                          if (pagination.totalPages <= 5) {
                            pageNum = i + 1;
                          } else if (pagination.page <= 3) {
                            pageNum = i + 1;
                          } else if (pagination.page >= pagination.totalPages - 2) {
                            pageNum = pagination.totalPages - 4 + i;
                          } else {
                            pageNum = pagination.page - 2 + i;
                          }
                          
                          return (
                            <Button
                              key={pageNum}
                              variant={pagination.page === pageNum ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPagination(prev => ({ ...prev, page: pageNum }))}
                            >
                              {pageNum}
                            </Button>
                          );
                        })}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                        disabled={pagination.page === pagination.totalPages}
                      >
                        Sau
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>

      <CreateUserModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
        }}
        onSuccess={() => {
          fetchUsers();
        }}
        role={createModalRole}
      />

      <EditUserModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={fetchUsers}
        user={selectedUser}
      />

      <UserDetailModal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        user={selectedUser}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa tài khoản</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa tài khoản của {selectedUser?.full_name}? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteUser}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserManagement;