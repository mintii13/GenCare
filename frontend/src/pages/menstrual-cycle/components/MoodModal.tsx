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