import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../../components/ui/dialog';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/Input';
import { Label } from '../../../components/ui/label';
import { Textarea } from '../../../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Badge } from '../../../components/ui/badge';
import { DailyMoodData } from '../../../services/menstrualCycleService';
import { 
  FaSmile, 
  FaFrown, 
  FaMeh, 
  FaRegCircle, 
  FaTimes, 
  FaSave,
  FaTrash,
  FaHeart,
  FaBolt,
  FaThermometerHalf
} from 'react-icons/fa';

interface MoodModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (moodData: DailyMoodData) => void;
  initialMoodData?: DailyMoodData | null;
  selectedDate: Date;
}

const MoodModal: React.FC<MoodModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialMoodData,
  selectedDate
}) => {
  const [moodData, setMoodData] = useState<DailyMoodData>({
    mood: 'neutral',
    energy: 'medium',
    symptoms: [],
    notes: undefined
  });
  const [newSymptom, setNewSymptom] = useState('');

  useEffect(() => {
    if (initialMoodData) {
      setMoodData(initialMoodData);
    } else {
      setMoodData({
        mood: 'neutral',
        energy: 'medium',
        symptoms: [],
        notes: undefined
      });
    }
  }, [initialMoodData]);

  const handleSave = () => {
    onSave(moodData);
    onClose();
  };

  const handleDelete = () => {
    onSave({
      mood: 'neutral',
      energy: 'medium',
      symptoms: [],
      notes: undefined
    });
    onClose();
  };

  const addSymptom = () => {
    if (newSymptom.trim() && !moodData.symptoms.includes(newSymptom.trim())) {
      setMoodData(prev => ({
        ...prev,
        symptoms: [...prev.symptoms, newSymptom.trim()]
      }));
      setNewSymptom('');
    }
  };

  const removeSymptom = (symptom: string) => {
    setMoodData(prev => ({
      ...prev,
      symptoms: prev.symptoms.filter(s => s !== symptom)
    }));
  };

  const getMoodIcon = (mood: string) => {
    switch (mood) {
      case 'happy': return <FaSmile className="text-yellow-500" />;
      case 'sad': return <FaFrown className="text-blue-500" />;
      case 'tired': return <FaMeh className="text-gray-500" />;
      case 'excited': return <FaSmile className="text-orange-500" />;
      case 'calm': return <FaRegCircle className="text-green-500" />;
      case 'stressed': return <FaFrown className="text-red-500" />;
      default: return <FaMeh className="text-gray-400" />;
    }
  };

  const getEnergyIcon = (energy: string) => {
    switch (energy) {
      case 'high': return <FaBolt className="text-yellow-500" />;
      case 'medium': return <FaThermometerHalf className="text-orange-500" />;
      case 'low': return <FaHeart className="text-red-500" />;
      default: return <FaThermometerHalf className="text-gray-400" />;
    }
  };

  const getMoodLabel = (mood: string) => {
    switch (mood) {
      case 'happy': return 'Vui vẻ';
      case 'sad': return 'Buồn';
      case 'tired': return 'Mệt mỏi';
      case 'excited': return 'Hồi hộp';
      case 'calm': return 'Bình tĩnh';
      case 'stressed': return 'Căng thẳng';
      case 'neutral': return 'Bình thường';
      default: return 'Bình thường';
    }
  };

  const getEnergyLabel = (energy: string) => {
    switch (energy) {
      case 'high': return 'Cao';
      case 'medium': return 'Trung bình';
      case 'low': return 'Thấp';
      default: return 'Trung bình';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FaHeart className="text-pink-500" />
            Ghi chú cảm xúc - {selectedDate.toLocaleDateString('vi-VN')}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Mood Selection */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Tâm trạng</Label>
            <Select
              value={moodData.mood}
              onValueChange={(value: 'happy' | 'sad' | 'tired' | 'excited' | 'calm' | 'stressed' | 'neutral') =>
                setMoodData(prev => ({ ...prev, mood: value }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getMoodIcon(moodData.mood)}
                    <span>{getMoodLabel(moodData.mood)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="happy">
                  <div className="flex items-center gap-2">
                    <FaSmile className="text-yellow-500" />
                    <span>Vui vẻ</span>
                  </div>
                </SelectItem>
                <SelectItem value="sad">
                  <div className="flex items-center gap-2">
                    <FaFrown className="text-blue-500" />
                    <span>Buồn</span>
                  </div>
                </SelectItem>
                <SelectItem value="tired">
                  <div className="flex items-center gap-2">
                    <FaMeh className="text-gray-500" />
                    <span>Mệt mỏi</span>
                  </div>
                </SelectItem>
                <SelectItem value="excited">
                  <div className="flex items-center gap-2">
                    <FaSmile className="text-orange-500" />
                    <span>Hồi hộp</span>
                  </div>
                </SelectItem>
                <SelectItem value="calm">
                  <div className="flex items-center gap-2">
                    <FaRegCircle className="text-green-500" />
                    <span>Bình tĩnh</span>
                  </div>
                </SelectItem>
                <SelectItem value="stressed">
                  <div className="flex items-center gap-2">
                    <FaFrown className="text-red-500" />
                    <span>Căng thẳng</span>
                  </div>
                </SelectItem>
                <SelectItem value="neutral">
                  <div className="flex items-center gap-2">
                    <FaMeh className="text-gray-400" />
                    <span>Bình thường</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Energy Level */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Mức năng lượng</Label>
            <Select
              value={moodData.energy}
              onValueChange={(value: 'high' | 'medium' | 'low') =>
                setMoodData(prev => ({ ...prev, energy: value }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  <div className="flex items-center gap-2">
                    {getEnergyIcon(moodData.energy)}
                    <span>{getEnergyLabel(moodData.energy)}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high">
                  <div className="flex items-center gap-2">
                    <FaBolt className="text-yellow-500" />
                    <span>Cao</span>
                  </div>
                </SelectItem>
                <SelectItem value="medium">
                  <div className="flex items-center gap-2">
                    <FaThermometerHalf className="text-orange-500" />
                    <span>Trung bình</span>
                  </div>
                </SelectItem>
                <SelectItem value="low">
                  <div className="flex items-center gap-2">
                    <FaHeart className="text-red-500" />
                    <span>Thấp</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Symptoms */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Triệu chứng</Label>
            <div className="flex gap-2">
              <Input
                value={newSymptom}
                onChange={(e) => setNewSymptom(e.target.value)}
                placeholder="Thêm triệu chứng..."
                onKeyPress={(e) => e.key === 'Enter' && addSymptom()}
              />
              <Button onClick={addSymptom} size="sm" variant="outline">
                Thêm
              </Button>
            </div>
            {moodData.symptoms.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {moodData.symptoms.map((symptom, index) => (
                  <Badge key={index} variant="secondary" className="flex items-center gap-1">
                    {symptom}
                    <button
                      onClick={() => removeSymptom(symptom)}
                      className="ml-1 hover:text-red-500"
                    >
                      <FaTimes className="text-xs" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Ghi chú</Label>
            <Textarea
              value={moodData.notes || ''}
              onChange={(e) => setMoodData(prev => ({ 
                ...prev, 
                notes: e.target.value.trim() || undefined 
              }))}
              placeholder="Ghi chú thêm về cảm xúc của bạn..."
              rows={3}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave} className="flex-1 bg-gradient-to-r from-pink-500 to-purple-500">
              <FaSave className="mr-2" />
              Lưu
            </Button>
            {initialMoodData && (
              <Button onClick={handleDelete} variant="destructive">
                <FaTrash className="mr-2" />
                Xóa
              </Button>
            )}
            <Button onClick={onClose} variant="outline">
              <FaTimes className="mr-2" />
              Hủy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MoodModal; 
interface MoodData {
  mood: string;
  energy: string;
  symptoms: string[];
  notes?: string;
}

interface MoodOption {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  color: string;
  bgColor: string;
}

const MoodModal: React.FC<MoodModalProps> = ({ isOpen, selectedDate, onClose, onSave }) => {
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedEnergy, setSelectedEnergy] = useState<string>('');
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [notes, setNotes] = useState('');

  const moodOptions: MoodOption[] = [
    { id: 'happy', label: 'Vui vẻ', icon: FaSmile, color: 'text-blue-600', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { id: 'excited', label: 'Hưng phấn', icon: FaGrin, color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
    { id: 'calm', label: 'Bình tĩnh', icon: FaStar, color: 'text-blue-700', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { id: 'neutral', label: 'Bình thường', icon: FaMeh, color: 'text-gray-600', bgColor: 'bg-gray-50 hover:bg-gray-100 border-gray-200' },
    { id: 'tired', label: 'Mệt mỏi', icon: FaBatteryEmpty, color: 'text-indigo-700', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
    { id: 'sad', label: 'Buồn', icon: FaFrown, color: 'text-blue-500', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { id: 'angry', label: 'Tức giận', icon: FaAngry, color: 'text-indigo-500', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
  ];

  const energyOptions: MoodOption[] = [
    { id: 'high', label: 'Cao', icon: FaBolt, color: 'text-blue-600', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
    { id: 'medium', label: 'Trung bình', icon: FaBatteryHalf, color: 'text-indigo-600', bgColor: 'bg-indigo-50 hover:bg-indigo-100 border-indigo-200' },
    { id: 'low', label: 'Thấp', icon: FaBatteryEmpty, color: 'text-blue-700', bgColor: 'bg-blue-50 hover:bg-blue-100 border-blue-200' },
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
                  <FaHeart className="text-white" />
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
              <FaTimes />
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
                  <FaHeart className="text-blue-500" />
                  Tâm trạng hôm nay của bạn?
                </h3>
                <div className="grid grid-cols-2 gap-3">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => setSelectedMood(mood.id)}
                      className={`p-4 rounded-xl border-2 transition-all duration-300 flex flex-col items-center gap-3 group relative ${
                        selectedMood === mood.id 
                          ? 'border-pink-400 bg-gradient-to-br from-pink-50 to-purple-50 scale-105 shadow-lg ring-2 ring-pink-200 animate-in zoom-in duration-200' 
                          : `border-gray-200 ${mood.bgColor} hover:border-pink-300 hover:shadow-md hover:scale-102 active:scale-98`
                      }`}
                    >
                      <div className={`text-3xl transition-all duration-300 ${
                        selectedMood === mood.id ? 'scale-110' : 'group-hover:scale-110'
                      }`}>
                        <mood.icon className="text-3xl" />
                          </div>
                      <span className={`text-sm font-medium transition-colors duration-200 ${
                        selectedMood === mood.id ? 'text-pink-800' : 'text-gray-700 group-hover:text-pink-700'
                      }`}>
                        {mood.label}
                      </span>
                      {selectedMood === mood.id && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-pink-500 rounded-full flex items-center justify-center animate-in zoom-in duration-200">
                          <FaCheck className="text-white text-xs" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Energy Level */}
              <div>
                <h3 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <FaBolt className="text-indigo-500" />
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
                      <div className="text-2xl">
                        <energy.icon className="text-2xl" />
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
                  <FaStethoscope className="text-indigo-500" />
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
                        <FaCheck className="inline ml-1 text-xs" />
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
                  <FaStar className="text-blue-500" />
                  Tóm tắt lựa chọn:
                </h4>
                <div className="grid md:grid-cols-3 gap-4">
                  {selectedMood && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-100 text-blue-800 border border-blue-200">
                        Tâm trạng: {moodOptions.find(m => m.id === selectedMood)?.label}
                      </Badge>
                    </div>
                  )}
                  {selectedEnergy && (
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-100 text-indigo-800 border border-indigo-200">
                        Năng lượng: {energyOptions.find(e => e.id === selectedEnergy)?.label}
                      </Badge>
                    </div>
                  )}
                  {selectedSymptoms.length > 0 && (
                    <div className="col-span-full">
                      <p className="text-sm font-medium text-gray-700 mb-2">Triệu chứng:</p>
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
                <FaCheck className="mr-2" />
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
export default MoodModal; 