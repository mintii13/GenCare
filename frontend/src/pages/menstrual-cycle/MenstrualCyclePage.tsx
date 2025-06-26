import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { FaCalendarAlt, FaChartLine, FaCog, FaPlus, FaBell, FaHeart, FaTint, FaBullseye, FaLightbulb } from 'react-icons/fa';
import { MdShowChart, MdToday, MdInsights } from 'react-icons/md';
import { HiSparkles, HiLightningBolt } from 'react-icons/hi';
import { menstrualCycleService, TodayStatus, CycleData } from '../../services/menstrualCycleService';
import { useAuth } from '../../contexts/AuthContext';
import CycleDashboard from './components/CycleDashboard.tsx';
import CycleCalendar from './components/CycleCalendar.tsx';
import CycleStatistics from './components/CycleStatistics.tsx';
import PeriodLogger from './components/PeriodLogger.tsx';
import NotificationSettings from './components/NotificationSettings.tsx';
import { toast } from 'react-hot-toast';

const MenstrualCyclePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('main');
  const [todayStatus, setTodayStatus] = useState<TodayStatus | null>(null);
  const [cycles, setCycles] = useState<CycleData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPeriodLogger, setShowPeriodLogger] = useState(false);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [todayResponse, cyclesResponse] = await Promise.all([
        menstrualCycleService.getTodayStatus(),
        menstrualCycleService.getCycles()
      ]);

      if (todayResponse.success && todayResponse.data) {
        setTodayStatus(todayResponse.data);
      }

      if (cyclesResponse.success && cyclesResponse.data) {
        setCycles(cyclesResponse.data);
      }
    } catch (error) {

      toast.error('Lỗi khi tải dữ liệu chu kì');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (pregnancyChance: string) => {
    switch (pregnancyChance) {
      case 'high': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-indigo-100 text-indigo-800';
      case 'low': return 'bg-blue-50 text-blue-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: TodayStatus) => {
    if (status.is_period_day) return 'Đang có kinh';
    if (status.is_ovulation_day) return 'Ngày rụng trứng';
    if (status.is_fertile_day) return 'Cửa sổ sinh sản';
    return 'Ngày bình thường';
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHeart className="h-8 w-8 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Chào mừng bạn!</h3>
            <p className="text-gray-600 mb-6">Vui lòng đăng nhập để theo dõi chu kì kinh nguyệt của bạn</p>
            <Button className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700">
              Đăng nhập ngay
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
            <FaHeart className="h-8 w-8 text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu chu kì...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Sticky Header with Quick Actions */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200/50 shadow-sm">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaHeart className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">Chu Kì Của Tôi</h1>
                <p className="text-xs text-gray-500 hidden sm:block">
                  {todayStatus ? getStatusText(todayStatus) : 'Đang tải...'}
                </p>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                onClick={() => setShowPeriodLogger(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 hidden sm:flex"
              >
                <FaPlus className="h-3 w-3 mr-1" />
                Ghi nhận
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowPeriodLogger(true)}
                className="sm:hidden p-2"
              >
                <FaPlus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Enhanced Today Status - Mobile First */}
        {todayStatus && (
          <Card className="overflow-hidden border-0 shadow-lg">
            <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <MdToday className="h-5 w-5 text-white" />
                    <h3 className="text-lg font-semibold text-white">
                      Hôm nay - {new Date().toLocaleDateString('vi-VN', { 
                        weekday: 'short', 
                        day: 'numeric', 
                        month: 'short' 
                      })}
                    </h3>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <Badge className="bg-white/20 text-white border-white/30">
                      {getStatusText(todayStatus)}
                    </Badge>
                    <Badge className="bg-white/20 text-white border-white/30">
                      Thai: {
                        todayStatus.pregnancy_chance === 'high' ? 'Cao' :
                        todayStatus.pregnancy_chance === 'medium' ? 'TB' : 'Thấp'
                      }
                    </Badge>
                  </div>

                  {todayStatus.recommendations.length > 0 && (
                    <div className="bg-white/10 backdrop-blur rounded-lg p-3">
                      <p className="text-white/90 text-sm font-medium mb-1">
                        <FaLightbulb className="inline mr-1" />
                        Gợi ý hôm nay:
                      </p>
                      <p className="text-white/80 text-sm">
                        {todayStatus.recommendations[0]}
                      </p>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="flex gap-3 sm:flex-col">
                  {cycles.length > 0 && (
                    <>
                      <div className="text-center bg-white/10 backdrop-blur rounded-lg p-3 min-w-[70px]">
                        <div className="text-white text-lg font-bold">
                          {cycles[0].cycle_length || '?'}
                        </div>
                        <div className="text-white/80 text-xs">Chu kì</div>
                      </div>
                      <div className="text-center bg-white/10 backdrop-blur rounded-lg p-3 min-w-[70px]">
                        <div className="text-white text-lg font-bold">
                          {cycles[0].period_days.length}
                        </div>
                        <div className="text-white/80 text-xs">Ngày kinh</div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Enhanced Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto bg-white shadow-md">
              <TabsTrigger value="main" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <MdShowChart className="h-4 w-4" />
                <span className="hidden sm:inline">Theo Dõi</span>
                <span className="sm:hidden">Tổng quan</span>
              </TabsTrigger>
              <TabsTrigger value="insights" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <MdInsights className="h-4 w-4" />
                <span className="hidden sm:inline">Thống kê</span>
                <span className="sm:hidden">Phân tích</span>
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <FaCog className="h-4 w-4" />
                <span className="hidden sm:inline">Cài đặt</span>
                <span className="sm:hidden">Thiết lập</span>
              </TabsTrigger>
            </TabsList>
            
            {/* Insight Chips */}
            {cycles.length > 0 && activeTab === 'main' && (
              <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
                <div className="flex items-center gap-1 px-3 py-1 bg-white rounded-full shadow-sm border border-gray-200 whitespace-nowrap">
                  <FaTint className="h-3 w-3 text-pink-500" />
                  <span className="text-xs font-medium text-gray-700">
                    Chu kì {cycles.length}
                  </span>
                </div>
                {todayStatus?.is_fertile_day && (
                  <div className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-pink-100 to-purple-100 rounded-full border border-pink-200 whitespace-nowrap">
                    <HiSparkles className="h-3 w-3 text-purple-600" />
                    <span className="text-xs font-medium text-purple-700">
                      Cửa sổ sinh sản
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          <TabsContent value="main" className="space-y-8">
            {/* Improved Section Headers */}
            <div className="space-y-8">
              {/* Dashboard Section */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                    <MdShowChart className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Tổng Quan Chu Kì</h2>
                    <p className="text-sm text-gray-600">Trạng thái hiện tại và dự đoán</p>
                  </div>
                </div>
                <CycleDashboard 
                  cycles={cycles} 
                  todayStatus={todayStatus}
                  onRefresh={loadData}
                />
              </section>

              {/* Calendar Section */}
              <section>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                    <FaCalendarAlt className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Lịch Chu Kì</h2>
                    <p className="text-sm text-gray-600">Ghi nhận và theo dõi hàng ngày</p>
                  </div>
                </div>
                <CycleCalendar 
                  cycles={cycles} 
                  onRefresh={loadData}
                />
              </section>
            </div>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FaChartLine className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Thống Kê & Phân Tích</h2>
                <p className="text-sm text-gray-600">Xu hướng và đánh giá sức khỏe</p>
              </div>
            </div>
            <CycleStatistics onRefresh={loadData} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-gray-500 to-slate-600 rounded-lg flex items-center justify-center">
                <FaCog className="h-4 w-4 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Cài Đặt & Tùy Chỉnh</h2>
                <p className="text-sm text-gray-600">Thông báo và tùy chọn cá nhân</p>
              </div>
            </div>
            <NotificationSettings onRefresh={loadData} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Period Logger Modal */}
      {showPeriodLogger && (
        <PeriodLogger
          onClose={() => setShowPeriodLogger(false)}
          onSuccess={() => {
            setShowPeriodLogger(false);
            loadData();
            toast.success('Đã ghi nhận chu kì thành công! ');
          }}
        />
      )}
    </div>
  );
};

export default MenstrualCyclePage; 