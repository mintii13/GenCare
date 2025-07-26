import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { 
  FaUsers, 
  FaVial, 
  FaBlog, 
  FaChartLine, 
  FaCalendarAlt, 
  FaShoppingCart, 
  FaCog, 
  FaPlus,
  FaEye,
  FaUserMd,
  FaBell,
  FaArrowUp,
  FaArrowDown,
  FaDownload,
  FaSync
} from 'react-icons/fa';
import { analyticsService } from '@/services/analyticsService';
import { toast } from 'react-hot-toast';

interface DashboardStats {
  totalUsers: number;
  todayAppointments: number;
  totalRevenue: number;
  newBlogs: number;
  pendingOrders: number;
  activeConsultants: number;
  userGrowth: number;
  revenueGrowth: number;
}

const AdminDashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    todayAppointments: 0,
    totalRevenue: 0,
    newBlogs: 0,
    pendingOrders: 0,
    activeConsultants: 0,
    userGrowth: 0,
    revenueGrowth: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchStats = async () => {
    setIsLoading(true);
    try {
      const revenueRes = await analyticsService.getTotalRevenue();
      // Mock other stats for now
      setStats({
        totalUsers: 1234,
        todayAppointments: 15,
        totalRevenue: revenueRes.data.total_revenue,
        newBlogs: 8,
        pendingOrders: 23,
        activeConsultants: 12,
        userGrowth: 8.5,
        revenueGrowth: 12.3
      });
    } catch (_error) {
      toast.error('Không thể tải dữ liệu thống kê.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Redirect if not authenticated or not an admin
  if (!isAuthenticated || user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  const handleRefreshStats = () => {
    fetchStats();
  };

  const managementCards = [
    {
      title: "Quản lý người dùng",
      description: "Xem và quản lý tài khoản người dùng, nhân viên và tư vấn viên",
      icon: FaUsers,
      link: "/admin/users",
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600",
      count: stats.totalUsers
    },
    {
      title: "Quản lý gói xét nghiệm",
      description: "Thêm, sửa, xóa các gói xét nghiệm và quản lý giá",
      icon: FaVial,
      link: "/admin/test-packages",
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600",
      count: 45
    },
    {
      title: "Quản lý bài viết",
      description: "Quản lý nội dung blog, kiểm duyệt và xuất bản bài viết",
      icon: FaBlog,
      link: "/admin/blogs",
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600",
      count: stats.newBlogs
    },
    {
      title: "Thống kê doanh thu",
      description: "Xem báo cáo doanh thu từ dịch vụ xét nghiệm và tư vấn",
      icon: FaChartLine,
      link: "/admin/revenue",
      color: "bg-yellow-500",
      bgColor: "bg-yellow-50",
      textColor: "text-yellow-600",
      count: null
    },
    {
      title: "Quản lý lịch hẹn",
      description: "Theo dõi và quản lý lịch hẹn tư vấn và xét nghiệm",
      icon: FaCalendarAlt,
      link: "/admin/appointments",
      color: "bg-indigo-500",
      bgColor: "bg-indigo-50",
      textColor: "text-indigo-600",
      count: stats.todayAppointments
    },
    {
      title: "Quản lý đơn hàng STI",
      description: "Quản lý và theo dõi đơn hàng xét nghiệm STI của khách hàng",
      icon: FaShoppingCart,
      link: "/admin/sti-orders",
      color: "bg-red-500",
      bgColor: "bg-red-50",
      textColor: "text-red-600",
      count: stats.pendingOrders
    }
  ];

  const quickActions = [
    { title: "Thêm người dùng mới", icon: FaPlus, link: "/admin/users/new", color: "bg-blue-500" },
    { title: "Tạo bài viết", icon: FaBlog, link: "/admin/blogs/new", color: "bg-purple-500" },
    { title: "Xem báo cáo", icon: FaEye, link: "/admin/reports", color: "bg-green-500" },
    { title: "Cài đặt hệ thống", icon: FaCog, link: "/admin/settings", color: "bg-gray-500" }
  ];

  const statsCards = [
    {
      title: "Tổng số người dùng",
      value: stats.totalUsers.toLocaleString(),
      growth: stats.userGrowth,
      icon: FaUsers,
      color: "blue"
    },
    {
      title: "Lịch hẹn hôm nay",
      value: stats.todayAppointments.toString(),
      growth: 5.2,
      icon: FaCalendarAlt,
      color: "green"
    },
    {
      title: "Doanh thu tháng này",
      value: `${stats.totalRevenue.toLocaleString()} VND`,
      growth: stats.revenueGrowth,
      icon: FaChartLine,
      color: "purple"
    },
    {
      title: "Chuyên gia hoạt động",
      value: stats.activeConsultants.toString(),
      growth: 2.1,
      icon: FaUserMd,
      color: "indigo"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Quản Trị Viên</h1>
            <p className="text-gray-600">Chào mừng trở lại, {user?.full_name}!</p>
          </div>
          
          <div className="flex items-center space-x-4 mt-4 lg:mt-0">
            <button
              onClick={handleRefreshStats}
              disabled={isLoading}
              className="flex items-center px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
                             <FaSync className={`mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
            
            <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
              <FaDownload className="mr-2" />
              Xuất báo cáo
            </button>
            
            <div className="relative">
              <FaBell className="text-gray-400 w-6 h-6 cursor-pointer hover:text-gray-600" />
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                3
              </span>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {statsCards.map((stat, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                  <div className="flex items-center mt-2">
                    {stat.growth >= 0 ? (
                      <FaArrowUp className="text-green-500 w-3 h-3 mr-1" />
                    ) : (
                      <FaArrowDown className="text-red-500 w-3 h-3 mr-1" />
                    )}
                    <span className={`text-sm font-medium ${stat.growth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {Math.abs(stat.growth)}%
                    </span>
                    <span className="text-gray-500 text-sm ml-1">so với tháng trước</span>
                  </div>
                </div>
                <div className={`p-3 rounded-lg bg-${stat.color}-50`}>
                  <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Thao tác nhanh</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map((action, index) => (
              <Link
                key={index}
                to={action.link}
                className="flex flex-col items-center p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:bg-gray-50 transition-all group"
              >
                <div className={`p-3 rounded-lg ${action.color} mb-3 group-hover:scale-110 transition-transform`}>
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">{action.title}</span>
              </Link>
            ))}
          </div>
        </div>

        {/* Management Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {managementCards.map((card, index) => (
            <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden group hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${card.bgColor}`}>
                    <card.icon className={`w-6 h-6 ${card.textColor}`} />
                  </div>
                  {card.count && (
                    <span className="text-sm font-medium text-gray-500">
                      {card.count} mục
                    </span>
                  )}
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{card.title}</h3>
                <p className="text-gray-600 text-sm mb-4">{card.description}</p>
                
                <Link
                  to={card.link}
                  className={`inline-flex items-center ${card.textColor} hover:opacity-80 font-medium text-sm group-hover:translate-x-1 transition-transform`}
                >
                  Xem chi tiết
                  <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Activities */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Orders */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Đơn hàng gần đây</h3>
              <Link to="/admin/sti-orders" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { id: "STI001", customer: "Nguyễn Văn A", amount: "1.200.000", status: "Hoàn thành" },
                { id: "STI002", customer: "Trần Thị B", amount: "800.000", status: "Đang xử lý" },
                { id: "STI003", customer: "Lê Văn C", amount: "1.500.000", status: "Chờ thanh toán" }
              ].map((order, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div>
                    <p className="font-medium text-gray-900">#{order.id}</p>
                    <p className="text-sm text-gray-600">{order.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900">{order.amount} VND</p>
                    <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                      order.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
                      order.status === 'Đang xử lý' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Appointments */}
          <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Lịch hẹn hôm nay</h3>
              <Link to="/admin/appointments" className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                Xem tất cả
              </Link>
            </div>
            <div className="space-y-3">
              {[
                { time: "09:00", customer: "Nguyễn Thị D", consultant: "BS. Trần Văn E", status: "Xác nhận" },
                { time: "10:30", customer: "Lê Văn F", consultant: "BS. Hoàng Thị G", status: "Chờ xác nhận" },
                { time: "14:00", customer: "Phạm Văn H", consultant: "BS. Nguyễn Văn I", status: "Hoàn thành" }
              ].map((appointment, index) => (
                <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
                      <FaCalendarAlt className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{appointment.time}</p>
                      <p className="text-sm text-gray-600">{appointment.customer}</p>
                      <p className="text-xs text-gray-500">{appointment.consultant}</p>
                    </div>
                  </div>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full ${
                    appointment.status === 'Hoàn thành' ? 'bg-green-100 text-green-800' :
                    appointment.status === 'Xác nhận' ? 'bg-blue-100 text-blue-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;