import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { FaChartBar, FaCalendarAlt, FaChartLine } from 'react-icons/fa';
import { HiTrendingUp, HiTrendingDown } from 'react-icons/hi';
import { FiMinus, FiActivity } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { menstrualCycleService, CycleStatistics, PeriodStatistics } from '../../../services/menstrualCycleService';
import { toast } from 'react-hot-toast';

interface CycleStatisticsProps {
  onRefresh?: () => void;
}

const CycleStatisticsComponent: React.FC<CycleStatisticsProps> = ({ onRefresh }) => {
  const [cycleStats, setCycleStats] = useState<CycleStatistics | null>(null);
  const [periodStats, setPeriodStats] = useState<PeriodStatistics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    try {
      setLoading(true);
      console.log('[CycleStatistics] Loading statistics...');
      
      // Load cycle statistics
      try {
        const cycleResponse = await menstrualCycleService.getCycleStatistics();
        console.log('[CycleStatistics] Cycle response:', cycleResponse);
        if (cycleResponse.success && cycleResponse.data) {
          setCycleStats(cycleResponse.data);
        } else {
          console.warn('[CycleStatistics] Cycle stats failed:', cycleResponse.message);
          setCycleStats(null);
        }
      } catch (cycleError) {
        console.error('[CycleStatistics] Cycle stats error:', cycleError);
        setCycleStats(null);
      }

      // Load period statistics  
      try {
        const periodResponse = await menstrualCycleService.getPeriodStatistics();
        console.log('[CycleStatistics] Period response:', periodResponse);
        if (periodResponse.success && periodResponse.data) {
          setPeriodStats(periodResponse.data);
        } else {
          console.warn('[CycleStatistics] Period stats failed:', periodResponse.message);
          setPeriodStats(null);
        }
      } catch (periodError) {
        console.error('[CycleStatistics] Period stats error:', periodError);
        setPeriodStats(null);
      }

    } catch (error) { 
      console.error('[CycleStatistics] General error:', error);
      toast.error('Lỗi khi tải thống kê');
    } finally {
      setLoading(false);
    }
  };

  const getRegularityColor = (regularity: string) => {
    switch (regularity) {
      case 'regular': return 'bg-blue-100 text-blue-800';
      case 'irregular': return 'bg-indigo-100 text-indigo-800';
      case 'insufficient_data': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRegularityText = (regularity: string) => {
    switch (regularity) {
      case 'regular': return 'Đều đặn';
      case 'irregular': return 'Không đều';
      case 'insufficient_data': return 'Chưa đủ dữ liệu';
      default: return 'Không xác định';
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'lengthening': return <HiTrendingUp className="h-4 w-4 text-orange-500" />;
      case 'shortening': return <HiTrendingDown className="h-4 w-4 text-blue-500" />;
      case 'stable': return <FiMinus className="h-4 w-4 text-green-500" />;
      default: return <FiMinus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'lengthening': return 'Có xu hướng dài hơn';
      case 'shortening': return 'Có xu hướng ngắn hơn';
      case 'stable': return 'Ổn định';
      default: return 'Không xác định';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Tabs defaultValue="cycle" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="cycle" className="flex items-center gap-2">
            <FiActivity className="h-4 w-4" />
            Thống Kê Chu Kì
          </TabsTrigger>
          <TabsTrigger value="period" className="flex items-center gap-2">
            <FaCalendarAlt className="h-4 w-4" />
            Thống Kê Kinh Nguyệt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cycle" className="space-y-6">
          {cycleStats ? (
            <>
              {/* Overview Cards */}
              <div className="grid md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {cycleStats?.average_cycle_length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Trung bình (ngày)</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">
                        {cycleStats?.shortest_cycle || 0} - {cycleStats?.longest_cycle || 0}
                      </p>
                      <p className="text-sm text-gray-600">Ngắn nhất - Dài nhất</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                                          <Badge className={getRegularityColor(cycleStats?.cycle_regularity || 'insufficient_data')}>
                      {getRegularityText(cycleStats?.cycle_regularity || 'insufficient_data')}
                    </Badge>
                      <p className="text-sm text-gray-600 mt-2">Độ đều đặn</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        {getTrendIcon(cycleStats?.trend || 'stable')}
                        <span className="text-sm font-medium">
                          {getTrendText(cycleStats?.trend || 'stable')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">Xu hướng</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Cycle Length Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaChartLine className="h-5 w-5 text-blue-600" />    
                    Xu Hướng Độ Dài Chu Kỳ
                  </CardTitle>
                  <CardDescription>
                    Biểu đồ theo dõi độ dài chu kỳ qua thời gian
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {cycleStats?.last_6_cycles && cycleStats.last_6_cycles.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={cycleStats.last_6_cycles.map((cycle, index) => ({
                          name: `Chu kì ${(cycleStats.total_cycles_tracked || 0) - index}`,
                          date: new Date(cycle.start_date).toLocaleDateString('vi-VN'),
                          length: cycle.length,
                          average: cycleStats.average_cycle_length
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            domain={['dataMin - 2', 'dataMax + 2']}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              `${value} ngày`, 
                              name === 'length' ? 'Độ dài chu kỳ' : 'Trung bình'
                            ]}
                            labelFormatter={(label) => `Chu kỳ: ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="length" 
                            stroke="#3b82f6" 
                            fill="#3b82f6" 
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="average" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FaChartLine className="text-4xl mx-auto mb-4 text-gray-300" />
                      <p>Chưa có đủ dữ liệu để hiển thị biểu đồ</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Detailed Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaChartBar className="h-5 w-5 text-blue-600" />    
                    6 Chu Kì Gần Nhất
                  </CardTitle>
                  <CardDescription>
                    Theo dõi {cycleStats?.tracking_period_months || 0} tháng • Tổng {cycleStats?.total_cycles_tracked || 0} chu kì
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cycleStats?.last_6_cycles?.map((cycle, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(cycle.start_date).toLocaleDateString('vi-VN')}</p>
                          <p className="text-sm text-gray-600">Chu kì #{(cycleStats?.total_cycles_tracked || 0) - index}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{cycle.length} ngày</p>
                          <p className="text-xs text-gray-500">
                            {cycle.length > (cycleStats?.average_cycle_length || 0) ? '+' : ''}
                            {(cycle.length - (cycleStats?.average_cycle_length || 0)).toFixed(1)} so với TB
                          </p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-gray-500">
                        Chưa có dữ liệu chu kì
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Health Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Đánh Giá Sức Khỏe</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {cycleStats?.cycle_regularity === 'regular' ? (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">✅ Chu kì đều đặn</h4>
                        <p className="text-sm text-blue-700">
                          Chu kì của bạn rất đều đặn, đây là dấu hiệu tốt của sức khỏe sinh sản.
                        </p>
                      </div>
                    ) : cycleStats?.cycle_regularity === 'irregular' ? (
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <h4 className="font-medium text-indigo-800 mb-2">⚠️ Chu kì không đều</h4>
                        <p className="text-sm text-indigo-700">
                          Chu kì của bạn có thể không đều do nhiều yếu tố như stress, thay đổi cân nặng, hoặc bệnh lý. 
                          Nên tham khảo ý kiến bác sĩ nếu tình trạng kéo dài.
                        </p>
                      </div>
                    ) : cycleStats?.cycle_regularity ? (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">📊 Cần thêm dữ liệu</h4>
                        <p className="text-sm text-blue-700">
                          Tiếp tục theo dõi ít nhất 3 chu kì để có đánh giá chính xác về độ đều đặn.
                        </p>
                      </div>
                    ) : null}

                    {cycleStats?.average_cycle_length && cycleStats.average_cycle_length < 21 && (
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <h4 className="font-medium text-indigo-800 mb-2">Chu kì ngắn</h4>
                        <p className="text-sm text-indigo-700">
                          Chu kì trung bình của bạn ngắn hơn bình thường (21-35 ngày). 
                          Nên tham khảo ý kiến bác sĩ phụ khoa.
                        </p>
                      </div>
                    )}

                    {cycleStats?.average_cycle_length && cycleStats.average_cycle_length > 35 && (
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <h4 className="font-medium text-indigo-800 mb-2">🐌 Chu kì dài</h4>
                        <p className="text-sm text-indigo-700">
                          Chu kì trung bình của bạn dài hơn bình thường (21-35 ngày). 
                          Nên tham khảo ý kiến bác sĩ phụ khoa.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FaChartBar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chưa có thống kê chu kì
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Cần ít nhất 2 chu kì để tạo thống kê
                  </p>
                  <div className="p-4 bg-blue-50 rounded-lg text-left">
                    <h4 className="font-medium text-blue-800 mb-2"> Hướng dẫn:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Sử dụng tab &quot;Ghi Nhận Chu Kì&quot; để thêm dữ liệu</li>
                      <li>• Ghi nhận các ngày có kinh để hệ thống tính toán chu kì</li>
                      <li>• Sau 2 chu kì hoàn chỉnh, thống kê sẽ xuất hiện</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="period" className="space-y-6">
          {periodStats ? (
            <>
              {/* Overview Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-blue-600">
                        {periodStats?.average_period_length || 0}
                      </p>
                      <p className="text-sm text-gray-600">Trung bình (ngày)</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-indigo-600">
                        {periodStats?.shortest_period || 0} - {periodStats?.longest_period || 0}
                      </p>
                      <p className="text-sm text-gray-600">Ngắn nhất - Dài nhất</p>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="text-center">
                                          <Badge className={getRegularityColor(periodStats?.period_regularity || 'insufficient_data')}>
                      {getRegularityText(periodStats?.period_regularity || 'insufficient_data')}
                    </Badge>
                      <p className="text-sm text-gray-600 mt-2">Độ đều đặn</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Period Length Trend Chart */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaChartLine className="h-5 w-5 text-pink-600" />    
                    Xu Hướng Độ Dài Kinh Nguyệt
                  </CardTitle>
                  <CardDescription>
                    Biểu đồ theo dõi độ dài kinh nguyệt qua thời gian
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {periodStats?.last_3_periods && periodStats.last_3_periods.length > 0 ? (
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={periodStats.last_3_periods.map((period, index) => ({
                          name: `Kì kinh ${(periodStats.total_periods_tracked || 0) - index}`,
                          date: new Date(period.start_date).toLocaleDateString('vi-VN'),
                          length: period.length,
                          average: periodStats.average_period_length
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="name" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                          />
                          <YAxis 
                            domain={['dataMin - 1', 'dataMax + 1']}
                            tick={{ fontSize: 12 }}
                          />
                          <Tooltip 
                            formatter={(value, name) => [
                              `${value} ngày`, 
                              name === 'length' ? 'Độ dài kinh nguyệt' : 'Trung bình'
                            ]}
                            labelFormatter={(label) => `Kì kinh: ${label}`}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="length" 
                            stroke="#ec4899" 
                            fill="#ec4899" 
                            fillOpacity={0.3}
                            strokeWidth={2}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="average" 
                            stroke="#ef4444" 
                            strokeWidth={2}
                            strokeDasharray="5 5"
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <FaChartLine className="text-4xl mx-auto mb-4 text-gray-300" />
                      <p>Chưa có đủ dữ liệu để hiển thị biểu đồ</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Periods */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FaCalendarAlt className="h-5 w-5 text-blue-600" />
                    3 Kì Kinh Gần Nhất
                  </CardTitle>
                  <CardDescription>
                    Tổng {periodStats?.total_periods_tracked || 0} kì kinh đã theo dõi
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {periodStats?.last_3_periods?.map((period, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{new Date(period.start_date).toLocaleDateString('vi-VN')}</p>
                          <p className="text-sm text-gray-600">Kì kinh #{(periodStats?.total_periods_tracked || 0) - index}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-blue-600">{period.length} ngày</p>
                          <p className="text-xs text-gray-500">
                            {period.length > (periodStats?.average_period_length || 0) ? '+' : ''}
                            {(period.length - (periodStats?.average_period_length || 0)).toFixed(1)} so với TB
                          </p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-4 text-gray-500">
                        Chưa có dữ liệu kì kinh
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Period Health Insights */}
              <Card>
                <CardHeader>
                  <CardTitle>Đánh Giá Sức Khỏe Kinh Nguyệt</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {periodStats?.average_period_length >= 3 && periodStats?.average_period_length <= 7 ? (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">✅ Thời gian kinh nguyệt bình thường</h4>
                        <p className="text-sm text-blue-700">
                          Thời gian kinh nguyệt của bạn trong khoảng bình thường (3-7 ngày).
                        </p>
                      </div>
                    ) : periodStats?.average_period_length ? (
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <h4 className="font-medium text-indigo-800 mb-2">⚠️ Thời gian kinh nguyệt bất thường</h4>
                        <p className="text-sm text-indigo-700">
                          Thời gian kinh nguyệt của bạn ngoài khoảng bình thường (3-7 ngày). 
                          Nên tham khảo ý kiến bác sĩ phụ khoa.
                        </p>
                      </div>
                    ) : null}

                    {periodStats?.period_regularity === 'regular' ? (
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-800 mb-2">✅ Kinh nguyệt đều đặn</h4>
                        <p className="text-sm text-blue-700">
                          Thời gian kinh nguyệt của bạn khá đều đặn, đây là dấu hiệu tốt.
                        </p>
                      </div>
                    ) : periodStats?.period_regularity === 'irregular' ? (
                      <div className="p-4 bg-indigo-50 rounded-lg">
                        <h4 className="font-medium text-indigo-800 mb-2">⚠️ Kinh nguyệt không đều</h4>
                        <p className="text-sm text-indigo-700">
                          Thời gian kinh nguyệt của bạn có thể thay đổi nhiều. 
                          Hãy theo dõi thêm và tham khảo ý kiến bác sĩ nếu cần.
                        </p>
                      </div>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-8">
                  <FaCalendarAlt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Chưa có thống kê kinh nguyệt
                  </h3>
                  <p className="text-gray-600 mb-4">
                    Cần ít nhất 1 chu kì để tạo thống kê
                  </p>
                  <div className="p-4 bg-blue-50 rounded-lg text-left">
                    <h4 className="font-medium text-blue-800 mb-2"> Hướng dẫn:</h4>
                    <ul className="text-sm text-blue-700 space-y-1">
                      <li>• Thêm ít nhất 1 chu kì với các ngày có kinh</li>
                      <li>• Chọn ngày bắt đầu và kết thúc kinh nguyệt</li>
                      <li>• Hệ thống sẽ tính thống kê độ dài và tần suất</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CycleStatisticsComponent; 