import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { FaTimes, FaCheck, FaHeart, FaSadTear, FaSmile, FaMeh, FaAngry, FaTired, FaGrinHearts } from 'react-icons/fa';
import { HiSparkles } from 'react-icons/hi';

interface MoodModalProps {
  isOpen: boolean;
  selectedDate: Date;
  onClose: () => void;
  onSave: (moodData: MoodData) => void;
}

interface MoodData {
  mood: string;
  energy: string;
  symptoms: string[];
  notes?: string;
}

interface MoodOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const MoodModal: React.FC<MoodModalProps> = ({ isOpen, selectedDate, onClose, onSave }) => {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedEnergy, setSelectedEnergy] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const moodOptions: MoodOption[] = [
    { id: 'happy', label: 'Vui vẻ', icon: <FaSmile />, color: 'text-blue-600', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { id: 'excited', label: 'Hưng phấn', icon: <FaGrinHearts />, color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
    { id: 'calm', label: 'Bình tĩnh', icon: <FaHeart />, color: 'text-blue-700', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { id: 'neutral', label: 'Bình thường', icon: <FaMeh />, color: 'text-gray-600', bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-200' },
    { id: 'tired', label: 'Mệt mỏi', icon: <FaTired />, color: 'text-indigo-700', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
    { id: 'sad', label: 'Buồn', icon: <FaSadTear />, color: 'text-blue-500', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { id: 'angry', label: 'Tức giận', icon: <FaAngry />, color: 'text-indigo-500', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
  ];

  const energyOptions: MoodOption[] = [
    { id: 'high', label: 'Cao', icon: <HiSparkles />, color: 'text-blue-600', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { id: 'medium', label: 'Trung bình', icon: <FaHeart />, color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
    { id: 'low', label: 'Thấp', icon: <FaTired />, color: 'text-blue-700', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
  ];

  const symptomOptions = [
    'Đau bụng dưới', 'Đau lưng', 'Đau đầu', 'Buồn nôn', 
    'Căng thẳng', 'Mụn trứng cá', 'Khó ngủ', 'Thèm ăn',
    'Tâm trạng thay đổi', 'Chóng mặt', 'Mệt mỏi', 'Ợ chua'
  ];

  const handleSymptomToggle = (symptom: string) => {
    setSelectedSymptoms(prev => {
      if (prev.includes(symptom)) {
        return prev.filter(s => s !== symptom);
      } else {
        return [...prev, symptom];
      }
    });
  };

  const handleSave = () => {
    
    
    const moodData: MoodData = {
      mood: selectedMood,
      energy: selectedEnergy,
      symptoms: selectedSymptoms,
      notes: notes.trim() || undefined
    };
    
    
    onSave(moodData);
    // KHÔNG gọi handleClose() ở đây! Để CycleCalendar tự xử lý việc đóng modal
    
  };

  const handleClose = () => {
    setSelectedMood('');
    setSelectedEnergy('');
    setSelectedSymptoms([]);
    setNotes('');
    onClose();
  };

  if (!isOpen) return null;



  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-y-auto shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-600 p-6 rounded-t-2xl">
          <div className="flex items-center justify-between text-white">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center backdrop-blur">
                  <HiSparkles className="h-5 w-5" />
                </div>
                Ghi nhận tâm trạng
              </h2>
              <p className="text-white/90 text-sm mt-1">
                {selectedDate.toLocaleDateString('vi-VN', { 
                  weekday: 'long', 
                  day: 'numeric', 
                  month: 'long' 
                })}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="text-white hover:bg-white/20 rounded-lg p-2 transition-all duration-200 hover:scale-110"
            >
              <FaTimes className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6">
          {/* Desktop Layout - 2 Columns */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              {/* Mood Selection */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaHeart className="h-5 w-5 text-blue-500" />
                  Tâm trạng hôm nay của bạn?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group ${
                        selectedMood === mood.id 
                          ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 scale-105 shadow-lg ring-2 ring-pink-200 animate-in zoom-in duration-200' 
                          : `border-gray-200 ${mood.bgColor} hover:border-pink-300 hover:shadow-md hover:scale-102 active:scale-98`
                      }`}
                    >
                      <div className={`text-3xl transition-all duration-300 ${mood.color} ${
                        selectedMood === mood.id ? 'scale-110' : 'group-hover:scale-110'
                      }`}>
                        {mood.icon}
                      </div>
                      <span className={`text-sm font-medium transition-colors duration-200 ${
                        selectedMood === mood.id ? 'text-pink-800' : 'text-gray-700 group-hover:text-pink-700'
                      }`}>
                        {mood.label}
                      </span>
                      {selectedMood === mood.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                          <FaCheck className="h-3 w-3 text-white" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <HiSparkles className="h-5 w-5 text-indigo-500" />
                  Mức năng lượng?
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  {energyOptions.map((energy) => (
                    <button
                      key={energy.id}
                      onClick={() => setSelectedEnergy(energy.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center gap-3 ${
                        selectedEnergy === energy.id 
                          ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-blue-50 scale-105 shadow-lg ring-2 ring-indigo-200' 
                          : `border-gray-200 ${energy.bgColor}`
                      }`}
                    >
                      <div className={`text-2xl ${energy.color}`}>
                        {energy.icon}
                      </div>
                      <span className="text-sm font-medium text-gray-700">
                        {energy.label}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Symptoms */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaHeart className="h-5 w-5 text-indigo-500" />
                  Triệu chứng (có thể chọn nhiều)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  {symptomOptions.map((symptom) => (
                    <button
                      key={symptom}
                      onClick={() => handleSymptomToggle(symptom)}
                      className={`p-3 rounded-lg border text-sm transition-all duration-200 text-left ${
                        selectedSymptoms.includes(symptom)
                          ? 'border-indigo-400 bg-gradient-to-br from-indigo-50 to-blue-50 text-indigo-800 shadow-md'
                          : 'border-gray-200 bg-gray-50 hover:bg-gradient-to-br hover:from-gray-50 hover:to-blue-50 text-gray-700'
                      }`}
                    >
                      {symptom}
                      {selectedSymptoms.includes(symptom) && (
                        <FaCheck className="inline ml-1 h-3 w-3" />
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4">
                  Ghi chú thêm (tùy chọn)
                </h3>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Chia sẻ cảm nhận của bạn về ngày hôm nay..."
                  className="w-full p-4 border border-gray-200 rounded-lg resize-none h-28 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-200 bg-gradient-to-br from-gray-50 to-blue-50"
                />
              </div>
            </div>
          </div>

          {/* Summary & Actions - Full Width */}
          <div className="mt-8 space-y-6">
            {/* Summary */}
            {(selectedMood || selectedEnergy || selectedSymptoms.length > 0) && (
              <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 p-6 rounded-xl border border-blue-200">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <HiSparkles className="h-5 w-5 text-blue-500" />
                  Tóm tắt lựa chọn:
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {selectedMood && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                        🎭 {moodOptions.find(m => m.id === selectedMood)?.label}
                      </Badge>
                    </div>
                  )}
                  {selectedEnergy && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200">
                        ⚡ {energyOptions.find(e => e.id === selectedEnergy)?.label}
                      </Badge>
                    </div>
                  )}
                  {selectedSymptoms.length > 0 && (
                    <div className="col-span-full">
                      <p className="text-sm font-medium text-gray-700 mb-2">🩺 Triệu chứng:</p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSymptoms.map((symptom, index) => (
                          <Badge key={index} className="bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs">
                            {symptom}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-4 justify-center">
              <Button
                variant="outline"
                onClick={handleClose}
                className="px-8 py-3 border-gray-300 hover:bg-gray-50"
              >
                Hủy
              </Button>
              

              
              <Button
                onClick={handleSave}
                disabled={false}
                className="px-8 py-3 bg-gradient-to-r from-blue-500 via-indigo-500 to-blue-600 hover:from-blue-600 hover:via-indigo-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <FaCheck className="h-4 w-4 mr-2" />
                Lưu thông tin
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MoodModal; 