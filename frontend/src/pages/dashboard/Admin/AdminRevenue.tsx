import React, { useEffect, useState } from 'react';
import { analyticsService } from '@/services/analyticsService';
import { FaChartLine } from 'react-icons/fa';

const AdminRevenue: React.FC = () => {
  const [totalRevenue, setTotalRevenue] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRevenue = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await analyticsService.getTotalRevenue();
        setTotalRevenue(res.data?.total_revenue || 0);
      } catch (err) {
        setError('Không thể tải dữ liệu doanh thu.');
      } finally {
        setLoading(false);
      }
    };
    fetchRevenue();
  }, []);

  return (
    <div className="max-w-4xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <FaChartLine className="text-blue-600" /> Thống kê doanh thu
      </h1>
      {loading ? (
        <div className="text-center text-gray-500 py-10">Đang tải dữ liệu...</div>
      ) : error ? (
        <div className="text-center text-red-500 py-10">{error}</div>
      ) : (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="text-3xl font-bold text-green-700 mb-2">
            {totalRevenue.toLocaleString('vi-VN')} VNĐ
          </div>
          <div className="text-gray-600 mb-6">Tổng doanh thu từ các đơn hàng xét nghiệm đã hoàn thành và thanh toán</div>
          <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg border border-dashed border-gray-200">
            <span className="text-gray-400">[Biểu đồ doanh thu sẽ hiển thị ở đây]</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminRevenue; 