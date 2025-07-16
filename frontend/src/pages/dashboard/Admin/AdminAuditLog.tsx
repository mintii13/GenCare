import React, { useCallback } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import usePaginatedResource from '@/hooks/usePaginatedResource';
import { analyticsService, AuditLogQuery } from '@/services/analyticsService';
import { AuditLog } from '@/types/audit';
import { format } from 'date-fns';

const AdminAuditLog: React.FC = () => {
  const apiService = useCallback((params: URLSearchParams) => {
    const query: AuditLogQuery = Object.fromEntries(params.entries());
    return analyticsService.getAuditLogs(query);
  }, []);

  const {
    data: logs,
    loading,
    pagination,
    handlePageChange,
    handleFilterChange,
    searchTerm,
    setSearchTerm,
  } = usePaginatedResource<AuditLog>({
    apiService,
    initialFilters: { page: 1, limit: 10, sort_by: 'timestamp', sort_order: 'desc' },
    searchParamName: 'user_id',
  });

  const actionColors: { [key: string]: string } = {
    create: 'bg-green-100 text-green-800',
    update: 'bg-yellow-100 text-yellow-800',
    delete: 'bg-red-100 text-red-800',
    login: 'bg-blue-100 text-blue-800',
    logout: 'bg-gray-100 text-gray-800',
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Nhật ký hệ thống</CardTitle>
          <CardDescription>
            Theo dõi các hành động quan trọng được thực hiện trong hệ thống.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <Input
              placeholder="Tìm kiếm theo ID người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
            <Select
              onValueChange={(value) => handleFilterChange('action', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Hành động" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="create">Tạo</SelectItem>
                <SelectItem value="update">Cập nhật</SelectItem>
                <SelectItem value="delete">Xóa</SelectItem>
                <SelectItem value="login">Đăng nhập</SelectItem>
                <SelectItem value="logout">Đăng xuất</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) => handleFilterChange('target_type', value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Đối tượng" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả</SelectItem>
                <SelectItem value="StiOrder">Đơn hàng STI</SelectItem>
                <SelectItem value="StiTest">Xét nghiệm STI</SelectItem>
                <SelectItem value="StiPackage">Gói STI</SelectItem>
                <SelectItem value="User">Người dùng</SelectItem>
                <SelectItem value="Appointment">Lịch hẹn</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) => handleFilterChange('sort_by', value)}
              defaultValue="timestamp"
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Sắp xếp theo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="timestamp">Thời gian</SelectItem>
                <SelectItem value="action">Hành động</SelectItem>
                <SelectItem value="target_type">Đối tượng</SelectItem>
              </SelectContent>
            </Select>
            <Select
              onValueChange={(value) => handleFilterChange('sort_order', value)}
              defaultValue="desc"
            >
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Thứ tự" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="desc">Mới nhất</SelectItem>
                <SelectItem value="asc">Cũ nhất</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Người dùng</TableHead>
                <TableHead>Hành động</TableHead>
                <TableHead>Đối tượng</TableHead>
                <TableHead>ID Đối tượng</TableHead>
                <TableHead>Thời gian</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Đang tải...
                  </TableCell>
                </TableRow>
              ) : logs.length > 0 ? (
                logs.map((log) => (
                  <TableRow key={log._id}>
                    <TableCell>{log.user?.full_name || log.user_id}</TableCell>
                    <TableCell>
                      <Badge className={actionColors[log.action] || 'bg-gray-200'}>
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell>{log.target_type}</TableCell>
                    <TableCell>{log.target_id}</TableCell>
                    <TableCell>
                      {format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    Không tìm thấy nhật ký nào.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <div className="mt-4">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.has_prev) {
                        handlePageChange(pagination.current_page - 1);
                      }
                    }}
                  />
                </PaginationItem>
                {[...Array(pagination.total_pages)].map((_, i) => (
                  <PaginationItem key={i}>
                    <PaginationLink
                      href="#"
                      isActive={pagination.current_page === i + 1}
                      onClick={(e) => {
                        e.preventDefault();
                        handlePageChange(i + 1);
                      }}
                    >
                      {i + 1}
                    </PaginationLink>
                  </PaginationItem>
                ))}
                <PaginationItem>
                  <PaginationNext
                    href="#"
                    onClick={(e) => {
                      e.preventDefault();
                      if (pagination.has_next) {
                        handlePageChange(pagination.current_page + 1);
                      }
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAuditLog; 