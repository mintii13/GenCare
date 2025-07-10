import React, { useState } from 'react';
import { User, Calendar, Heart, AlertTriangle, Shield, CheckCircle, Package, ArrowLeft, ArrowRight } from 'lucide-react';
import { authService } from '../../services/auth';
import { STIAssessmentData, STIAssessmentService } from '../../services/stiAssessmentService';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import toast from 'react-hot-toast';

interface Recommendation {
  recommended_package: string;
  risk_level: 'Thấp' | 'Trung bình' | 'Cao';
  reasoning: string[];
}

const STIAssessmentForm = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);

  const [formData, setFormData] = useState({
    // Thông tin cá nhân
    age: '',
    gender: '',
    is_pregnant: false,
    pregnancy_trimester: '',

    // Thông tin tình dục
    sexually_active: '',
    sexual_orientation: '',
    number_of_partners: '',
    new_partner_recently: false,
    partner_has_sti: false,
    condom_use: 'sometimes', // Default value

    // Tiền sử y tế
    previous_sti_history: [] as string[],
    hiv_status: '',
    last_sti_test: 'never', // Default value
    has_symptoms: false,
    symptoms: [] as string[],

    // Yếu tố nguy cơ
    risk_factors: [] as string[],
    living_area: 'normal', // Set default to 'normal'

    // Mục đích xét nghiệm
    test_purpose: '',
    urgency: 'normal'
  });

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateAge = (value: string) => {
    if (value) {
      const ageNum = parseInt(value);
      if (ageNum < 13 || ageNum > 100) {
        toast.error('Tuổi phải từ 13-100 tuổi', {
          duration: 3000,
          position: 'top-center',
        });
      }
    }
  };

  const handleMultiSelect = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: (prev[field as keyof typeof prev] as string[]).includes(value)
        ? (prev[field as keyof typeof prev] as string[]).filter((item: string) => item !== value)
        : [...(prev[field as keyof typeof prev] as string[]), value]
    }));
  };

  const submitAssessment = async () => {
    setLoading(true);
    try {
      // Get JWT token using authService
      const token = authService.getToken();

      if (!token) {
        toast.error('Vui lòng đăng nhập để sử dụng tính năng này', {
          duration: 4000,
          position: 'top-center',
        });
        setLoading(false);
        return;
      }

      // Prepare form data - auto-set number_of_partners based on sexually_active
      const submissionData = {
        ...formData,
        // Auto-set number_of_partners based on sexually_active selection
        number_of_partners: formData.sexually_active === 'not_active' ? 'none' :
          formData.sexually_active === 'active_single' ? 'one' :
            formData.number_of_partners, // Keep user selection for active_multiple

        // Ensure arrays exist
        previous_sti_history: formData.previous_sti_history || [],
        symptoms: formData.symptoms || [],
        risk_factors: formData.risk_factors || [],

        // Convert age to number
        age: parseInt(formData.age) || 0
      };

      // Clean up empty strings and undefined values to match backend validation
      const cleanedData = Object.fromEntries(
        Object.entries(submissionData).filter(([key, value]) => {
          // Keep boolean values, numbers, and non-empty arrays
          if (typeof value === 'boolean' || typeof value === 'number' || (Array.isArray(value) && value.length > 0)) {
            return true;
          }
          // Keep non-empty strings
          if (typeof value === 'string' && value.trim() !== '') {
            return true;
          }
          // Keep empty arrays for required array fields
          if (Array.isArray(value) && ['previous_sti_history', 'symptoms', 'risk_factors'].includes(key)) {
            return true;
          }
          // Remove empty strings, null, undefined
          return false;
        })
      );

      // Validation bổ sung trước khi submit
      if (!cleanedData.hiv_status) {
        toast.error('Vui lòng chọn tình trạng HIV ở bước 3', {
          duration: 3000,
          position: 'top-center',
        });
        setCurrentStep(3);
        setLoading(false);
        return;
      }

      if (!cleanedData.test_purpose) {
        toast.error('Vui lòng chọn mục đích xét nghiệm ở bước 5', {
          duration: 3000,
          position: 'top-center',
        });
        setCurrentStep(5);
        setLoading(false);
        return;
      }

      console.log('Submitting STI Assessment (cleaned):', cleanedData);

      const result = await STIAssessmentService.createAssessment(cleanedData as unknown as STIAssessmentData);
      console.log('API Response:', result);

      if (result.success) {
        toast.success('Đánh giá STI hoàn thành thành công!', {
          duration: 4000,
          position: 'top-center',
        });
        setRecommendation(result.data?.recommendation || null);
        setCurrentStep(6); // Move to result step
      } else {
        // Hiển thị validation errors chi tiết
        let errorMessage = result.message || 'Không thể tạo đánh giá STI';
        if ((result as any).errors && Array.isArray((result as any).errors)) {
          errorMessage += '\n\nChi tiết lỗi:\n' + (result as any).errors.join('\n');
        }
        toast.error(errorMessage, {
          duration: 5000,
          position: 'top-center',
        });
        console.error('API Error:', result);
      }
    } catch (error) {
      console.error('Error submitting assessment:', error);
      toast.error('Có lỗi xảy ra khi gửi đánh giá. Vui lòng thử lại.', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSTI = async () => {
    if (!recommendation) return;

    setBookingLoading(true);
    try {
      // Get all packages để tìm packageId từ package code
      console.log('Fetching packages with endpoint:', API.STI.GET_ALL_PACKAGES);
      const response = await apiClient.get(API.STI.GET_ALL_PACKAGES);
      const data = response.data as any;

      console.log('API Response:', data);
      console.log('Data keys:', Object.keys(data));
      console.log('data.stippackage:', data.stippackage);
      console.log('Looking for package code:', recommendation.recommended_package);

      if (data.success) {
        // Try different ways to access the packages data
        let packages = data.stippackage || data.stippackages || [];

        // If still empty, try accessing response.data directly
        if (!packages || packages.length === 0) {
          const responseData = response.data as any;
          console.log('Fallback - trying response.data directly:', responseData);
          console.log('responseData.stippackage direct access:', responseData.stippackage);
          console.log('responseData["stippackage"] bracket access:', responseData["stippackage"]);
          console.log('Object.keys(responseData):', Object.keys(responseData));

          // Try different access methods
          packages = responseData.stippackage || responseData.stippackages || responseData["stippackage"] || [];

          // If still empty, let's try to iterate through response data
          if (!packages || packages.length === 0) {
            console.log('Still empty, checking all properties...');
            for (const key in responseData) {
              console.log(`responseData.${key}:`, responseData[key]);
              if (Array.isArray(responseData[key]) && responseData[key].length > 0) {
                console.log(`Found array at ${key}:`, responseData[key]);
                packages = responseData[key];
                break;
              }
            }
          }
        }

        console.log('Available packages:', packages);
        console.log('Packages length:', packages.length);
        console.log('Packages type:', typeof packages);
        console.log('Is array?', Array.isArray(packages));

        if (!Array.isArray(packages)) {
          console.error('Packages is not an array:', packages);
          toast.error('Dữ liệu gói xét nghiệm không hợp lệ', {
            duration: 3000,
            position: 'top-center',
          });
          return;
        }

        // Debug each package to see the exact structure
        packages.forEach((pkg: any, index: number) => {
          console.log(`Package ${index}:`, {
            id: pkg._id,
            name: pkg.sti_package_name,
            code: pkg.sti_package_code,
            fullObject: pkg
          });
        });

        const targetPackage = packages.find((pkg: any) => {
          console.log(`Comparing "${pkg.sti_package_code}" === "${recommendation.recommended_package}"`);
          return pkg.sti_package_code === recommendation.recommended_package;
        });



        if (targetPackage) {
          // Convert _id to string to make sure it's not an object
          const packageId = typeof targetPackage._id === 'object'
            ? targetPackage._id.toString()
            : targetPackage._id;

          console.log('Final packageId for navigation:', packageId);

          // Navigate đến BookSTIPage với packageId
          navigate(`/sti-booking/book?packageId=${packageId}`);
        } else {
          toast.error(`Không tìm thấy gói xét nghiệm với mã: ${recommendation.recommended_package}`, {
            duration: 4000,
            position: 'top-center',
          });
        }
      } else {
        console.error('API returned success: false', data);
        toast.error('Không thể tải thông tin gói xét nghiệm: ' + (data.message || 'Unknown error'), {
          duration: 4000,
          position: 'top-center',
        });
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
      toast.error('Có lỗi xảy ra khi tải thông tin gói xét nghiệm', {
        duration: 4000,
        position: 'top-center',
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold">Thông tin cá nhân</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tuổi *</label>
          <input
            type="number"
            value={formData.age}
            onChange={(e) => updateFormData('age', e.target.value)}
            onBlur={(e) => validateAge(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Nhập tuổi của bạn"
            min="13"
            max="100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Giới tính *</label>
          <select
            value={formData.gender}
            onChange={(e) => updateFormData('gender', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Chọn giới tính</option>
            <option value="female">Nữ</option>
            <option value="male">Nam</option>
            <option value="transgender">Chuyển giới</option>
            <option value="other">Khác</option>
          </select>
        </div>
      </div>

      {formData.gender === 'female' && (
        <div className="bg-pink-50 p-4 rounded-lg border border-pink-200">
          <div className="flex items-center space-x-2 mb-3">
            <input
              type="checkbox"
              checked={formData.is_pregnant}
              onChange={(e) => updateFormData('is_pregnant', e.target.checked)}
              className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
            />
            <label className="text-sm font-medium">Hiện đang mang thai</label>
          </div>

          {formData.is_pregnant && (
            <select
              value={formData.pregnancy_trimester}
              onChange={(e) => updateFormData('pregnancy_trimester', e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Chọn giai đoạn thai kỳ</option>
              <option value="first">Tam cá nguyệt đầu (1-3 tháng)</option>
              <option value="second">Tam cá nguyệt giữa (4-6 tháng)</option>
              <option value="third">Tam cá nguyệt cuối (7-9 tháng)</option>
            </select>
          )}
        </div>
      )}

      {formData.gender === 'transgender' && (
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
          <p className="text-sm font-medium mb-2">Thông tin giải phẫu (tùy chọn):</p>
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.risk_factors.includes('has_cervix')}
              onChange={() => handleMultiSelect('risk_factors', 'has_cervix')}
              className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
            />
            <label className="text-sm">Có cơ quan sinh dục nữ (cervix)</label>
          </div>
        </div>
      )}
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Heart className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-semibold">Thông tin tình dục</h3>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tình trạng hoạt động tình dục *</label>
        <select
          value={formData.sexually_active}
          onChange={(e) => updateFormData('sexually_active', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Chọn tình trạng</option>
          <option value="not_active">Không hoạt động tình dục</option>
          <option value="active_single">Có hoạt động - 1 bạn tình</option>
          <option value="active_multiple">Có hoạt động - nhiều bạn tình</option>
        </select>
      </div>

      {formData.sexually_active !== 'not_active' && formData.sexually_active && (
        <>
          <div>
            <label className="block text-sm font-medium mb-2">Xu hướng tình dục</label>
            <select
              value={formData.sexual_orientation}
              onChange={(e) => updateFormData('sexual_orientation', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Chọn xu hướng</option>
              <option value="heterosexual">Dị tính (quan hệ khác giới)</option>
              <option value="homosexual">Đồng tính</option>
              <option value="msm">Nam quan hệ với nam (MSM)</option>
              <option value="bisexual">Lưỡng tính</option>
              <option value="other">Khác</option>
            </select>
          </div>

          {(formData.sexually_active === 'active_multiple') && (
            <div>
              <label className="block text-sm font-medium mb-2">Số bạn tình trong 6 tháng qua</label>
              <select
                value={formData.number_of_partners}
                onChange={(e) => updateFormData('number_of_partners', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Chọn số lượng</option>
                <option value="two_to_five">2-5</option>
                <option value="multiple">Trên 5</option>
              </select>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.new_partner_recently}
                onChange={(e) => updateFormData('new_partner_recently', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm">Có bạn tình mới trong 3 tháng qua</label>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.partner_has_sti}
                onChange={(e) => updateFormData('partner_has_sti', e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm">Bạn tình có/nghi ngờ STI</label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tần suất sử dụng bao cao su *</label>
            <select
              value={formData.condom_use}
              onChange={(e) => updateFormData('condom_use', e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="sometimes">Thỉnh thoảng</option>
              <option value="always">Luôn luôn</option>
              <option value="rarely">Hiếm khi</option>
              <option value="never">Không bao giờ</option>
            </select>
          </div>
        </>
      )}
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-5 h-5 text-green-600" />
        <h3 className="text-lg font-semibold">Tiền sử y tế</h3>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Tiền sử mắc STI (có thể chọn nhiều)</label>
        <div className="grid grid-cols-2 gap-3">
          {['HIV', 'Giang mai', 'Lậu', 'Chlamydia', 'Herpes', 'HPV', 'Viêm gan B', 'Viêm gan C'].map(sti => (
            <div key={sti} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.previous_sti_history.includes(sti)}
                onChange={() => handleMultiSelect('previous_sti_history', sti)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label className="text-sm">{sti}</label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Tình trạng HIV *</label>
        <select
          value={formData.hiv_status}
          onChange={(e) => updateFormData('hiv_status', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Chọn tình trạng</option>
          <option value="unknown">Chưa biết</option>
          <option value="negative">Âm tính</option>
          <option value="positive">Dương tính</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Lần xét nghiệm STI gần nhất *</label>
        <select
          value={formData.last_sti_test}
          onChange={(e) => updateFormData('last_sti_test', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="never">Chưa từng</option>
          <option value="within_3months">Trong 3 tháng</option>
          <option value="3_6months">3-6 tháng trước</option>
          <option value="6_12months">6-12 tháng trước</option>
          <option value="over_1year">Trên 1 năm</option>
        </select>
      </div>

      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-center space-x-2 mb-3">
          <input
            type="checkbox"
            checked={formData.has_symptoms}
            onChange={(e) => updateFormData('has_symptoms', e.target.checked)}
            className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
          />
          <label className="text-sm font-medium">Hiện có triệu chứng nghi ngờ STI</label>
        </div>

        {formData.has_symptoms && (
          <div className="grid grid-cols-2 gap-2 mt-3">
            {['Đau rát khi tiểu', 'Tiết dịch bất thường', 'Loét', 'Ngứa', 'Đau vùng kín', 'Phát ban'].map(symptom => (
              <div key={symptom} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.symptoms.includes(symptom)}
                  onChange={() => handleMultiSelect('symptoms', symptom)}
                  className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                />
                <label className="text-sm">{symptom}</label>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-600" />
        <h3 className="text-lg font-semibold">Yếu tố nguy cơ & Môi trường</h3>
      </div>

      <div>
        <label className="block text-sm font-medium mb-3">Yếu tố nguy cơ (có thể chọn nhiều)</label>
        <div className="space-y-3">
          {[
            { key: 'injection_drug', label: 'Sử dụng ma túy tiêm' },
            { key: 'sex_work', label: 'Làm nghề mại dâm' },
            { key: 'incarceration', label: 'Tiền sử bị giam giữ' },
            { key: 'blood_transfusion', label: 'Truyền máu/ghép tạng' },
            { key: 'prep_user', label: 'Đang dùng PrEP' },
            { key: 'immunocompromised', label: 'Suy giảm miễn dịch' }
          ].map(risk => (
            <div key={risk.key} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.risk_factors.includes(risk.key)}
                onChange={() => handleMultiSelect('risk_factors', risk.key)}
                className="w-4 h-4 text-orange-600 rounded focus:ring-orange-500"
              />
              <label className="text-sm">{risk.label}</label>
            </div>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Khu vực sinh sống</label>
        <select
          value={formData.living_area}
          onChange={(e) => updateFormData('living_area', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="normal">Khu vực bình thường</option>
          <option value="endemic">Vùng dịch tễ cao STI</option>
        </select>
        <p className="text-xs text-gray-500 mt-1">
          *Ví dụ vùng dịch tễ cao: Các tỉnh biên giới, khu vực có nhiều quán bar/karaoke, khu công nghiệp tập trung lao động
        </p>
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6">
      <div className="flex items-center space-x-2 mb-4">
        <Shield className="w-5 h-5 text-purple-600" />
        <h3 className="text-lg font-semibold">Mục đích xét nghiệm</h3>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Mục đích xét nghiệm *</label>
        <select
          value={formData.test_purpose}
          onChange={(e) => updateFormData('test_purpose', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Chọn mục đích</option>
          <option value="routine">Sàng lọc định kỳ</option>
          <option value="symptoms">Có triệu chứng</option>
          <option value="partner_positive">Bạn tình có STI</option>
          <option value="pregnancy">Chuẩn bị mang thai</option>
          <option value="new_relationship">Bắt đầu mối quan hệ mới</option>
          <option value="occupational">Yêu cầu nghề nghiệp</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">Mức độ khẩn cấp</label>
        <select
          value={formData.urgency}
          onChange={(e) => updateFormData('urgency', e.target.value)}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
        >
          <option value="normal">Bình thường</option>
          <option value="urgent">Khẩn cấp (có triệu chứng)</option>
          <option value="emergency">Cấp cứu</option>
        </select>
      </div>
    </div>
  );

  const renderRecommendation = () => {
    if (!recommendation) return null;

    const getPackageInfo = (packageCode: string) => {
      const packages = {
        'STI-BASIC-01': {
          name: 'Gói xét nghiệm STIs CƠ BẢN 1',
          price: '7.000.000 VNĐ',
          tests: ['HIV combo Alere', 'Giang mai', 'Lậu', 'Chlamydia'],
          description: 'Gói test nhanh cơ bản'
        },
        'STI-BASIC-02': {
          name: 'Gói xét nghiệm STIs CƠ BẢN 2',
          price: '9.000.000 VNĐ',
          tests: ['HIV combo Alere', 'Giang mai', 'Viêm gan B', 'Viêm gan C', 'Lậu', 'Chlamydia'],
          description: 'Gói test cơ bản mở rộng'
        },
        'STI-ADVANCE': {
          name: 'Gói xét nghiệm STIs NÂNG CAO',
          price: '17.000.000 VNĐ',
          tests: ['HIV combo Alere', 'Viêm gan B', 'Viêm gan C', 'Herpes', 'RPR', 'Syphilis TP IgM/IgG', 'Lậu', 'Chlamydia'],
          description: 'Gói toàn diện với hầu hết các STIs'
        }
      };
      return packages[packageCode as keyof typeof packages];
    };

    const packageInfo = getPackageInfo(recommendation.recommended_package);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
          <h3 className="text-2xl font-bold text-gray-800">Kết quả đánh giá STI</h3>
          <p className="text-gray-600 mt-2">Dựa trên hướng dẫn CDC 2021</p>
        </div>

        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-xl border border-blue-200">
          <div className="flex items-center mb-4">
            <Package className="w-6 h-6 text-blue-600 mr-2" />
            <h4 className="font-bold text-lg text-blue-800">Gói xét nghiệm được đề xuất</h4>
          </div>

          <div className="bg-white p-4 rounded-lg border">
            <h5 className="font-bold text-xl text-blue-600 mb-2">{packageInfo.name}</h5>
            <p className="text-gray-600 mb-3">{packageInfo.description}</p>
            <p className="font-bold text-2xl text-green-600 mb-4">Giá: {packageInfo.price}</p>

            <div>
              <p className="text-sm font-medium mb-2 text-gray-700">Bao gồm các xét nghiệm:</p>
              <div className="grid grid-cols-2 gap-2">
                {packageInfo.tests.map((test: string, index: number) => (
                  <div key={index} className="flex items-center">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                    <span className="text-sm">{test}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className={`p-4 rounded-lg border ${recommendation.risk_level === 'Cao' ? 'bg-red-50 border-red-200' :
          recommendation.risk_level === 'Trung bình' ? 'bg-yellow-50 border-yellow-200' :
            'bg-green-50 border-green-200'
          }`}>
          <h5 className="font-semibold mb-2 flex items-center">
            <AlertTriangle className={`w-5 h-5 mr-2 ${recommendation.risk_level === 'Cao' ? 'text-red-600' :
              recommendation.risk_level === 'Trung bình' ? 'text-yellow-600' :
                'text-green-600'
              }`} />
            Mức độ nguy cơ:
            <span className={`ml-2 px-3 py-1 rounded-full text-sm font-bold ${recommendation.risk_level === 'Cao' ? 'bg-red-200 text-red-800' :
              recommendation.risk_level === 'Trung bình' ? 'bg-yellow-200 text-yellow-800' :
                'bg-green-200 text-green-800'
              }`}>
              {recommendation.risk_level}
            </span>
          </h5>

          <div className="text-sm">
            <p className="font-medium mb-2">Lý do đề xuất:</p>
            <ul className="list-disc list-inside space-y-1">
              {recommendation.reasoning.map((reason, index) => (
                <li key={index}>{reason}</li>
              ))}
            </ul>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={() => {
              setCurrentStep(1);
              setRecommendation(null);
              setFormData({
                age: '', gender: '', is_pregnant: false, pregnancy_trimester: '',
                sexually_active: '', sexual_orientation: '', number_of_partners: '',
                new_partner_recently: false, partner_has_sti: false, condom_use: 'sometimes',
                previous_sti_history: [], hiv_status: '', last_sti_test: 'never',
                has_symptoms: false, symptoms: [], risk_factors: [],
                living_area: 'normal', test_purpose: '', urgency: 'normal'
              });
            }}
            className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Đánh giá lại
          </button>

          <button
            onClick={handleBookingSTI}
            disabled={bookingLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 px-6 rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-colors shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {bookingLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block"></div>
                Đang xử lý...
              </>
            ) : (
              'Đặt lịch xét nghiệm'
            )}
          </button>
        </div>
      </div>
    );
  };

  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        const age = parseInt(formData.age);
        return formData.age && formData.gender && age >= 13 && age <= 100;
      case 2:
        return formData.sexually_active;
      case 3:
        return formData.hiv_status;
      case 4:
        return true; // Optional fields
      case 5:
        return formData.test_purpose;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    } else {
      submitAssessment();
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const getStepTitle = () => {
    const titles = {
      1: "Thông tin cá nhân",
      2: "Thông tin tình dục",
      3: "Tiền sử y tế",
      4: "Yếu tố nguy cơ",
      5: "Mục đích xét nghiệm",
      6: "Kết quả đánh giá"
    };
    return titles[currentStep as keyof typeof titles];
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white min-h-screen">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-3">
          Đánh giá Sàng lọc STI Cá nhân
        </h1>
        <p className="text-gray-600 text-lg">
          Dựa trên hướng dẫn CDC 2021 - Tư vấn gói xét nghiệm phù hợp cho bạn
        </p>
        <p className="text-sm text-gray-500 mt-1">
          *CDC: Trung tâm Kiểm soát và Phòng ngừa Dịch bệnh Hoa Kỳ (Centers for Disease Control and Prevention)
        </p>
      </div>

      {/* Progress Bar */}
      {currentStep <= 5 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Bước {currentStep}/5: {getStepTitle()}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round((currentStep / 5) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Form Steps */}
      <div className="bg-gray-50 p-6 rounded-xl mb-6 shadow-sm border">
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
        {currentStep === 5 && renderStep5()}
        {currentStep === 6 && renderRecommendation()}
      </div>

      {/* Navigation */}
      {currentStep <= 5 && (
        <div className="flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={currentStep === 1}
            className={`flex items-center px-6 py-3 rounded-lg transition-colors ${currentStep === 1
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gray-500 text-white hover:bg-gray-600'
              }`}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại
          </button>

          <button
            onClick={nextStep}
            disabled={!isStepValid() || loading}
            className={`flex items-center px-6 py-3 rounded-lg transition-colors ${!isStepValid() || loading
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
              }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Đang xử lý...
              </>
            ) : (
              <>
                {currentStep === 5 ? 'Xem kết quả' : 'Tiếp theo'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </button>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Kết quả này chỉ mang tính chất tham khảo dựa trên hướng dẫn CDC (Trung tâm Kiểm soát và Phòng ngừa Dịch bệnh Hoa Kỳ)</li>
              <li>Không thay thế cho tư vấn trực tiếp từ bác sĩ chuyên khoa</li>
              <li>Nếu có triệu chứng cấp tính, hãy liên hệ ngay với cơ sở y tế</li>
              <li>Thông tin cá nhân được bảo mật tuyệt đối</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Cần hỗ trợ? Liên hệ hotline: <span className="font-semibold text-blue-600">1900 xxxx</span></p>
        <p>Hoặc chat trực tuyến với chuyên gia tư vấn</p>
      </div>
    </div>
  );
};

export default STIAssessmentForm;