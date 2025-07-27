import React, { useEffect, useState } from 'react';
import { Calendar, TrendingUp, TrendingDown, Minus, Heart, Zap, AlertTriangle, BarChart3 } from 'lucide-react';
import { MonthlyMoodSummaryResponse } from '../../services/menstrualCycleService';
import useMoodData from '../../hooks/useMoodData';
import { useAuth } from '../../contexts/AuthContext';

interface MonthlyMoodSummaryProps {
  year: number;
  month: number;
  className?: string;
}

const MonthlyMoodSummary: React.FC<MonthlyMoodSummaryProps> = ({
  year,
  month,
  className = ''
}) => {
  const { user } = useAuth();
  const { loadMonthlySummary, monthlySummary, loading, error } = useMoodData(user?.id);
  const [currentSummary, setCurrentSummary] = useState<MonthlyMoodSummaryResponse['data'] | null>(null);

  useEffect(() => {
      if (user?.id) {
    loadMonthlySummary(year, month);
  }
}, [user?.id, year, month, loadMonthlySummary]);

  useEffect(() => {
    setCurrentSummary(monthlySummary);
  }, [monthlySummary]);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'declining':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      default:
        return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  const getTrendText = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'Cải thiện';
      case 'declining':
        return 'Giảm sút';
      default:
        return 'Ổn định';
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
          <span className="ml-3 text-gray-600">Đang tải tổng quan tháng...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-600">Không thể tải tổng quan tháng</p>
          <p className="text-sm text-gray-500 mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!currentSummary) {
    return (
      <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
        <div className="text-center py-8">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">
            {monthNames[month - 1]} {year}
          </h3>
          <p className="text-gray-600">Chưa có dữ liệu cảm xúc cho tháng này</p>
          <p className="text-sm text-gray-500 mt-2">
            Hãy bắt đầu ghi lại cảm xúc hàng ngày để xem tổng quan
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <BarChart3 className="w-6 h-6 text-pink-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-800">
              Tổng quan {monthNames[month - 1]} {year}
            </h2>
            <p className="text-sm text-gray-600">
              Phân tích cảm xúc và xu hướng trong tháng
            </p>
          </div>
        </div>
        <div className={`flex items-center space-x-2 px-3 py-1 rounded-full border ${getTrendColor(currentSummary.mood_trend)}`}>
          {getTrendIcon(currentSummary.mood_trend)}
          <span className="text-sm font-medium">
            {getTrendText(currentSummary.mood_trend)}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {/* Total Days with Mood */}
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-pink-500 rounded-full flex items-center justify-center">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Ngày có ghi chép</p>
              <p className="text-2xl font-bold text-pink-600">
                {currentSummary.total_days_with_mood}
              </p>
            </div>
          </div>
        </div>

        {/* Average Mood */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center">
              <span className="text-white text-lg">😊</span>
            </div>
            <div>
              <p className="text-sm text-gray-600">Tâm trạng trung bình</p>
              <p className="text-lg font-semibold text-blue-600 capitalize">
                {currentSummary.average_mood}
              </p>
            </div>
          </div>
        </div>

        {/* Most Common Symptoms */}
        <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Triệu chứng phổ biến</p>
              <p className="text-lg font-semibold text-orange-600">
                {currentSummary.most_common_symptoms.length}
              </p>
            </div>
          </div>
        </div>

        {/* Mood Trend */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Xu hướng</p>
              <p className="text-lg font-semibold text-green-600">
                {getTrendText(currentSummary.mood_trend)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Cycle Insights */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-lg border border-purple-200">
        <h3 className="text-lg font-semibold text-purple-800 mb-4 flex items-center">
          <Calendar className="w-5 h-5 mr-2" />
          Phân tích theo chu kỳ
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-lg border border-purple-100">
            <h4 className="font-medium text-purple-700 mb-2">Trước kỳ kinh</h4>
            <p className="text-sm text-gray-600 capitalize">
              {currentSummary.cycle_insights.pre_menstrual_mood || 'Chưa có dữ liệu'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-purple-100">
            <h4 className="font-medium text-purple-700 mb-2">Trong kỳ kinh</h4>
            <p className="text-sm text-gray-600 capitalize">
              {currentSummary.cycle_insights.during_period_mood || 'Chưa có dữ liệu'}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-purple-100">
            <h4 className="font-medium text-purple-700 mb-2">Sau kỳ kinh</h4>
            <p className="text-sm text-gray-600 capitalize">
              {currentSummary.cycle_insights.post_period_mood || 'Chưa có dữ liệu'}
            </p>
          </div>
        </div>
      </div>

      {/* Most Common Symptoms List */}
      {currentSummary.most_common_symptoms.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-orange-500" />
            Triệu chứng thường gặp
          </h3>
          <div className="flex flex-wrap gap-2">
            {currentSummary.most_common_symptoms.map((symptom, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full border border-orange-200"
              >
                {symptom}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <h3 className="font-semibold text-blue-800 mb-2">💡 Gợi ý</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          {currentSummary.mood_trend === 'declining' && (
            <li>• Tâm trạng có xu hướng giảm sút, hãy chú ý chăm sóc bản thân nhiều hơn</li>
          )}
          {currentSummary.mood_trend === 'improving' && (
            <li>• Tâm trạng đang cải thiện tốt, hãy duy trì những thói quen tích cực</li>
          )}
          {currentSummary.total_days_with_mood < 10 && (
            <li>• Hãy ghi chép cảm xúc thường xuyên hơn để có dữ liệu chính xác</li>
          )}
          {currentSummary.most_common_symptoms.length > 0 && (
            <li>• Có triệu chứng thường gặp, hãy tham khảo ý kiến bác sĩ nếu cần</li>
          )}
        </ul>
      </div>
    </div>
  );
};

export default MonthlyMoodSummary; 