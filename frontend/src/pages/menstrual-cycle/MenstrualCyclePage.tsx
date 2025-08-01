import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { TodayStatus } from '../../services/menstrualCycleService';
import { useAuth } from '../../contexts/AuthContext';
import { usePillTracking } from '../../hooks/usePillTracking';
import CycleDashboard from './components/CycleDashboard';
import CycleCalendar from './components/CycleCalendar';
import CombinedCycleView from './components/CombinedCycleView';
import CycleCharts from './components/CycleCharts';
import PeriodLogger from './components/PeriodLogger';
import PillSetupForm from './components/PillSetupFrom';
import PillCalendar from './components/PillCalender';
import PillSettingsModal from './components/PillSettingModal';

import useMenstrualCycle from '../../hooks/useMenstrualCycle';
import FirstTimeGuideModal from '../../components/menstrual-cycle/FirstTimeGuideModal';
import ErrorBoundary from '../../components/common/ErrorBoundary';

import { toast } from 'react-hot-toast';
import { 
  FaHeart, 
  FaPlus, 
  FaCalendarAlt, 
  FaChartBar, 
  FaChartLine, 
  FaPills,
  FaCog,
  FaLightbulb,

} from 'react-icons/fa';

const MenstrualCyclePage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('main');
  const [showPeriodLogger, setShowPeriodLogger] = useState(false);
  const [showPillSettings, setShowPillSettings] = useState(false);
  const [showFirstTimeGuide, setShowFirstTimeGuide] = useState(false);

  // Custom hooks
  const { 
    todayStatus, 
    cycles, 
    loading: cycleLoading, 
    error: cycleError, 
    refresh: refreshCycle,
    deleteCycle
  } = useMenstrualCycle(user?.id);
    const {
    schedules,
    loading: pillLoading,
    error: pillError, 
    setupPillSchedule, 
    markPillAsTaken,
    updatePillSchedule,
    testReminder
  } = usePillTracking();

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
    if (!cycles?.length) return null;
    return {
      totalCycles: cycles.length,
      latestCycle: cycles[0],
      latestPeriodDays: cycles[0]?.period_days?.length || 0,
      cycleLength: cycles[0]?.cycle_length || '?'
    };
  }, [cycles]);

  // Combined loading state
  const isLoading = cycleLoading || pillLoading;

  // Kiểm tra xem người dùng có phải là người mới không
  const isFirstTimeUser = useMemo(() => {
    return !isLoading && cycles.length === 0;
  }, [isLoading, cycles?.length]);

  // Kiểm tra xem có lịch uống thuốc không
  const hasPillSchedule = useMemo(() => {
    return schedules && schedules.length > 0;
  }, [schedules]);

  // Hiển thị modal hướng dẫn cho người dùng mới
  useEffect(() => {
    if (isFirstTimeUser && user) {
      setShowFirstTimeGuide(true);
    }
  }, [isFirstTimeUser, user]);

  // Debug logs
  console.log('[MenstrualCyclePage] Render state:', {
    cycleLoading,
    pillLoading,
    isLoading,
    cyclesLength: cycles?.length || 0,
    schedulesLength: schedules?.length || 0,
    user: user?.id,
    userId: user?.id,
    userEmail: user?.email,
    userFullName: user?.full_name,
    userRole: user?.role
  });

  console.log('[MenstrualCyclePage] Current user details:', {
    id: user?.id,
    email: user?.email,
    fullName: user?.full_name,
    role: user?.role,
    isAuthenticated: !!user
  });

  // Error state - chỉ hiển thị khi có lỗi thật sự (network/server error)
  if (cycleError && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-2xl border-0">
          <CardContent className="pt-8 pb-8 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Không thể tải dữ liệu</h3>
            <p className="text-gray-600 mb-6">{cycleError}</p>
            <Button 
              onClick={refreshCycle}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700"
            >
              Thử lại
            </Button>
          </CardContent>
        </Card> 
      </div>
    );
  }

  // Loading state - hiển thị khi đang loading và chưa có dữ liệu
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-pink-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse shadow-lg">
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
                  <Badge className="bg-white/20 text-white border-white/30 text-xs backdrop-blur">
                    {getStatusText(todayStatus)}
                  </Badge>
                  <Badge className="bg-white/20 text-white border-white/30 text-xs backdrop-blur">
                    Thai: {
                      todayStatus.pregnancy_chance === 'high' ? 'Cao' :
                      todayStatus.pregnancy_chance === 'medium' ? 'TB' : 'Thấp'
                    }
                  </Badge>
                  
                  {/* PMS Badge */}
                  {todayStatus.is_pms_day && (
                    <Badge className="bg-purple-400/20 text-purple-200 border-purple-300/30 text-xs backdrop-blur">
                      PMS
                    </Badge>
                  )}
                  
                  {/* Gợi ý - Mobile: collapsed, Desktop: expanded */}
                  {todayStatus.recommendations?.length > 0 && (
                    <div className="hidden sm:flex items-center gap-2 bg-white/15 backdrop-blur rounded-lg px-3 py-1 border border-white/20">
                      <FaLightbulb className="text-sm text-white/90" />
                      <span className="text-white/90 text-xs">
                        {todayStatus.recommendations[0]}
                      </span>
                    </div>
                  )}

                  {/* Desktop: Thông báo cho người dùng mới */}
                  {isFirstTimeUser && (
                    <div className="hidden sm:flex items-center gap-2 bg-yellow-400/20 backdrop-blur rounded-lg px-3 py-1 border border-yellow-300/30">
                      <FaLightbulb className="text-sm text-yellow-600" />
                      <span className="text-yellow-800 text-xs font-medium">
                        Người dùng mới: Xem hướng dẫn
                      </span>
                    </div>
                  )}
                </div>

                {/* Mobile: Gợi ý collapsed */}
                {todayStatus.recommendations?.length > 0 && (
                  <div className="sm:hidden mt-2 bg-white/15 backdrop-blur rounded-lg p-2 border border-white/20">
                    <div className="flex items-center gap-2">
                      <FaLightbulb className="text-xs text-white/90" />
                      <span className="text-white/90 text-xs font-medium">Gợi ý hôm nay:</span>
                    </div>
                    <p className="text-white/80 text-xs mt-1">
                      {todayStatus.recommendations[0]}
                    </p>
                  </div>
                )}

                {/* Mobile: Thông báo cho người dùng mới */}
                {isFirstTimeUser && (
                  <div className="sm:hidden mt-2 bg-yellow-400/20 backdrop-blur rounded-lg p-2 border border-yellow-300/30">
                    <div className="flex items-center gap-2">
                      <FaLightbulb className="text-xs text-yellow-600" />
                      <span className="text-yellow-800 text-xs font-medium">Người dùng mới:</span>
                    </div>
                    <p className="text-yellow-700 text-xs mt-1">
                      Xem hướng dẫn để sử dụng hiệu quả
                    </p>
                  </div>
                )}
              </div>

              {/* Right: Quick Stats & Actions */}
              <div className="flex items-center gap-2 ml-4">
                {/* Quick Stats */}
                {cycleStats && (
                  <div className="hidden sm:flex gap-2">
                    <div className="text-center bg-white/15 backdrop-blur rounded-lg p-2 min-w-[60px] border border-white/20">
                      <div className="text-white text-sm font-bold">
                        {cycleStats.cycleLength}
                      </div>
                      <div className="text-white/80 text-xs">Chu kì</div>
                    </div>
                    <div className="text-center bg-white/15 backdrop-blur rounded-lg p-2 min-w-[60px] border border-white/20">
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

                {/* Guide Button for First Time Users */}
                {isFirstTimeUser && (
                  <Button
                    size="sm"
                    onClick={() => setShowFirstTimeGuide(true)}
                    className="bg-yellow-400/20 hover:bg-yellow-400/30 text-yellow-800 border-yellow-300/30 backdrop-blur"
                    variant="outline"
                  >
                    <FaLightbulb className="mr-1 sm:mr-2" />
                    <span className="hidden sm:inline">Hướng dẫn</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-3 space-y-3">
        {/* Enhanced Navigation */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid w-full grid-cols-4 sm:w-auto bg-white/90 backdrop-blur shadow-lg border border-white/20">
              <TabsTrigger value="main" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                <FaCalendarAlt className="text-sm" />
                <span className="hidden sm:inline">Lịch & Theo Dõi</span>
                <span className="sm:hidden">Lịch</span>
              </TabsTrigger>
              <TabsTrigger value="statistics" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-pink-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                <FaChartLine className="text-sm" />
                <span className="hidden sm:inline">Thống Kê</span>
                <span className="sm:hidden">TK</span>
              </TabsTrigger>
              <TabsTrigger value="pills" className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-teal-500 data-[state=active]:to-cyan-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                <FaPills className="text-sm" />
                <span className="hidden sm:inline">Uống Thuốc</span>
                <span className="sm:hidden">Uống</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2 sm:hidden">
              {isFirstTimeUser && (
                <Button
                  onClick={() => setShowFirstTimeGuide(true)}
                  variant="outline"
                  className="border-yellow-300 text-yellow-700 hover:bg-yellow-50 backdrop-blur"
                >
                  <FaLightbulb className="mr-2" />
                  Hướng dẫn
                </Button>
              )}
              <Button
                onClick={() => setShowPeriodLogger(true)}
                className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 shadow-md"
              >
                <FaPlus className="mr-2" />
                Ghi nhận chu kì
              </Button>
            </div>
          </div>

          {/* Combined Cycle View */}
          <TabsContent value="main" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-purple-600 rounded-lg flex items-center justify-center shadow-md">
                <FaCalendarAlt className="text-sm text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Lịch & Theo Dõi Chu Kì</h2>
                <p className="text-sm text-gray-600">Tổng quan, lịch và ghi chú</p>
              </div>
            </div>
            <ErrorBoundary>
              <CombinedCycleView 
                todayStatus={todayStatus} 
                cycles={cycles} 
                onRefresh={refreshCycle}
                isFirstTimeUser={isFirstTimeUser}
                onShowGuide={() => setShowFirstTimeGuide(true)}
                pillSchedules={schedules}
                onTakePill={markPillAsTaken}
                onShowPillSettings={() => setShowPillSettings(true)}
              />
            </ErrorBoundary>
          </TabsContent>

          <TabsContent value="statistics" className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-lg flex items-center justify-center shadow-md">
                <FaChartLine className="text-sm text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Thống Kê & Phân Tích</h2>
                <p className="text-sm text-gray-600">Xu hướng và độ đều đặn</p>
              </div>
            </div>
            <CycleCharts onRefresh={refreshCycle} />
          </TabsContent>



          {/* Pill Tracking Tab */}
          <TabsContent value="pills" className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center shadow-md">
                        <FaPills className="text-sm text-white" />
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Theo Dõi Lịch Uống Thuốc</h2>
                        <p className="text-sm text-gray-600">Quản lý và theo dõi việc uống thuốc tránh thai hàng ngày.</p>
                    </div>
                </div>
                <Button variant="outline" size="sm" onClick={() => setShowPillSettings(true)}>
                    <FaCog className="mr-2" />
                    Cài đặt
                </Button>
            </div>
            
            {pillLoading && <p>Đang tải lịch uống thuốc...</p>}
            {pillError && <p className="text-red-500">{pillError}</p>}
            
            {!pillLoading && !pillError && (
              hasPillSchedule ? (
                <PillCalendar 
                  schedules={schedules}
                  onTakePill={markPillAsTaken}
                />
              ) : (
                <PillSetupForm 
                  onSubmit={setupPillSchedule}
                  isLoading={pillLoading}
                  latestPeriodStart={cycles && cycles.length ? cycles[0]?.period_days?.[0] : undefined}
                />
              )
            )}
          </TabsContent>


        </Tabs>

        <PillSettingsModal 
          isOpen={showPillSettings} 
          onClose={() => setShowPillSettings(false)} 
          onUpdate={updatePillSchedule}
          onCreate={setupPillSchedule}
          onTestReminder={testReminder}
          currentSchedule={schedules && schedules.length ? schedules[0] : undefined}
          isLoading={pillLoading}
        />
        
        {showPeriodLogger && (
          <PeriodLogger
            onClose={() => setShowPeriodLogger(false)}
            onSuccess={refreshCycle}
          />
        )}

        {/* First Time Guide Modal */}
        <FirstTimeGuideModal
          isOpen={showFirstTimeGuide}
          onClose={() => setShowFirstTimeGuide(false)}
        />
      </div>
    </div>
  );
};

export default MenstrualCyclePage; 