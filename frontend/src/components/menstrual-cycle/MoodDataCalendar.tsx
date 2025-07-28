import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Plus, Heart, Zap, AlertTriangle } from 'lucide-react';
import { MoodData, DailyMoodData } from '../../services/menstrualCycleService';
import MoodDataModal from './MoodDataModal';
import useMoodData from '../../hooks/useMoodData';
import { useAuth } from '../../contexts/AuthContext';

interface MoodDataCalendarProps {
  currentDate?: Date;
  onDateSelect?: (date: Date) => void;
  showMoodIndicators?: boolean;
}

const MoodDataCalendar: React.FC<MoodDataCalendarProps> = ({
  currentDate = new Date(),
  onDateSelect,
  showMoodIndicators = true
}) => {
  const { user } = useAuth();
  const { moodData, refresh } = useMoodData(user?.id);
  
  const [selectedDate, setSelectedDate] = useState<Date>(currentDate);
  const [modalDate, setModalDate] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [existingMoodData, setExistingMoodData] = useState<DailyMoodData | undefined>();

  // Calculate calendar data
  const calendarData = useMemo(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= lastDay || days.length < 42) {
      days.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [selectedDate]);

  const monthNames = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'
  ];

  const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

  const handleDateClick = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const existingData = moodData[dateString];
    
    setModalDate(dateString);
    setExistingMoodData(existingData);
    setIsModalOpen(true);
    onDateSelect?.(date);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setModalDate('');
    setExistingMoodData(undefined);
  };

  const handleModalSave = () => {
    refresh();
  };

  const getMoodIndicator = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    const data = moodData[dateString];
    
    if (!data) return null;

    const indicators = [];

    // Mood indicator
    if (data.mood) {
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
      indicators.push({
        icon: moodEmojis[data.mood] || '😊',
        color: 'text-pink-500',
        tooltip: `Tâm trạng: ${data.mood}`
      });
    }

    // Energy indicator
    if (data.energy) {
      const energyColors = {
        high: 'text-green-500',
        medium: 'text-yellow-500',
        low: 'text-red-500'
      };
      indicators.push({
        icon: '⚡',
        color: energyColors[data.energy as keyof typeof energyColors] || 'text-gray-500',
        tooltip: `Năng lượng: ${data.energy}`
      });
    }

    // Symptoms indicator
    if (data.symptoms && data.symptoms.length > 0) {
      indicators.push({
        icon: '⚠️',
        color: 'text-orange-500',
        tooltip: `${data.symptoms.length} triệu chứng`
      });
    }

    return indicators;
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === selectedDate.getMonth() && 
           date.getFullYear() === selectedDate.getFullYear();
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    setSelectedDate(newDate);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </h2>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        <button
          onClick={() => {
            const today = new Date();
            setModalDate(today.toISOString().split('T')[0]);
            setExistingMoodData(moodData[today.toISOString().split('T')[0]]);
            setIsModalOpen(true);
          }}
          className="flex items-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Thêm hôm nay</span>
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-600">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {calendarData.map((date, index) => {
          const moodIndicators = showMoodIndicators ? getMoodIndicator(date) : null;
          const hasMoodData = moodData[date.toISOString().split('T')[0]];
          
          return (
            <div
              key={index}
              onClick={() => handleDateClick(date)}
              className={`
                relative p-2 min-h-[80px] border border-gray-200 rounded-lg cursor-pointer
                transition-all hover:bg-gray-50 hover:border-pink-300
                ${isToday(date) ? 'bg-pink-50 border-pink-300' : ''}
                ${!isCurrentMonth(date) ? 'text-gray-400 bg-gray-50' : 'text-gray-800'}
                ${hasMoodData ? 'bg-gradient-to-br from-pink-50 to-purple-50 border-pink-200' : ''}
              `}
            >
              {/* Date number */}
              <div className="text-sm font-medium mb-1">
                {date.getDate()}
              </div>

              {/* Mood indicators */}
              {showMoodIndicators && moodIndicators && (
                <div className="flex flex-wrap gap-1">
                  {moodIndicators.slice(0, 2).map((indicator, idx) => (
                    <div
                      key={idx}
                      className={`text-xs ${indicator.color}`}
                      title={indicator.tooltip}
                    >
                      {indicator.icon}
                    </div>
                  ))}
                  {moodIndicators.length > 2 && (
                    <div className="text-xs text-gray-500">
                      +{moodIndicators.length - 2}
                    </div>
                  )}
                </div>
              )}

              {/* Add mood data indicator */}
              {!hasMoodData && isCurrentMonth(date) && (
                <div className="absolute bottom-1 right-1">
                  <div className="w-2 h-2 bg-gray-300 rounded-full opacity-50"></div>
                </div>
              )}

              {/* Today indicator */}
              {isToday(date) && (
                <div className="absolute top-1 right-1">
                  <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      {showMoodIndicators && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-3">Chú thích</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="flex items-center space-x-2">
              <span>😊</span>
              <span>Tâm trạng</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>⚡</span>
              <span>Năng lượng</span>
            </div>
            <div className="flex items-center space-x-2">
              <span>⚠️</span>
              <span>Triệu chứng</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-pink-500 rounded-full"></div>
              <span>Hôm nay</span>
            </div>
          </div>
        </div>
      )}

      {/* Mood Data Modal */}
      <MoodDataModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        date={modalDate}
        existingMoodData={existingMoodData}
        onSave={handleModalSave}
      />
    </div>
  );
};

export default MoodDataCalendar; 