import React, { useState, useCallback, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { TodayStatus } from '../../services/menstrualCycleService';
import { useAuth } from '../../contexts/AuthContext';
import { useMenstrualCycle } from '../../hooks';
import CycleDashboard from './components/CycleDashboard.tsx';
import CycleCalendar from './components/CycleCalendar.tsx';
import CycleStatistics from './components/CycleStatistics.tsx';
import PeriodLogger from './components/PeriodLogger.tsx';
import NotificationSettings from './components/NotificationSettings.tsx';
import { toast } from 'react-hot-toast';
import { 
  FaHeart, 
  FaPlus, 
  FaCalendarAlt, 
  FaChartBar, 
  FaChartLine, 
  FaCog,
  FaLightbulb 
} from 'react-icons/fa';

const MenstrualCyclePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('main');
  const [showPeriodLogger, setShowPeriodLogger] = useState(false);

  // Sử dụng custom hook để quản lý data và performance
  const { todayStatus, cycles, loading, error, refresh } = useMenstrualCycle(user?.id);

  const getStatusColor = useCallback((pregnancyChance: string) => {
    switch (pregnancyChance) {
      case 'high': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-indigo-100 text-indigo-800';
      case 'low': return 'bg-blue-50 text-blue-700';
      default: return 'bg-gray-100 text-gray-800';
    }
  }, []);

  const getStatusText = useCallback((status: TodayStatus) => {
    if (status.is_period_day) return 'Đang có kinh';
    if (status.is_ovulation_day) return 'Ngày rụng trứng';
    if (status.is_fertile_day) return 'Cửa sổ sinh sản';
    return 'Ngày bình thường';
  }, []);

  // Memoize computed values để tránh re-calculation
  const cycleStats = useMemo(() => {
    if (!cycles.length) return null;
    return {
      totalCycles: cycles.length,
      latestCycle: cycles[0],
      latestPeriodDays: cycles[0]?.period_days?.length || 0,
      cycleLength: cycles[0]?.cycle_length || '?'
    };
  }, [cycles]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHeart className="text-2xl text-white" />
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
            <FaHeart className="text-2xl text-white" />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Đang tải dữ liệu chu kì...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50">
      {/* Today Status Header */}
      {todayStatus && (
        <div className="sticky top-0 z-40 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 border-b border-purple-200/50 shadow-lg">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Left: Today Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <FaCalendarAlt className="text-lg text-white" />
                  <h1 className="text-base sm:text-lg font-semibold text-white">
                    Hôm nay - {new Date().toLocaleDateString('vi-VN', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </h1>
                </div>
                
                <div className="flex flex-wrap items-center gap-2">
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    {getStatusText(todayStatus)}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs">
                    Thai: {
                      todayStatus.pregnancy_chance === 'high' ? 'Cao' :
                      todayStatus.pregnancy_chance === 'medium' ? 'TB' : 'Thấp'
                    }
                  </Badge>
                  
                  {/* Gợi ý - Mobile: collapsed, Desktop: expanded */}
                  {todayStatus.recommendations.length > 0 && (
                    <div className="hidden sm:flex items-center gap-2 bg-white/10 backdrop-blur rounded-lg px-3 py-1">
                      <FaLightbulb className="text-sm text-white/90" />
                      <span className="text-white/90 text-xs">
                        {todayStatus.recommendations[0]}
                      </span>
                    </div>
                  )}
                </div>

                {/* Mobile: Gợi ý collapsed */}
                {todayStatus.recommendations.length > 0 && (
                  <div className="sm:hidden mt-2 bg-white/10 backdrop-blur rounded-lg p-2">
                    <div className="flex items-center gap-2">
                      <FaLightbulb className="text-xs text-white/90" />
                      <span className="text-white/90 text-xs font-medium">Gợi ý hôm nay:</span>
                    </div>
                    <p className="text-white/80 text-xs mt-1">
                      {todayStatus.recommendations[0]}
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Quick Stats & Actions */}
              <div className="flex items-center gap-2 ml-4">
                {/* Quick Stats */}
                {cycleStats && (
                  <div className="hidden sm:flex gap-2">
                    <div className="text-center bg-white/10 backdrop-blur rounded-lg p-2 min-w-[60px]">
                      <div className="text-white text-sm font-bold">
                        {cycleStats.cycleLength}
                      </div>
                      <div className="text-white/80 text-xs">Chu kì</div>
                    </div>
                    <div className="text-center bg-white/10 backdrop-blur rounded-lg p-2 min-w-[60px]">
                      <div className="text-white text-sm font-bold">
                        {cycleStats.latestPeriodDays}
                      </div>
                      <div className="text-white/80 text-xs">Kinh</div>
                    </div>
                  </div>
                )}

                {/* Add Button */}
                <Button
                  size="sm"
                  onClick={() => setShowPeriodLogger(true)}
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 backdrop-blur"
                  variant="outline"
                >
                  <FaPlus className="mr-1 sm:mr-2" />
                  <span className="hidden sm:inline">Ghi nhận</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-6 space-y-6">
        {/* Enhanced Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full grid-cols-3 sm:w-auto bg-white shadow-md">
              <TabsTrigger value="main" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <FaChartBar className="text-sm" />
                <span className="hidden sm:inline">Theo Dõi</span>
                <span className="sm:hidden">Tổng quan</span>
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <FaCalendarAlt className="text-sm" />
                <span className="hidden sm:inline">Lịch</span>
                <span className="sm:hidden">Lịch</span>
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
                <FaChartLine className="text-sm" />
                <span className="hidden sm:inline">Thống Kê</span>
                <span className="sm:hidden">TK</span>
              </TabsTrigger>
            </TabsList>
            
            <Button
              onClick={() => setShowPeriodLogger(true)}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 sm:hidden"
            >
              <FaPlus className="mr-2" />
              Ghi nhận chu kì
            </Button>
          </div>

          {/* Main Dashboard */}
          <TabsContent value="main" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center">
                <FaChartBar className="text-sm text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Theo Dõi Chu Kì</h2>
                <p className="text-sm text-gray-600">Tổng quan và dự đoán chu kì</p>
              </div>
            </div>
            <CycleDashboard 
              todayStatus={todayStatus} 
              cycles={cycles} 
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="calendar" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <FaCalendarAlt className="text-sm text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Lịch Chu Kì</h2>
                <p className="text-sm text-gray-600">Ghi nhận và theo dõi hàng ngày</p>
              </div>
            </div>
            <CycleCalendar 
              cycles={cycles} 
              onRefresh={refresh}
            />
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center">
                <FaChartLine className="text-sm text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Thống Kê & Phân Tích</h2>
                <p className="text-sm text-gray-600">Xu hướng và độ đều đặn</p>
              </div>
            </div>
            <CycleStatistics onRefresh={refresh} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Period Logger Modal */}
      {showPeriodLogger && (
        <PeriodLogger
          onClose={() => setShowPeriodLogger(false)}
          onSuccess={() => {
            setShowPeriodLogger(false);
            refresh();
          }}
        />
      )}
    </div>
  );
};

export default MenstrualCyclePage; 