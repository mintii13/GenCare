import React, { useState, useEffect } from 'react';
import { format, addDays } from 'date-fns';
import { consultantService } from '../../../services/consultantService';
import { useWeeklySchedule } from '../../../hooks/useWeeklySchedule';
import WeeklyCalendarView from '../../../components/schedule/WeeklyCalendarView';
import { WorkingDay, DAY_NAMES, DAY_LABELS, DayName } from '../../../types/schedule';
import { formatWeekRange } from '../../../utils/dateUtils';
import { useAuth } from '../../../contexts/AuthContext';
import { weeklyScheduleService } from '../../../services/weeklyScheduleService';
import { getWeekRange } from '../../../utils/dateUtils';

interface Consultant {
  _id: string;
  full_name: string;
}

interface TableRow {
  day: string;
  working: string;
  break: string;
  status: string;
}

const ConsultantSchedule: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [selectedConsultantId, setSelectedConsultantId] = useState('');
  const [debugInfo, setDebugInfo] = useState<any>(null);

  // Use shared hook for schedule management
  const {
    currentWeek,
    scheduleData,
    loading,
    error,
    goToPreviousWeek,
    goToNextWeek,
    handleRetry
  } = useWeeklySchedule({
    mode: 'consultant-schedule',
    consultantId: selectedConsultantId
  });

  useEffect(() => {
    console.log('🔍 [DEBUG] ConsultantSchedule - User context:', {
      user,
      isAuthenticated,
      userRole: user?.role,
      userId: user?.id
    });
    
    setDebugInfo({
      user,
      isAuthenticated,
      userRole: user?.role,
      userId: user?.id
    });
    
    loadConsultants();
  }, [user, isAuthenticated]);

  const loadConsultants = async () => {
    try {
      console.log('🔍 [DEBUG] Loading consultants...');
      const response = await consultantService.getAllConsultants();
      console.log('📊 [DEBUG] Consultants response:', response);
      
      if (response.data && response.data.consultants) {
        const mapped = response.data.consultants.map((c: any) => ({
          _id: c._id,
          full_name: c.full_name || c.name || ''
        }));
        setConsultants(mapped);
        console.log('✅ [DEBUG] Mapped consultants:', mapped);
      }
    } catch (error) {
      console.error('❌ [DEBUG] Error loading consultants:', error);
    }
  };

  // Chuẩn bị dữ liệu cho bảng
  const tableData: TableRow[] = DAY_NAMES.map((day, idx) => {
    const wd = scheduleData?.working_days[day as DayName];
    return {
      day: DAY_LABELS[idx],
      working: wd && wd.is_available ? `${wd.start_time} - ${wd.end_time}` : '-',
      break: wd && wd.is_available && wd.break_start && wd.break_end ? `${wd.break_start} - ${wd.break_end}` : '-',
      status: wd && wd.is_available ? 'Làm việc' : 'Không làm việc',
    };
  });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm">
        <div className="px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Lịch Làm Việc Chuyên Gia</h1>
          <p className="mt-1 text-sm text-gray-600">
            Xem lịch làm việc của các chuyên gia tư vấn
          </p>
        </div>

        <div className="p-6">
          {/* Debug Information - Only in development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mb-4 p-3 bg-gray-100 rounded text-xs">
              <strong>Debug Info:</strong>
              <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
              <div className="mt-2">
                <strong>Selected Consultant:</strong> {selectedConsultantId || 'None'}
              </div>
              <div>
                <strong>Schedule Data:</strong> {scheduleData ? 'Loaded' : 'Not loaded'}
              </div>
              <div>
                <strong>Loading:</strong> {loading ? 'Yes' : 'No'}
              </div>
              <div>
                <strong>Error:</strong> {error || 'None'}
              </div>
              
              {/* Debug Test Button */}
              <div className="mt-2 pt-2 border-t">
                <button
                  onClick={async () => {
                    console.log('🚀 [DEBUG] Testing API manually...');
                    try {
                      // Test consultants API first
                      const consultantsRes = await consultantService.getAllConsultants();
                      console.log('👨‍⚕️ Consultants API result:', consultantsRes);
                      
                      if (consultantsRes.data?.consultants?.length > 0 && selectedConsultantId) {
                        // Test weekly schedule API
                        const { weekStart } = getWeekRange(currentWeek);
                        console.log('📅 Testing with week:', weekStart, 'consultant:', selectedConsultantId);
                        
                        const scheduleRes = await weeklyScheduleService.getConsultantSchedules(selectedConsultantId, weekStart, weekStart);
                        console.log('📊 Schedule API result:', scheduleRes);
                      }
                    } catch (err) {
                      console.error('❌ Debug test error:', err);
                    }
                  }}
                  className="px-2 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                  disabled={!selectedConsultantId}
                >
                  Test API
                </button>
              </div>
            </div>
          )}

          {/* Authentication Check */}
          {!isAuthenticated && (
            <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <p className="text-yellow-700">Bạn cần đăng nhập để xem lịch làm việc.</p>
            </div>
          )}

          {/* Consultant Selection */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Chọn chuyên gia
            </label>
            <select
              value={selectedConsultantId}
              onChange={(e) => {
                console.log('🔍 [DEBUG] Selected consultant:', e.target.value);
                setSelectedConsultantId(e.target.value);
              }}
              className="w-full md:w-1/3 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={!isAuthenticated}
            >
              <option value="">-- Chọn chuyên gia --</option>
              {consultants.map((consultant) => (
                <option key={consultant._id} value={consultant._id}>
                  {consultant.full_name}
                </option>
              ))}
            </select>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
              <button 
                onClick={handleRetry}
                className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Đang tải lịch làm việc...</span>
            </div>
          )}

          {/* Schedule Display */}
          {selectedConsultantId && !loading && isAuthenticated && (
            <>
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-900">
                  Lịch tuần {formatWeekRange(format(currentWeek, 'yyyy-MM-dd'), format(addDays(currentWeek, 6), 'yyyy-MM-dd'))}
                </h3>
              </div>

              <WeeklyCalendarView
                currentWeek={currentWeek}
                scheduleData={scheduleData || undefined}
                mode="read-only"
                onPreviousWeek={goToPreviousWeek}
                onNextWeek={goToNextWeek}
                loading={loading}
                error={error}
                onRetry={handleRetry}
              />

              {/* Schedule Table */}
              {scheduleData && (
                <div className="mt-6 bg-gray-50 rounded-lg p-4">
                  <h4 className="text-md font-medium text-gray-900 mb-4">Chi tiết lịch làm việc</h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Thứ</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Giờ làm việc</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Giờ nghỉ</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {tableData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 font-medium">{row.day}</td>
                            <td className="px-4 py-2">{row.working}</td>
                            <td className="px-4 py-2">{row.break}</td>
                            <td className="px-4 py-2">
                              <span 
                                className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  row.status === 'Làm việc' 
                                    ? 'bg-green-100 text-green-800' 
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {row.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* No Schedule Found */}
              {!scheduleData && !loading && !error && selectedConsultantId && (
                <div className="text-center py-8 text-gray-500">
                  <p>Không tìm thấy lịch làm việc cho tuần này</p>
                </div>
              )}
            </>
          )}

          {/* No Consultant Selected */}
          {!selectedConsultantId && isAuthenticated && (
            <div className="text-center py-8 text-gray-500">
              <p>Vui lòng chọn chuyên gia để xem lịch làm việc</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConsultantSchedule;