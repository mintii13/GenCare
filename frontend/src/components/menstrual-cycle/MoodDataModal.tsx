import React, { useState, useEffect } from 'react';
import { X, Edit, Save, Trash2, Calendar, Heart, Zap, AlertTriangle, FileText } from 'lucide-react';
import { DailyMoodData } from '../../services/menstrualCycleService';
import { useMoodDataForm, useMoodDataValidation, useMoodDataCRUD } from '../../hooks/useMoodDataOperations';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface MoodDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  date: string;
  existingMoodData?: DailyMoodData;
  onSave?: () => void;
}

const MoodDataModal: React.FC<MoodDataModalProps> = ({
  isOpen,
  onClose,
  date,
  existingMoodData,
  onSave
}) => {
  const { user } = useAuth();
  const { formData, updateFormData, resetForm, setFormDataFromExisting } = useMoodDataForm();
  const { validationErrors, validateMoodData, clearValidationErrors } = useMoodDataValidation();
  const { handleCreateMoodData, handleUpdateMoodData, handleDeleteMoodData, loading } = useMoodDataCRUD(user?.id);

  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Initialize form data when modal opens
  useEffect(() => {
    if (isOpen) {
      if (existingMoodData) {
        setFormDataFromExisting(existingMoodData);
        setIsEditing(false);
      } else {
        resetForm();
        setIsEditing(true);
      }
      clearValidationErrors();
    }
  }, [isOpen, existingMoodData, setFormDataFromExisting, resetForm, clearValidationErrors]);

  const handleSave = async () => {
    if (!validateMoodData(formData)) {
      toast.error('Vui lòng kiểm tra lại thông tin');
      return;
    }

    const success = existingMoodData
      ? await handleUpdateMoodData(date, formData)
      : await handleCreateMoodData(date, formData);

    if (success) {
      setIsEditing(false);
      onSave?.();
      if (!existingMoodData) {
        onClose();
      }
    }
  };

  const handleDelete = async () => {
    const success = await handleDeleteMoodData(date);
    if (success) {
      onSave?.();
      onClose();
    }
    setShowDeleteConfirm(false);
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
    { value: 'angry', label: 'Tức giận', emoji: '😠' },
    { value: 'anxious', label: 'Lo lắng', emoji: '😨' }
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
            {validationErrors.mood && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.mood}</p>
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
                    <div className={`font-medium ${option.color}`}>{option.label}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                {formData.energy ? (
                  <span className="font-medium">
                    {energyOptions.find(opt => opt.value === formData.energy)?.label}
                  </span>
                ) : (
                  <span className="text-gray-500">Chưa có dữ liệu</span>
                )}
              </div>
            )}
            {validationErrors.energy && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.energy}</p>
            )}
          </div>

          {/* Symptoms */}
          <div>
            <label className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-3">
              <AlertTriangle className="w-4 h-4 text-orange-500" />
              <span>Triệu chứng</span>
            </label>
            {isEditing ? (
              <div className="grid grid-cols-2 gap-2">
                {symptomOptions.map(symptom => (
                  <label key={symptom} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.symptoms?.includes(symptom) || false}
                      onChange={(e) => {
                        const currentSymptoms = formData.symptoms || [];
                        if (e.target.checked) {
                          updateFormData('symptoms', [...currentSymptoms, symptom]);
                        } else {
                          updateFormData('symptoms', currentSymptoms.filter(s => s !== symptom));
                        }
                      }}
                      className="w-4 h-4 text-orange-500 rounded focus:ring-orange-500"
                    />
                    <span className="text-sm">{symptom}</span>
                  </label>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                {formData.symptoms && formData.symptoms.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {formData.symptoms.map(symptom => (
                      <span
                        key={symptom}
                        className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full"
                      >
                        {symptom}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-gray-500">Không có triệu chứng</span>
                )}
              </div>
            )}
            {validationErrors.symptoms && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.symptoms}</p>
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
                placeholder="Ghi chú về cảm xúc, triệu chứng hoặc bất kỳ điều gì khác..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows={4}
                maxLength={500}
              />
            ) : (
              <div className="p-3 bg-gray-50 rounded-lg">
                {formData.notes ? (
                  <p className="text-sm whitespace-pre-wrap">{formData.notes}</p>
                ) : (
                  <span className="text-gray-500">Không có ghi chú</span>
                )}
              </div>
            )}
            {validationErrors.notes && (
              <p className="text-red-500 text-xs mt-1">{validationErrors.notes}</p>
            )}
            {isEditing && (
              <p className="text-xs text-gray-500 mt-1">
                {formData.notes?.length || 0}/500 ký tự
              </p>
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
                      setFormDataFromExisting(existingMoodData);
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