import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Heart, BarChart3, List, Grid, Plus } from 'lucide-react';
import MoodDataCalendar from '../../components/menstrual-cycle/MoodDataCalendar';
import MonthlyMoodSummary from '../../components/menstrual-cycle/MonthlyMoodSummary';
import MoodDataList from '../../components/menstrual-cycle/MoodDataList';
import MoodDataModal from '../../components/menstrual-cycle/MoodDataModal';
import { useAuth } from '../../contexts/AuthContext';
import useMoodData from '../../hooks/useMoodData';
import { DailyMoodData } from '../../services/menstrualCycleService';

type ViewMode = 'calendar' | 'list' | 'summary';

const MonthlyDiaryPage: React.FC = () => {
  const { user } = useAuth();
  const { moodData, refresh } = useMoodData(user?.id);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalDate, setModalDate] = useState<string>('');
  const [existingMoodData, setExistingMoodData] = useState<DailyMoodData | undefined>();

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setCurrentDate(newDate);
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
    const dateString = date.toISOString().split('T')[0];
    const existingData = moodData[dateString];
    
    setModalDate(dateString);
    setExistingMoodData(existingData);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalDate('');
    setExistingMoodData(undefined);
  };

  const handleModalSave = () => {
    refresh();
  };

  const handleQuickAdd = () => {
    const today = new Date();
    const todayString = today.toISOString().split('T')[0];
    const existingData = moodData[todayString];
    
    setModalDate(todayString);
    setExistingMoodData(existingData);
    setIsModalOpen(true);
  };

  const getViewModeIcon = (mode: ViewMode) => {
    switch (mode) {
      case 'calendar':
        return <Calendar className="w-4 h-4" />;
      case 'list':
        return <List className="w-4 h-4" />;
      case 'summary':
        return <BarChart3 className="w-4 h-4" />;
    }
  };

  const getViewModeLabel = (mode: ViewMode) => {
    switch (mode) {
      case 'calendar':
        return 'Lịch';
      case 'list':
        return 'Danh sách';
      case 'summary':
        return 'Tổng quan';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigateMonth('prev')}
                className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="text-center">
                <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                  {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                </h1>
                <p className="text-gray-600 mt-1">Nhật ký cảm xúc hàng tháng</p>
              </div>
              
              <button
                onClick={() => navigateMonth('next')}
                className="p-2 hover:bg-white hover:shadow-md rounded-full transition-all"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <button
              onClick={handleQuickAdd}
              className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:from-pink-600 hover:to-purple-600 transition-all shadow-lg hover:shadow-xl"
            >
              <Plus className="w-5 h-5" />
              <span>Thêm hôm nay</span>
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-1 shadow-md">
              {(['calendar', 'list', 'summary'] as ViewMode[]).map((mode) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-all ${
                    viewMode === mode
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  {getViewModeIcon(mode)}
                  <span className="font-medium">{getViewModeLabel(mode)}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {viewMode === 'calendar' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Calendar */}
              <div className="lg:col-span-2">
                <MoodDataCalendar
                  currentDate={currentDate}
                  onDateSelect={handleDateSelect}
                  showMoodIndicators={true}
                />
              </div>

              {/* Quick Stats */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Heart className="w-5 h-5 text-pink-500 mr-2" />
                    Thống kê nhanh
                  </h3>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg">
                      <span className="text-sm text-gray-600">Ngày có ghi chép</span>
                      <span className="font-bold text-pink-600">
                        {Object.keys(moodData).filter(date => {
                          const dateObj = new Date(date);
                          return dateObj.getMonth() === currentDate.getMonth() && 
                                 dateObj.getFullYear() === currentDate.getFullYear();
                        }).length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                      <span className="text-sm text-gray-600">Tổng số ghi chép</span>
                      <span className="font-bold text-blue-600">
                        {Object.keys(moodData).length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg">
                      <span className="text-sm text-gray-600">Tháng này</span>
                      <span className="font-bold text-green-600">
                        {monthNames[currentDate.getMonth()]}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Thao tác nhanh</h3>
                  
                  <div className="space-y-3">
                    <button
                      onClick={handleQuickAdd}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Thêm ghi chép hôm nay</span>
                    </button>
                    
                    <button
                      onClick={() => setViewMode('summary')}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors"
                    >
                      <BarChart3 className="w-4 h-4" />
                      <span>Xem tổng quan tháng</span>
                    </button>
                    
                    <button
                      onClick={() => setViewMode('list')}
                      className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <List className="w-4 h-4" />
                      <span>Xem danh sách ghi chép</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
              {/* Mood Data List */}
              <div className="lg:col-span-3">
                <MoodDataList
                  showFilters={true}
                  showStats={true}
                />
              </div>

              {/* Filters Sidebar */}
              <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Bộ lọc nhanh</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Tháng</label>
                      <select
                        value={`${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}`}
                        onChange={(e) => {
                          const [year, month] = e.target.value.split('-');
                          setCurrentDate(new Date(parseInt(year), parseInt(month) - 1));
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                      >
                        {Array.from({ length: 12 }, (_, i) => {
                          const date = new Date();
                          date.setMonth(date.getMonth() - i);
                          return (
                            <option
                              key={i}
                              value={`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`}
                            >
                              {monthNames[date.getMonth()]} {date.getFullYear()}
                            </option>
                          );
                        })}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">Thống kê</h3>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tổng ghi chép</span>
                      <span className="font-semibold text-gray-800">
                        {Object.keys(moodData).length}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Tháng này</span>
                      <span className="font-semibold text-gray-800">
                        {Object.keys(moodData).filter(date => {
                          const dateObj = new Date(date);
                          return dateObj.getMonth() === currentDate.getMonth() && 
                                 dateObj.getFullYear() === currentDate.getFullYear();
                        }).length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {viewMode === 'summary' && (
            <div className="space-y-8">
              {/* Monthly Summary */}
              <MonthlyMoodSummary
                year={currentDate.getFullYear()}
                month={currentDate.getMonth() + 1}
              />

              {/* Calendar Preview */}
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Lịch tháng {monthNames[currentDate.getMonth()]}</h3>
                <MoodDataCalendar
                  currentDate={currentDate}
                  onDateSelect={handleDateSelect}
                  showMoodIndicators={true}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mood Data Modal */}
        <MoodDataModal
          isOpen={isModalOpen}
          onClose={handleModalClose}
          date={modalDate}
          existingMoodData={existingMoodData}
          onSave={handleModalSave}
        />
      </div>
    </div>
  );
};

export default MonthlyDiaryPage; 