import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { CycleData } from '../../../services/menstrualCycleService';
import { FaTrash, FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

interface CycleDebugPanelProps {
  cycles: CycleData[];
  onDeleteCycle: (cycleId: string) => Promise<boolean>;
  onRefresh: () => Promise<void>;
}

const CycleDebugPanel: React.FC<CycleDebugPanelProps> = ({ 
  cycles, 
  onDeleteCycle, 
  onRefresh 
}) => {
  const analyzeCycle = (cycle: CycleData) => {
    const issues: string[] = [];
    
    // Check for gaps in period days
    const sortedPeriodDays = cycle.period_days
      .map(date => new Date(date))
      .sort((a, b) => a.getTime() - b.getTime());
    
    for (let i = 1; i < sortedPeriodDays.length; i++) {
      const prevDate = sortedPeriodDays[i - 1];
      const currDate = sortedPeriodDays[i];
      const daysDiff = Math.floor((currDate.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysDiff > 7) {
        issues.push(`Gap lớn giữa ngày ${prevDate.toLocaleDateString('vi-VN')} và ${currDate.toLocaleDateString('vi-VN')} (${daysDiff} ngày)`);
      }
    }
    
    // Check cycle length vs period days
    const cycleStart = new Date(cycle.cycle_start_date);
    const cycleEnd = cycle.predicted_cycle_end ? new Date(cycle.predicted_cycle_end) : null;
    const lastPeriodDay = sortedPeriodDays[sortedPeriodDays.length - 1];
    
    if (cycleEnd && lastPeriodDay > cycleEnd) {
      issues.push(`Ngày hành kinh cuối (${lastPeriodDay.toLocaleDateString('vi-VN')}) vượt quá ngày kết thúc chu kỳ dự đoán (${cycleEnd.toLocaleDateString('vi-VN')})`);
    }
    
    // Check for unreasonable cycle length
    if (cycle.cycle_length && (cycle.cycle_length < 21 || cycle.cycle_length > 45)) {
      issues.push(`Độ dài chu kỳ không hợp lý: ${cycle.cycle_length} ngày`);
    }
    
    // Check for unreasonable period length
    if (cycle.period_days.length > 10) {
      issues.push(`Độ dài hành kinh quá dài: ${cycle.period_days.length} ngày`);
    }
    
    return issues;
  };

  const handleDeleteCycle = async (cycleId: string) => {
    const confirmed = window.confirm('Bạn có chắc chắn muốn xóa chu kỳ này? Hành động này không thể hoàn tác.');
    if (confirmed) {
      const success = await onDeleteCycle(cycleId);
      if (success) {
        await onRefresh();
      }
    }
  };

  const problematicCycles = cycles.filter(cycle => analyzeCycle(cycle).length > 0);
  const normalCycles = cycles.filter(cycle => analyzeCycle(cycle).length === 0);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FaExclamationTriangle className="text-orange-500" />
          Debug Chu Kỳ
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Badge variant="outline" className="mr-2">
              Tổng: {cycles.length}
            </Badge>
            <Badge variant="destructive" className="mr-2">
              Lỗi: {problematicCycles.length}
            </Badge>
            <Badge variant="default">
              Bình thường: {normalCycles.length}
            </Badge>
          </div>
          <Button onClick={onRefresh} variant="outline" size="sm">
            Làm mới
          </Button>
        </div>

        {problematicCycles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-red-600">Chu Kỳ Có Vấn Đề:</h4>
            {problematicCycles.map((cycle) => {
              const issues = analyzeCycle(cycle);
              return (
                <Card key={cycle._id} className="border-red-200 bg-red-50">
                  <CardContent className="pt-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-medium">
                            Chu kỳ từ {new Date(cycle.cycle_start_date).toLocaleDateString('vi-VN')}
                          </span>
                          <Badge variant="destructive">Lỗi</Badge>
                        </div>
                        
                        <div className="text-sm text-gray-600 mb-2">
                          <div>ID: {cycle._id}</div>
                          <div>Độ dài chu kỳ: {cycle.cycle_length} ngày</div>
                          <div>Số ngày hành kinh: {cycle.period_days.length}</div>
                          <div>Ngày hành kinh: {cycle.period_days.map(date => 
                            new Date(date).toLocaleDateString('vi-VN')
                          ).join(', ')}</div>
                        </div>
                        
                        <div className="space-y-1">
                          {issues.map((issue, index) => (
                            <div key={index} className="text-sm text-red-600 flex items-start gap-2">
                              <FaExclamationTriangle className="text-red-500 mt-0.5 flex-shrink-0" />
                              {issue}
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <Button
                        onClick={() => handleDeleteCycle(cycle._id)}
                        variant="destructive"
                        size="sm"
                        className="ml-4"
                      >
                        <FaTrash className="mr-1" />
                        Xóa
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {normalCycles.length > 0 && (
          <div className="space-y-3">
            <h4 className="font-semibold text-green-600">Chu Kỳ Bình Thường:</h4>
            {normalCycles.map((cycle) => (
              <Card key={cycle._id} className="border-green-200 bg-green-50">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-medium">
                          Chu kỳ từ {new Date(cycle.cycle_start_date).toLocaleDateString('vi-VN')}
                        </span>
                        <Badge variant="default" className="bg-green-500">
                          <FaCheckCircle className="mr-1" />
                          Bình thường
                        </Badge>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        <div>Độ dài chu kỳ: {cycle.cycle_length} ngày</div>
                        <div>Số ngày hành kinh: {cycle.period_days.length}</div>
                      </div>
                    </div>
                    
                    <Button
                      onClick={() => handleDeleteCycle(cycle._id)}
                      variant="outline"
                      size="sm"
                    >
                      <FaTrash className="mr-1" />
                      Xóa
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {cycles.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            Không có chu kỳ nào để hiển thị
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CycleDebugPanel; 