import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { PillSchedule } from '../../../services/pillTrackingService';
import { FaPills, FaClock, FaEdit, FaCheck, FaTimes, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { getTodayLocal, getDateLocal } from '../../../utils/dateUtils';
import { toast } from 'react-hot-toast';

interface PillStatusCardProps {
  schedules: PillSchedule[];
  onTakePill: (scheduleId: string) => Promise<void>;
  onShowPillSettings: () => void;
  onUpdatePillTime?: (scheduleId: string, newTime: string) => Promise<void>;
  onUpdatePillType?: (scheduleId: string, newType: '21-day' | '24+4' | '21+7') => Promise<void>;
  onDisableReminder?: () => Promise<void>;
  onEnableReminder?: () => Promise<void>;
  onClearSchedules?: () => Promise<void>;
  onDebug?: () => Promise<any>;
  onRefresh?: () => Promise<void>;
}

const PillStatusCard: React.FC<PillStatusCardProps> = ({
  schedules,
  onTakePill,
  onShowPillSettings,
  onUpdatePillTime,
  onUpdatePillType,
  onDisableReminder,
  onEnableReminder,
  onClearSchedules,
  onDebug,
  onRefresh
}) => {
  const [editingTime, setEditingTime] = useState(false);
  const [editingType, setEditingType] = useState(false);
  const [newTime, setNewTime] = useState('');
  const [newType, setNewType] = useState<'21-day' | '24+4' | '21+7'>('21+7');

  // Log để kiểm tra props
  console.log('[PillStatusCard] Props received:', {
    onUpdatePillTime: !!onUpdatePillTime,
    onUpdatePillType: !!onUpdatePillType,
    onRefresh: !!onRefresh,
    onRefreshType: typeof onRefresh
  });

  // Tính toán thống kê thuốc
  const pillStats = useMemo(() => {
    console.log('[PillStatusCard] Schedules data:', schedules);
    
    if (!schedules || schedules.length === 0) {
      console.log('[PillStatusCard] No schedules found');
      return {
        totalPills: 0,
        takenPills: 0,
        remainingPills: 0,
        progress: 0,
        todayPill: null,
        currentSchedule: null
      };
    }

    // Mỗi schedule là một viên thuốc
    const totalPills = schedules.length;
    const takenPills = schedules.filter(schedule => schedule.is_taken).length;
    const remainingPills = totalPills - takenPills;
    const progress = totalPills > 0 ? Math.round((takenPills / totalPills) * 100) : 0;
    
    // Thống kê theo loại thuốc
    const hormonePills = schedules.filter(schedule => schedule.pill_status === 'hormone');
    const placeboPills = schedules.filter(schedule => schedule.pill_status === 'placebo');
    const hormoneTaken = hormonePills.filter(schedule => schedule.is_taken).length;
    const placeboTaken = placeboPills.filter(schedule => schedule.is_taken).length;

    // Tìm thuốc hôm nay
    const todayString = getTodayLocal();
    console.log('[PillStatusCard] Today string (local):', todayString);
    
    const todayPill = schedules.find(schedule => {
      const pillDateString = getDateLocal(schedule.pill_start_date);
      console.log('[PillStatusCard] Comparing pill date:', pillDateString, 'with today:', todayString);
      return pillDateString === todayString;
    });
    
    console.log('[PillStatusCard] Today pill:', todayPill);

    // Lấy thông tin từ schedule đầu tiên để hiển thị cài đặt
    const currentSchedule = schedules[0];
    console.log('[PillStatusCard] Current schedule:', currentSchedule);

    const stats = {
      totalPills,
      takenPills,
      remainingPills,
      progress,
      todayPill,
      currentSchedule,
      hormonePills: hormonePills.length,
      placeboPills: placeboPills.length,
      hormoneTaken,
      placeboTaken
    };
    
    console.log('[PillStatusCard] Calculated stats:', stats);
    return stats;
  }, [schedules]);

  const getPillTypeLabel = (type: string) => {
    switch (type) {
      case '21+7': return 'Vỉ 28 viên (21+7)';
      case '24+4': return 'Vỉ 28 viên (24+4)';
      case '21-day': return 'Vỉ 21 viên';
      default: return type;
    }
  };

  const handleEditTime = () => {
    setNewTime(pillStats.currentSchedule?.reminder_time || '08:00');
    setEditingTime(true);
    setEditingType(false);
  };

  const handleEditType = () => {
    setNewType(pillStats.currentSchedule?.pill_type || '21+7');
    setEditingType(true);
    setEditingTime(false);
  };

  const handleSaveTime = async () => {
    try {
      console.log('[PillStatusCard] handleSaveTime called');
      
      if (!pillStats.currentSchedule) {
        console.error('[PillStatusCard] No current schedule found');
        toast.error('Không tìm thấy lịch uống thuốc');
        return;
      }
      
      console.log('[PillStatusCard] Current schedule ID:', pillStats.currentSchedule._id);
      console.log('[PillStatusCard] New time:', newTime);
      console.log('[PillStatusCard] onUpdatePillTime exists:', !!onUpdatePillTime);
      
      if (!onUpdatePillTime) {
        console.error('[PillStatusCard] onUpdatePillTime is not provided');
        toast.error('Không thể cập nhật giờ uống');
        return;
      }

      console.log('[PillStatusCard] Calling onUpdatePillTime...');
      await onUpdatePillTime(pillStats.currentSchedule._id, newTime);
      setEditingTime(false);
      
      toast.success(`Đã cập nhật giờ uống thành ${newTime}`);
      
      if (onRefresh) {
        console.log('[PillStatusCard] onRefresh exists, calling it...');
        await onRefresh();
        console.log('[PillStatusCard] onRefresh completed');
      } else {
        console.log('[PillStatusCard] onRefresh is undefined!');
        console.log('[PillStatusCard] Force refreshing page...');
        window.location.reload();
      }
    } catch (error: any) {
      console.error('[PillStatusCard] Error updating pill time:', error);
      console.error('[PillStatusCard] Error details:', {
        message: error?.message,
        stack: error?.stack,
        response: error?.response?.data
      });
      toast.error('Không thể cập nhật giờ uống');
    }
  };

  const handleSaveType = async () => {
    if (!onUpdatePillType || !pillStats.currentSchedule) return;
    
    try {
      console.log('[PillStatusCard] Updating pill type:', newType);
      await onUpdatePillType(pillStats.currentSchedule._id, newType);
      setEditingType(false);
      
      // Thông báo thành công
      toast.success(`Đã cập nhật loại thuốc thành ${getPillTypeLabel(newType)}`);
      
      if (onRefresh) {
        console.log('[PillStatusCard] onRefresh exists, calling it...');
        await onRefresh();
        console.log('[PillStatusCard] onRefresh completed');
      } else {
        console.log('[PillStatusCard] onRefresh is undefined!');
        // Force refresh bằng cách reload trang
        console.log('[PillStatusCard] Force refreshing page...');
        window.location.reload();
      }
    } catch (error) {
      console.error('Error updating pill type:', error);
      toast.error('Không thể cập nhật loại thuốc');
    }
  };

  const handleCancelEdit = () => {
    setEditingTime(false);
    setEditingType(false);
  };

  if (!pillStats.currentSchedule) {
    return (
      <Card className="bg-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <FaPills className="text-purple-600" />
            Thuốc tránh thai
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-gray-600 mb-4">Chưa có lịch uống thuốc</p>
            <Button 
              onClick={onShowPillSettings}
              className="bg-purple-600 hover:bg-purple-700"
            >
              Thiết lập lịch uống thuốc
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-purple-50 to-pink-50">
             <CardHeader className="pb-3">
         <div className="flex items-center justify-between">
           <CardTitle className="flex items-center gap-2 text-lg">
             <FaPills className="text-purple-600" />
             Thuốc tránh thai
           </CardTitle>
           <div className="flex items-center gap-2">
             {onClearSchedules && (
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={onClearSchedules}
                 className="text-red-600 hover:text-red-700 hover:bg-red-50"
                 title="Xóa toàn bộ lịch uống thuốc"
               >
                 <FaTrash className="w-4 h-4" />
               </Button>
             )}
             {onDebug && (
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={async () => {
                   try {
                     const result = await onDebug();
                     console.log('Debug result:', result);
                     alert('Check console for debug data');
                   } catch (error) {
                     console.error('Debug error:', error);
                   }
                 }}
                 className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                 title="Debug lịch uống thuốc"
               >
                 <FaInfoCircle className="w-4 h-4" />
               </Button>
             )}
           </div>
         </div>
       </CardHeader>
      <CardContent className="space-y-4">
                 {/* Thống kê tổng quan */}
         <div className="grid grid-cols-2 gap-4 p-3 bg-white rounded-lg shadow-sm">
           <div className="text-center">
             <div className="text-2xl font-bold text-green-600">{pillStats.takenPills}</div>
             <div className="text-xs text-gray-600">Đã uống</div>
           </div>
           <div className="text-center">
             <div className="text-2xl font-bold text-orange-600">{pillStats.remainingPills}</div>
             <div className="text-xs text-gray-600">Còn lại</div>
           </div>
         </div>
         
         {/* Thống kê chi tiết theo loại thuốc */}
         <div className="p-3 bg-gray-50 rounded-lg">
           <div className="text-xs font-medium text-gray-700 mb-2">Chi tiết theo loại:</div>
           <div className="grid grid-cols-2 gap-4 text-xs">
             <div className="flex justify-between">
               <span className="text-pink-600">Thuốc nội tiết:</span>
               <span className="font-semibold">{pillStats.hormoneTaken}/{pillStats.hormonePills}</span>
             </div>
             <div className="flex justify-between">
               <span className="text-gray-600">Viên giả dược:</span>
               <span className="font-semibold">{pillStats.placeboTaken}/{pillStats.placeboPills}</span>
             </div>
           </div>
         </div>

        {/* Thanh tiến độ */}
        {/* <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Tiến độ</span>
            <span className="font-medium">{pillStats.progress}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300" 
              style={{ width: `${pillStats.progress}%` }}
            />
          </div>
        </div> */}

                 {/* Thông tin lịch hiện tại */}
          <div className="p-3 bg-white rounded-lg shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Loại thuốc:</span>
              {editingType ? (
                <div className="flex items-center gap-2">
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as '21-day' | '24+4' | '21+7')}
                    className="text-sm border rounded px-2 py-1"
                  >
                    <option value="21+7">Vỉ 28 viên (21+7)</option>
                    <option value="24+4">Vỉ 28 viên (24+4)</option>
                    <option value="21-day">Vỉ 21 viên</option>
                  </select>
                  <Button
                    size="sm"
                    onClick={handleSaveType}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1"
                  >
                    <FaCheck className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="px-2 py-1"
                  >
                    <FaTimes className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">
                    {getPillTypeLabel(pillStats.currentSchedule.pill_type)}
                  </span>
                  {onUpdatePillType && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditType}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1"
                    >
                      <FaEdit className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
           
                        <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Giờ uống:</span>
              {editingTime ? (
                <div className="flex items-center gap-2">
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="text-sm border rounded px-2 py-1"
                  />
                  <Button
                    size="sm"
                    onClick={handleSaveTime}
                    className="bg-green-600 hover:bg-green-700 text-white px-2 py-1"
                  >
                    <FaCheck className="w-3 h-3" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="px-2 py-1"
                  >
                    <FaTimes className="w-3 h-3" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <FaClock className="w-3 h-3 text-gray-400" />
                  <span className="text-sm font-medium">
                    {pillStats.currentSchedule.reminder_time}
                  </span>
                  {onUpdatePillTime && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={handleEditTime}
                      className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 p-1"
                    >
                      <FaEdit className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Trạng thái nhắc nhở */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Nhắc nhở:</span>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={pillStats.currentSchedule.reminder_enabled ? "default" : "secondary"}
                  className={pillStats.currentSchedule.reminder_enabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}
                >
                  {pillStats.currentSchedule.reminder_enabled ? 'Bật' : 'Tắt'}
                </Badge>
                {pillStats.currentSchedule.reminder_enabled && onDisableReminder && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onDisableReminder}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
                  >
                    <FaTimes className="w-3 h-3" />
                  </Button>
                )}
                {!pillStats.currentSchedule.reminder_enabled && onEnableReminder && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onEnableReminder}
                    className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-200"
                  >
                    <FaCheck className="w-3 h-3" />
                  </Button>
                )}
              </div>
            </div>
        </div>

        {/* Xóa toàn bộ phần "Thuốc hôm nay" từ đây */}
        {/* {pillStats.todayPill && (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-blue-800">Thuốc hôm nay</div>
                <div className="text-xs text-blue-600">
                  {pillStats.todayPill.is_taken ? 'Đã uống' : 'Chưa uống'}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {pillStats.todayPill.pill_status === 'hormone' ? 'Thuốc nội tiết' : 'Viên giả dược'} 
                  (Viên {pillStats.todayPill.pill_number})
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  💡 Bạn cũng có thể click vào ngày trên lịch để đánh dấu
                </div>
              </div>
              <Badge 
                variant={pillStats.todayPill.is_taken ? "default" : "secondary"}
                className={pillStats.todayPill.is_taken ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}
              >
                {pillStats.todayPill.is_taken ? 'Đã uống' : 'Chưa uống'}
              </Badge>
            </div>
          </div>
        )} */}
      </CardContent>
    </Card>
  );
};

export default PillStatusCard; 