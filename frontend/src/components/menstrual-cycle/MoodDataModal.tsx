import React, { useState, useEffect } from 'react';
import { X, Edit, Save, Trash2, Calendar, Heart, Zap, AlertTriangle, FileText } from 'lucide-react';
import { DailyMoodData, menstrualCycleService } from '../../services/menstrualCycleService';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface MoodDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  existingMoodData?: DailyMoodData;
  onSave?: () => void;
  forceEditMode?: boolean;
}

const MoodDataModal: React.FC<MoodDataModalProps> = ({
  isOpen,
  onClose,
  date,
  existingMoodData,
  onSave,
  forceEditMode = false
}) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<DailyMoodData>({
    mood: 'neutral',
    energy: 'medium',
    symptoms: [],
    notes: ''
  });

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (forceEditMode || !existingMoodData || existingMoodData.mood === 'neutral') {
        // Force edit mode or no existing data, show in edit mode
        setFormData({
          mood: 'neutral',
          energy: 'medium',
          symptoms: [],
          notes: ''
        });
        setIsEditing(true);
      } else {
        // If there's existing mood data with actual values, show in view mode
        setFormData(existingMoodData);
        setIsEditing(false);
      }
    }
  }, [isOpen, existingMoodData, forceEditMode]);

  const updateFormData = (field: keyof DailyMoodData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSave = async () => {
    if (!date || !user?.id) {
      toast.error('Dữ liệu không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      let response;
      
      // If no existing mood data, create new period day
      if (!existingMoodData || existingMoodData.mood === 'neutral') {
        response = await menstrualCycleService.createPeriodDayWithMood(date, formData);
      } else {
        // Update existing period day
        response = await menstrualCycleService.updatePeriodDayMood(date, formData);
      }
      
      if (response.success) {
        toast.success('Lưu cảm xúc thành công!');
        setIsEditing(false);
        onSave?.();
        if (!existingMoodData) {
          onClose();
        }
      } else {
        toast.error(response.message || 'Lỗi khi lưu cảm xúc');
      }
    } catch (error: any) {
      console.error('Lỗi khi lưu cảm xúc:', error);
      toast.error('Lỗi khi lưu cảm xúc: ' + (error.message || 'Không xác định'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!date || !user?.id) {
      toast.error('Dữ liệu không hợp lệ');
      return;
    }

    setLoading(true);
    try {
      // Reset mood data to default
      const defaultMoodData: DailyMoodData = {
        mood: 'neutral',
        energy: 'medium',
        symptoms: [],
        notes: ''
      };
      
      const response = await menstrualCycleService.updatePeriodDayMood(date, defaultMoodData);
      
      if (response.success) {
        toast.success('Đã xóa dữ liệu cảm xúc');
        onSave?.();
        onClose();
      } else {
        toast.error(response.message || 'Lỗi khi xóa dữ liệu');
      }
    } catch (error: any) {
      console.error('Lỗi khi xóa dữ liệu:', error);
      toast.error('Lỗi khi xóa dữ liệu: ' + (error.message || 'Không xác định'));
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
    }
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

  const moodOptions = [
    { value: 'happy', label: 'Vui vẻ', emoji: '😊' },
    { value: 'excited', label: 'Hào hứng', emoji: '🤩' },
    { value: 'calm', label: 'Bình tĩnh', emoji: '😌' },
    { value: 'tired', label: 'Mệt mỏi', emoji: '😴' },
    { value: 'stressed', label: 'Căng thẳng', emoji: '😰' },
    { value: 'sad', label: 'Buồn', emoji: '😢' },
    { value: 'neutral', label: 'Bình thường', emoji: '😐' }
  ];

  const energyOptions = [
    { value: 'high', label: 'Cao', color: 'text-green-600' },
    { value: 'medium', label: 'Trung bình', color: 'text-yellow-600' },
    { value: 'low', label: 'Thấp', color: 'text-red-600' }
  ];

  const symptomOptions = [
    'Đau bụng', 'Đau lưng', 'Đau đầu', 'Mệt mỏi', 'Chuột rút',
    'Đầy hơi', 'Buồn nôn', 'Chóng mặt', 'Nóng bừng', 'Đổ mồ hôi',
    'Khó ngủ', 'Thay đổi tâm trạng', 'Thèm ăn', 'Sưng ngực'
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Calendar className="w-6 h-6 text-pink-500" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {existingMoodData ? 'Chi tiết cảm xúc' : 'Thêm cảm xúc mới'}
              </h2>
              <p className="text-sm text-gray-600">{formatDate(date)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Mood Selection */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <Heart className="w-4 h-4 text-pink-500" />
              <span>Tâm trạng</span>
            </label>
            {isEditing ? (
              <div className="grid grid-cols-4 gap-3">
                {moodOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateFormData('mood', option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.mood === option.value
                        ? 'border-pink-500 bg-pink-50'
                        : 'border-gray-200 hover:border-pink-300'
                    }`}
                  >
                    <div className="text-2xl mb-1">{option.emoji}</div>
                    <div className="text-xs font-medium">{option.label}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {formData.mood ? (
                  <>
                    <span className="text-2xl">
                      {moodOptions.find(opt => opt.value === formData.mood)?.emoji}
                    </span>
                    <span className="font-medium">
                      {moodOptions.find(opt => opt.value === formData.mood)?.label}
                    </span>
                  </>
                ) : (
                  <span className="text-gray-500">Chưa có dữ liệu</span>
                )}
              </div>
            )}
          </div>

          {/* Energy Level */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <Zap className="w-4 h-4 text-yellow-500" />
              <span>Mức năng lượng</span>
            </label>
            {isEditing ? (
              <div className="grid grid-cols-3 gap-3">
                {energyOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => updateFormData('energy', option.value)}
                    className={`p-3 rounded-lg border-2 transition-all ${
                      formData.energy === option.value
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-200 hover:border-yellow-300'
                    }`}
                  >
                    <div className={`text-lg font-medium ${option.color}`}>
                      {option.label}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <span className="font-medium">
                  {energyOptions.find(opt => opt.value === formData.energy)?.label || 'Trung bình'}
                </span>
              </div>
            )}
          </div>

          {/* Symptoms */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span>Triệu chứng</span>
            </label>
            {isEditing ? (
              <div className="space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  {symptomOptions.map(symptom => (
                    <label key={symptom} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={formData.symptoms.includes(symptom)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            updateFormData('symptoms', [...formData.symptoms, symptom]);
                          } else {
                            updateFormData('symptoms', formData.symptoms.filter(s => s !== symptom));
                          }
                        }}
                        className="rounded border-gray-300 text-pink-500 focus:ring-pink-500"
                      />
                      <span className="text-sm">{symptom}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                {formData.symptoms.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {formData.symptoms.map(symptom => (
                      <span key={symptom} className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded">
                        {symptom}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">Không có triệu chứng</span>
                )}
              </div>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <FileText className="w-4 h-4 text-blue-500" />
              <span>Ghi chú</span>
            </label>
            {isEditing ? (
              <textarea
                value={formData.notes || ''}
                onChange={(e) => updateFormData('notes', e.target.value)}
                placeholder="Ghi chú về cảm xúc hoặc triệu chứng..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={3}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                {formData.notes ? (
                  <p className="text-sm">{formData.notes}</p>
                ) : (
                  <span className="text-gray-500">Không có ghi chú</span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200">
          <div className="flex space-x-3">
            {existingMoodData && (
              <>
                {!isEditing ? (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                    <span>Chỉnh sửa</span>
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setFormData(existingMoodData);
                    }}
                    className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                  >
                    Hủy
                  </button>
                )}
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Xóa</span>
                </button>
              </>
            )}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Đóng
            </button>
            {isEditing && (
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center space-x-2 px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Lưu</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-bold text-gray-800 mb-4">Xác nhận xóa</h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa dữ liệu cảm xúc cho ngày {formatDate(date)} không?
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MoodDataModal; 