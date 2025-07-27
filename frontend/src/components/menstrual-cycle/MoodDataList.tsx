import React, { useState, useMemo } from 'react';
import { Search, Filter, Calendar, Heart, Zap, AlertTriangle, FileText, Edit, Trash2 } from 'lucide-react';
import { MoodData, DailyMoodData } from '../../services/menstrualCycleService';
import { useMoodDataFilter, useMoodDataStats } from '../../hooks/useMoodDataOperations';
import MoodDataModal from './MoodDataModal';
import useMoodData from '../../hooks/useMoodData';
import { useAuth } from '../../contexts/AuthContext';

interface MoodDataListProps {
  className?: string;
  showFilters?: boolean;
  showStats?: boolean;
}

const MoodDataList: React.FC<MoodDataListProps> = ({
  className = '',
  showFilters = true,
  showStats = true
}) => {
  const { user } = useAuth();
  const { moodData, refresh } = useMoodData(user?.id);
  const { filters, updateFilter, clearFilters, filterMoodData } = useMoodDataFilter();
  const { calculateStats } = useMoodDataStats();
  
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingMoodData, setExistingMoodData] = useState<DailyMoodData | undefined>();

  // Filter and sort mood data
  const filteredMoodData = useMemo(() => {
    const filtered = filterMoodData(moodData);
    return filtered.sort(([, a], [, b]) => new Date(b).getTime() - new Date(a).getTime());
  }, [moodData, filterMoodData]);

  // Calculate stats
  const stats = useMemo(() => calculateStats(moodData), [moodData, calculateStats]);

  const handleEditMoodData = (date: string, data: DailyMoodData) => {
    setSelectedDate(date);
    setExistingMoodData(data);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedDate('');
    setExistingMoodData(undefined);
  };

  const handleModalSave = () => {
    refresh();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('vi-VN', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getMoodEmoji = (mood?: string) => {
    const moodEmojis: Record<string, string> = {
      happy: '😊',
      excited: '🤩',
      calm: '😌',
      tired: '😴',
      stressed: '😰',
      sad: '😢',
      angry: '😠',
      anxious: '😨'
    };
    return moodEmojis[mood || ''] || '😊';
  };

  const getEnergyColor = (energy?: string) => {
    const energyColors = {
      high: 'text-green-600 bg-green-100',
      medium: 'text-yellow-600 bg-yellow-100',
      low: 'text-red-600 bg-red-100'
    };
    return energyColors[energy as keyof typeof energyColors] || 'text-gray-600 bg-gray-100';
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <Heart className="w-6 h-6 text-pink-500" />
          <div>
            <h2 className="text-xl font-bold text-gray-800">Nhật ký cảm xúc</h2>
            <p className="text-sm text-gray-600">
              {filteredMoodData.length} mục ghi chép
            </p>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-4 h-4 text-gray-600" />
            <h3 className="font-medium text-gray-700">Bộ lọc</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tìm kiếm</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Tìm theo mood, energy..."
                  value={filters.mood}
                  onChange={(e) => updateFilter('mood', e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Từ ngày</label>
              <input
                type="date"
                value={filters.dateRange.start}
                onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Đến ngày</label>
              <input
                type="date"
                value={filters.dateRange.end}
                onChange={(e) => updateFilter('dateRange', { ...filters.dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasSymptoms}
                  onChange={(e) => updateFilter('hasSymptoms', e.target.checked)}
                  className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Có triệu chứng</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={filters.hasNotes}
                  onChange={(e) => updateFilter('hasNotes', e.target.checked)}
                  className="w-4 h-4 text-pink-500 rounded focus:ring-pink-500"
                />
                <span className="text-sm text-gray-700">Có ghi chú</span>
              </label>
            </div>
          </div>

          <div className="mt-4 flex justify-between items-center">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      {showStats && (
        <div className="mb-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gradient-to-br from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200">
            <div className="flex items-center space-x-3">
              <Heart className="w-6 h-6 text-pink-500" />
              <div>
                <p className="text-sm text-gray-600">Tổng số</p>
                <p className="text-xl font-bold text-pink-600">{stats.totalEntries}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center space-x-3">
              <span className="text-2xl">😊</span>
              <div>
                <p className="text-sm text-gray-600">Tâm trạng phổ biến</p>
                <p className="text-lg font-semibold text-blue-600 capitalize">{stats.averageMood}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-orange-50 to-red-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center space-x-3">
              <AlertTriangle className="w-6 h-6 text-orange-500" />
              <div>
                <p className="text-sm text-gray-600">Triệu chứng phổ biến</p>
                <p className="text-lg font-semibold text-orange-600">{stats.mostCommonSymptoms.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
            <div className="flex items-center space-x-3">
              <Zap className="w-6 h-6 text-green-500" />
              <div>
                <p className="text-sm text-gray-600">Năng lượng phổ biến</p>
                <p className="text-lg font-semibold text-green-600 capitalize">
                  {Object.keys(stats.energyDistribution).length > 0 
                    ? Object.entries(stats.energyDistribution).sort(([,a], [,b]) => b - a)[0]?.[0] 
                    : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Mood Data List */}
      <div className="space-y-4">
        {filteredMoodData.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-600 mb-2">
              {Object.keys(moodData).length === 0 ? 'Chưa có dữ liệu cảm xúc' : 'Không tìm thấy kết quả'}
            </h3>
            <p className="text-sm text-gray-500">
              {Object.keys(moodData).length === 0 
                ? 'Hãy bắt đầu ghi lại cảm xúc hàng ngày'
                : 'Thử thay đổi bộ lọc tìm kiếm'
              }
            </p>
          </div>
        ) : (
          filteredMoodData.map(([date, data]) => (
            <div
              key={date}
              className="bg-gradient-to-r from-pink-50 to-purple-50 p-4 rounded-lg border border-pink-200 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {/* Date */}
                  <div className="flex items-center space-x-2 mb-3">
                    <Calendar className="w-4 h-4 text-pink-500" />
                    <span className="font-medium text-gray-800">{formatDate(date)}</span>
                  </div>

                  {/* Mood and Energy */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                    {data.mood && (
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getMoodEmoji(data.mood)}</span>
                        <span className="text-sm text-gray-600 capitalize">{data.mood}</span>
                      </div>
                    )}
                    
                    {data.energy && (
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">⚡</span>
                        <span className={`text-sm px-2 py-1 rounded-full ${getEnergyColor(data.energy)}`}>
                          {data.energy}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Symptoms */}
                  {data.symptoms && data.symptoms.length > 0 && (
                    <div className="mb-3">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium text-gray-700">Triệu chứng:</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {data.symptoms.map((symptom, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                          >
                            {symptom}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {data.notes && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-700">Ghi chú:</span>
                      </div>
                      <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200">
                        {data.notes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEditMoodData(date, data)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Chỉnh sửa"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Mood Data Modal */}
      <MoodDataModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        date={selectedDate}
        existingMoodData={existingMoodData}
        onSave={handleModalSave}
      />
    </div>
  );
};

export default MoodDataList; 