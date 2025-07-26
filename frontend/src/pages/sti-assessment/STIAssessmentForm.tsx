import React, { useState, useEffect } from 'react';
import { User, Calendar, Heart, AlertTriangle, Shield, CheckCircle, Package, ArrowLeft, ArrowRight } from 'lucide-react';
import { authService } from '../../services/auth';
import { STIAssessmentData, STIAssessmentService, STIRecommendation, STIPackageInfo } from '../../services/stiAssessmentService';
import { useNavigate } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import toast from 'react-hot-toast';
import { Spin, Alert, Modal } from 'antd';

const STIAssessmentForm = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [packages, setPackages] = useState<any[]>([]);
  const [packagesLoading, setPackagesLoading] = useState(true);
  const [recommendation, setRecommendation] = useState<STIRecommendation | null>(null);
  const [showConsultantModal, setShowConsultantModal] = useState(false);

  // Fetch packages info from API
  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setPackagesLoading(true);
        const response = await STIAssessmentService.getPackageInfo();
        if (response.success && response.data) {
          // Không destructure, chỉ setPackages đúng kiểu
          const packages = (response.data as any).packages || response.data;
          setPackages(packages);
        } else {
          console.error('Failed to fetch packages:', response.message);
          toast.error('Không thể tải thông tin gói xét nghiệm');
        }
      } catch (error) {
        console.error('Error fetching packages:', error);
        toast.error('Lỗi khi tải thông tin gói xét nghiệm');
      } finally {
        setPackagesLoading(false);
      }
    };

    fetchPackages();
  }, []);

  const [formData, setFormData] = useState({
    // Thông tin cá nhân
    age: '',
    gender: '',
    is_pregnant: false,
    pregnancy_trimester: '',

    // Thông tin tình dục
    sexually_active: '',
    sexual_orientation: 'heterosexual', // DEFAULT to heterosexual
    actual_orientation: '', // Hidden field for backend
    new_partner_recently: false,
    partner_has_sti: false,
    condom_use: 'sometimes',

    // Tiền sử y tế
    previous_sti_history: [] as string[],
    hiv_status: '',
    last_sti_test: 'never',
    has_symptoms: false,
    symptoms: [] as string[],

    // Yếu tố nguy cơ
    risk_factors: [] as string[],
    living_area: 'normal',

  });

  // State for bisexual male MSM question
  const [showMSMQuestion, setShowMSMQuestion] = useState(false);
  const [hasMaleSex, setHasMaleSex] = useState(false);

  const updateFormData = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Show/hide MSM question for bisexual males
  useEffect(() => {
    console.log('Gender:', formData.gender, 'Orientation:', formData.sexual_orientation);
    if (formData.gender === 'male' && formData.sexual_orientation === 'bisexual') {
      console.log('Showing MSM question');
      setShowMSMQuestion(true);
    } else {
      console.log('Hiding MSM question');
      setShowMSMQuestion(false);
      setHasMaleSex(false);
    }
  }, [formData.gender, formData.sexual_orientation]);

  // Auto-set MSM for bisexual males who have had male partners
  useEffect(() => {
    if (formData.gender === 'male' && formData.sexual_orientation === 'bisexual' && hasMaleSex) {
      console.log('Setting actual_orientation to MSM while keeping display as bisexual');
      updateFormData('actual_orientation', 'msm');
      // DON'T hide the question - keep it visible so user can see their choice
    } else if (formData.gender === 'male' && formData.sexual_orientation === 'bisexual' && !hasMaleSex) {
      updateFormData('actual_orientation', 'bisexual');
    } else {
      // For other cases, actual_orientation = sexual_orientation
      updateFormData('actual_orientation', formData.sexual_orientation);
    }
  }, [hasMaleSex, formData.sexual_orientation, formData.gender]);

  // Auto-clear MSM option when gender is not male
  useEffect(() => {
    if (formData.gender === 'female' && formData.sexual_orientation === 'msm') {
      updateFormData('sexual_orientation', '');
    }
  }, [formData.gender]);

  useEffect(() => {
    // Set default orientation if empty
    if (!formData.sexual_orientation) {
      updateFormData('sexual_orientation', 'heterosexual');
    }
  }, []);

  useEffect(() => {
    if (formData.sexually_active === 'not_active') {
      // Clear sexual orientation when not active
      updateFormData('sexual_orientation', 'heterosexual');
      updateFormData('new_partner_recently', false);
      updateFormData('partner_has_sti', false);
      updateFormData('condom_use', 'never'); // Set condom_use to 'never' when not sexually active
    }
  }, [formData.sexually_active]);

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
      const token = authService.getToken();

      if (!token) {
        toast.error('Vui lòng đăng nhập để sử dụng tính năng này', {
          duration: 4000,
          position: 'top-center',
        });
        setLoading(false);
        return;
      }

      const submissionData = {
        ...formData,
        has_symptoms: formData.symptoms.length > 0,
        number_of_partners: formData.sexually_active === 'not_active' ? 'none' :
          formData.sexually_active === 'active_single' ? 'one' : 'multiple',
        // Use actual_orientation for backend if it exists, otherwise use sexual_orientation
        sexual_orientation: formData.actual_orientation || formData.sexual_orientation,
        previous_sti_history: formData.previous_sti_history || [],
        symptoms: formData.symptoms || [],
        risk_factors: formData.risk_factors || [],
        age: parseInt(formData.age) || 0
      };

      // Remove the actual_orientation field before sending to backend
      const { actual_orientation, ...cleanSubmissionData } = submissionData;

      const cleanedData = Object.fromEntries(
        Object.entries(cleanSubmissionData).filter(([key, value]) => {
          if (typeof value === 'boolean' || typeof value === 'number' || (Array.isArray(value) && value.length > 0)) {
            return true;
          }
          if (typeof value === 'string' && value.trim() !== '') {
            return true;
          }
          if (Array.isArray(value) && ['previous_sti_history', 'symptoms', 'risk_factors'].includes(key)) {
            return true;
          }
          return false;
        })
      );

      if (!cleanedData.hiv_status) {
        toast.error('Vui lòng chọn tình trạng HIV', {
          duration: 3000,
          position: 'top-center',
        });
        setLoading(false);
        return;
      }


      const result = await STIAssessmentService.createAssessment(cleanedData as unknown as STIAssessmentData);

      if (result.success) {
        toast.success('Đánh giá STI hoàn thành thành công!', {
          duration: 4000,
          position: 'top-center',
        });
        setRecommendation(result.data?.recommendation || null);
        // Scroll to top after showing results
        window.scrollTo({ top: 0, behavior: 'smooth' });
      } else {
        let errorMessage = result.message || 'Không thể tạo đánh giá STI';
        if ((result as any).errors && Array.isArray((result as any).errors)) {
          errorMessage += '\n\nChi tiết lỗi:\n' + (result as any).errors.join('\n');
        }
        toast.error(errorMessage, {
          duration: 5000,
          position: 'top-center',
        });
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
      const response = await apiClient.get(API.STI.GET_ALL_PACKAGES);
      const data = response.data as any;

      console.log('API GET_ALL_PACKAGES result:', data);
      console.log('All data keys:', Object.keys(data));
      console.log('data properties:', data);
      console.log('JSON.stringify(data):', JSON.stringify(data));

      if (data.success) {
        console.log('Raw data.stippackage:', data.stippackage);
        console.log('Raw data.stippackages:', data.stippackages);
        console.log('data.stippackage type:', typeof data.stippackage);
        console.log('data.stippackage isArray:', Array.isArray(data.stippackage));

        // Thử destructuring để tránh vấn đề với getter/setter
        const { stippackage, stippackages } = data;
        console.log('Destructured stippackage:', stippackage);
        console.log('Destructured stippackages:', stippackages);

        let packages = stippackage || stippackages || [];

        // Nếu vẫn rỗng, thử dùng bracket notation
        if (!packages.length) {
          packages = data['stippackage'] || data['stippackages'] || [];
        }

        // Nếu vẫn rỗng, thử Object.values để lấy tất cả arrays có trong object
        if (!packages.length) {
          console.log('Trying Object.values approach');
          const allValues = Object.values(data);
          console.log('All object values:', allValues);
          packages = allValues.find(val => Array.isArray(val) && val.length > 0) as any[] || [];
        }

        // FALLBACK: Nếu vẫn không có, tạm thời hard-code để test flow
        if (!packages.length) {
          console.log('Using fallback hardcoded packages for testing');
          packages = [
            {
              _id: '675e1a2b3c4d5e6f7a8b9101',
              sti_package_name: 'Gói xét nghiệm STIs CƠ BẢN 1',
              sti_package_code: 'STI-BASIC-01',
              price: 700000
            },
            {
              _id: '675e1a2b3c4d5e6f7a8b9102',
              sti_package_name: 'Gói xét nghiệm STIs CƠ BẢN 2',
              sti_package_code: 'STI-BASIC-02',
              price: 900000
            },
            {
              _id: '675e1a2b3c4d5e6f7a8b9103',
              sti_package_name: 'Gói xét nghiệm STIs NÂNG CAO',
              sti_package_code: 'STI-ADVANCE',
              price: 1700000
            }
          ];
        }

        console.log('Final assigned packages:', packages);
        console.log('Final packages type:', typeof packages);
        console.log('Final packages isArray:', Array.isArray(packages));
        console.log('Final packages length:', packages.length);

        if (!Array.isArray(packages)) {
          console.log('Packages is not array, type:', typeof packages);
          toast.error('Dữ liệu gói xét nghiệm không hợp lệ', {
            duration: 3000,
            position: 'top-center',
          });
          return;
        }

        const targetPackage = packages.find((pkg: any) =>
          pkg.sti_package_code === recommendation.recommended_package
        );

        console.log('API GET_ALL_PACKAGES packages:', packages);
        console.log('Looking for package with code:', recommendation.recommended_package);
        console.log('Found package:', targetPackage);

        if (targetPackage) {
          const packageId = typeof targetPackage._id === 'object'
            ? targetPackage._id.toString()
            : targetPackage._id;

          console.log('Package found! Details:', {
            id: packageId,
            code: targetPackage.sti_package_code,
            name: targetPackage.sti_package_name,
            price: targetPackage.price
          });

          console.log('About to navigate to:', `/sti-booking/book?recommendedPackage=${recommendation.recommended_package}&packageId=${packageId}`);
          navigate(`/sti-booking/book?recommendedPackage=${recommendation.recommended_package}&packageId=${packageId}`);
          console.log('Navigation completed');
        } else {
          console.log('Package not found! Available packages:', packages.map(pkg => ({
            id: pkg._id,
            code: pkg.sti_package_code,
            name: pkg.sti_package_name
          })));
          toast.error(`Không tìm thấy gói xét nghiệm với mã: ${recommendation.recommended_package}`, {
            duration: 4000,
            position: 'top-center',
          });
        }
      } else {
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

  const handleConsultantBooking = () => {
    setShowConsultantModal(true);
  };

  const handleConfirmConsultantBooking = (sendScreeningResults: boolean) => {
    if (sendScreeningResults && recommendation) {
      // Lưu cả câu trả lời và kết quả tổng hợp vào localStorage
      const screeningData = {
        answers: formData,
        result: {
          risk_level: recommendation.risk_level,
          recommended_package: recommendation.recommended_package,
          reasoning: recommendation.reasoning,
        },
        timestamp: new Date().toISOString()
      };
      localStorage.setItem('sti_screening_results', JSON.stringify(screeningData));
      toast.success('Kết quả và câu trả lời đã được gửi cho chuyên gia');
    } else {
      localStorage.removeItem('sti_screening_results');
    }

    setShowConsultantModal(false);
    navigate('/consultants');
  };

  const getPackageInfo = (packageCode: string) => {
    return packages.find(pkg => pkg.sti_package_code === packageCode);
  };

  const renderPersonalInfo = () => (
    <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <User className="w-5 h-5 text-blue-600" />
        <h3 className="text-lg font-semibold text-blue-800">Thông tin cá nhân</h3>
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
          </select>
        </div>
      </div>

      {formData.gender === 'female' && (
        <div className="bg-pink-50 p-4 rounded-lg border border-pink-200 mt-4">
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
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mt-4">
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

  const renderSexualInfo = () => (
    <div className="bg-pink-50 p-6 rounded-xl border border-pink-200 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Heart className="w-5 h-5 text-pink-600" />
        <h3 className="text-lg font-semibold text-pink-800">Thông tin tình dục</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Tình trạng hoạt động tình dục trong 6 tháng qua *</label>
          <select
            value={formData.sexually_active}
            onChange={(e) => updateFormData('sexually_active', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
          >
            <option value="">Chọn tình trạng</option>
            <option value="not_active">Không hoạt động tình dục</option>
            <option value="active_single">Có hoạt động - 1 bạn tình cố định</option>
            <option value="active_multiple">Có hoạt động - nhiều bạn tình (≥2 người)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
          </p>
        </div>

        {formData.sexually_active !== 'not_active' && formData.sexually_active && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Xu hướng tình dục</label>
              <select
                value={formData.sexual_orientation || 'heterosexual'}
                onChange={(e) => updateFormData('sexual_orientation', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              >
                <option value="heterosexual">Dị tính (quan hệ khác giới)</option>
                {formData.gender === 'male' && (
                  <option value="msm">Nam quan hệ với nam (MSM)</option>
                )}
                {formData.gender !== 'male' && (
                  <option value="homosexual">Đồng tính</option>
                )}
                <option value="bisexual">Lưỡng tính</option>
              </select>

              {/* ✅ Enhanced MSM information */}
              {formData.sexual_orientation === 'msm' && (
                <div className="bg-blue-50 p-3 rounded border border-blue-200 mt-2">
                  <p className="text-xs text-blue-700">
                    <strong>Lưu ý MSM:</strong> Nam quan hệ tình dục với nam thuộc nhóm nguy cơ cao theo CDC
                    và cần sàng lọc toàn diện ít nhất hàng năm, hoặc 3-6 tháng nếu có yếu tố nguy cơ bổ sung.
                  </p>
                </div>
              )}
            </div>

            {/* Keep existing MSM question logic for bisexual males */}
            {showMSMQuestion && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mt-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={hasMaleSex}
                    onChange={(e) => setHasMaleSex(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <label className="text-sm font-medium">Đã từng quan hệ tình dục với nam giới trong 6 tháng qua</label>
                </div>
                {hasMaleSex && (
                  <p className="text-xs text-blue-600 mt-2">
                    * Sẽ được đánh giá theo khuyến cáo CDC cho MSM
                  </p>
                )}
              </div>
            )}

            {/* Additional sexual behavior questions - timeframe specific */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.new_partner_recently}
                  onChange={(e) => updateFormData('new_partner_recently', e.target.checked)}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <label className="text-sm">Có bạn tình mới trong 3 tháng qua</label>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.partner_has_sti}
                  onChange={(e) => updateFormData('partner_has_sti', e.target.checked)}
                  className="w-4 h-4 text-pink-600 rounded focus:ring-pink-500"
                />
                <label className="text-sm">Bạn tình có/nghi ngờ mắc STI (bệnh lây truyền qua đường tình dục)</label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Tần suất sử dụng bao cao su trong 6 tháng qua *</label>
              <select
                value={formData.condom_use}
                onChange={(e) => updateFormData('condom_use', e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
              >
                <option value="always">Luôn luôn sử dụng</option>
                <option value="sometimes">Thỉnh thoảng sử dụng</option>
                <option value="rarely">Hiếm khi sử dụng</option>
                <option value="never">Không bao giờ sử dụng</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                * CDC coi việc sử dụng bao cao su không thường xuyên là yếu tố nguy cơ quan trọng
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );

  const renderMedicalHistory = () => (
    <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <Calendar className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-800">Tiền sử y tế</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-3">Tiền sử mắc STI (có thể chọn nhiều)</label>
          <div className="grid grid-cols-2 gap-3">
            {/* ✅ ENHANCED: Updated STI codes to match backend mapping */}
            {[
              { code: 'chlamydia', label: 'Chlamydia' },
              { code: 'gonorrhea', label: 'Lậu (Gonorrhea)' },
              { code: 'syphilis', label: 'Giang mai (Syphilis)' },
              { code: 'herpes', label: 'Herpes (HSV)' },
              { code: 'hpv', label: 'HPV' },
              { code: 'hepatitis_b', label: 'Viêm gan B' },
              { code: 'hepatitis_c', label: 'Viêm gan C' },
              { code: 'trichomonas', label: 'Trichomonas' }
            ].map(sti => (
              <div key={sti.code} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.previous_sti_history.includes(sti.code)}
                  onChange={() => handleMultiSelect('previous_sti_history', sti.code)}
                  className="w-4 h-4 text-gray-600 rounded focus:ring-gray-500"
                />
                <label className="text-sm">{sti.label}</label>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-2">
            * Tiền sử STI là yếu tố nguy cơ quan trọng trong đánh giá CDC
          </p>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Tình trạng HIV *</label>
          <select
            value={formData.hiv_status}
            onChange={(e) => updateFormData('hiv_status', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
          >
            <option value="">Chọn tình trạng</option>
            <option value="unknown">Chưa biết/Chưa xét nghiệm</option>
            <option value="negative">Âm tính (HIV-)</option>
            <option value="positive">Dương tính (HIV+)</option>
          </select>
          {formData.hiv_status === 'positive' && (
            <p className="text-xs text-red-600 mt-1">
              * Người nhiễm HIV cần sàng lọc STI toàn diện theo khuyến cáo CDC
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lần xét nghiệm STI gần nhất</label>
          <select
            value={formData.last_sti_test}
            onChange={(e) => updateFormData('last_sti_test', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
          >
            <option value="never">Chưa từng xét nghiệm</option>
            <option value="within_3months">Trong 3 tháng qua</option>
            <option value="3_6months">3-6 tháng trước</option>
            <option value="6_12months">6-12 tháng trước</option>
            <option value="over_1year">Hơn 1 năm trước</option>
          </select>
        </div>
      </div>
    </div>
  );

  const renderSymptoms = () => (
    <div className="bg-red-50 p-6 rounded-xl border border-red-200 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-red-600" />
        <h3 className="text-lg font-semibold text-red-800">Triệu chứng hiện tại</h3>
      </div>

      <>
        <div className="grid grid-cols-2 gap-2 mt-3">
          {[
            'Đau rát khi tiểu',
            'Tiết dịch bất thường',
            'Loét vùng sinh dục',
            'Ngứa vùng sinh dục',
            'Đau vùng kín',
            'Phát ban da',
            'Sưng hạch bẹn',
            'Chảy máu bất thường',
            'Đau khi quan hệ',
            'Mùi hôi bất thường'
          ].map(symptom => (
            <div key={symptom} className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.symptoms.includes(symptom)}
                onChange={() => handleMultiSelect('symptoms', symptom)}
                className="w-4 h-4 text-red-600 rounded focus:ring-red-500"
              />
              <label className="text-sm">{symptom}</label>
            </div>
          ))}
        </div>
        <div className="bg-red-100 p-3 rounded border border-red-300 mt-4">
          <p className="text-xs text-red-700">
            <strong>Quan trọng:</strong> Có triệu chứng STI là yếu tố ưu tiên cao nhất trong đánh giá CDC.
            Bạn sẽ được khuyến cáo xét nghiệm toàn diện ngay lập tức.
          </p>
        </div>
      </>
    </div>
  );

  const renderRiskFactors = () => (
    <div className="bg-yellow-50 p-6 rounded-xl border border-yellow-200 mb-6">
      <div className="flex items-center space-x-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-yellow-600" />
        <h3 className="text-lg font-semibold text-yellow-800">Yếu tố nguy cơ & Môi trường</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-3">Yếu tố nguy cơ (có thể chọn nhiều)</label>
          <div className="space-y-3">
            {[
              { key: 'injection_drug', label: 'Sử dụng ma túy tiêm' },
              { key: 'sex_work', label: 'Làm nghề mại dâm' },
              { key: 'incarceration', label: 'Tiền sử bị giam giữ' },
              { key: 'blood_transfusion', label: 'Truyền máu/ghép tạng' },
              { key: 'prep_user', label: 'Đang dùng PrEP (thuốc dự phòng HIV)' },
              { key: 'immunocompromised', label: 'Suy giảm miễn dịch' },
              // ✅ NEW: Added geographic risk factor
              { key: 'geographic_risk', label: 'Sống ở vùng có nguy cơ STI cao theo địa lý' }
            ].map(risk => (
              <div key={risk.key} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.risk_factors.includes(risk.key)}
                  onChange={() => handleMultiSelect('risk_factors', risk.key)}
                  className="w-4 h-4 text-yellow-600 rounded focus:ring-yellow-500"
                />
                <label className="text-sm">{risk.label}</label>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Khu vực/Môi trường sinh sống</label>
          <select
            value={formData.living_area}
            onChange={(e) => updateFormData('living_area', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-500"
          >
            <option value="normal">Khu vực bình thường</option>
            {/* ✅ ENHANCED: All high-prevalence settings from backend */}
            <option value="sti_clinic">Phòng khám STI/Sức khỏe tình dục</option>
            <option value="correctional_facility">Cơ sở giam giữ/Nhà tù</option>
            <option value="adolescent_clinic">Phòng khám thanh thiếu niên</option>
            <option value="drug_treatment_center">Trung tâm cai nghiện ma túy</option>
            <option value="emergency_department">Khoa cấp cứu</option>
            <option value="family_planning_clinic">Phòng khám kế hoạch hóa gia đình</option>
            <option value="high_prevalence_area">Khu vực dịch tễ STI cao khác</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">
            * Môi trường nguy cơ cao được CDC khuyến cáo sàng lọc tích cực hơn
          </p>
        </div>
      </div>
    </div>
  );

  const renderRecommendation = () => {
    if (!recommendation) return null;

    const packageInfo = getPackageInfo(recommendation.recommended_package);

    if (packagesLoading) {
      return (
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-center">
            <Spin size="large" />
            <span className="ml-3">Đang tải thông tin gói xét nghiệm...</span>
          </div>
        </div>
      );
    }

    if (!packageInfo) {
      return (
        <div className="bg-white p-6 rounded-lg border">
          <Alert
            message="Không tìm thấy thông tin gói xét nghiệm"
            description="Vui lòng thử lại sau hoặc liên hệ hỗ trợ"
            type="warning"
            showIcon
          />
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border-l-4 border-blue-500">
          <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
            <Shield className="w-6 h-6 mr-2 text-blue-600" />
            Kết quả đánh giá nguy cơ STI
          </h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-lg mb-3">Mức độ nguy cơ:</h4>
              <div className={`inline-flex items-center px-4 py-2 rounded-full text-white font-medium ${recommendation.risk_level === 'Cao' ? 'bg-red-500' :
                recommendation.risk_level === 'Trung bình' ? 'bg-yellow-500' : 'bg-green-500'
                }`}>
                <AlertTriangle className="w-4 h-4 mr-2" />
                {recommendation.risk_level}
              </div>

              <div className="mt-4">
                <h5 className="font-medium mb-2">Lý do đánh giá:</h5>
                <ul className="space-y-1">
                  {recommendation.reasoning.map((reason, index) => (
                    <li key={index} className="flex items-start">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-2 flex-shrink-0"></span>
                      <span className="text-sm text-gray-700">{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg border border-green-200 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h5 className="font-bold text-xl text-blue-600">{packageInfo.sti_package_name}</h5>
                <div className="bg-green-50 px-4 py-2 rounded-lg border border-green-200">
                  <p className="text-xs text-gray-600 mb-1">Giá gói</p>
                  <p className="font-bold text-2xl text-green-600" style={{ whiteSpace: 'nowrap' }}>
                    {packageInfo.price?.toLocaleString('vi-VN')} VNĐ
                  </p>
                </div>
              </div>
              <p className="text-gray-600 mb-4 leading-relaxed">{packageInfo.sti_package_description}</p>

              <div>
                <p className="text-sm font-medium mb-3 text-gray-700">Bao gồm các xét nghiệm:</p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {packageInfo.sti_package_tests?.map((test: string, index: number) => (
                    <div key={index} className="flex items-start bg-gray-50 p-3 rounded-lg">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700 leading-relaxed">{test}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="text-center space-y-4">
          <button
            onClick={() => {
              setRecommendation(null);
              setFormData({
                age: '', gender: '', is_pregnant: false, pregnancy_trimester: '',
                sexually_active: '', sexual_orientation: 'heterosexual', actual_orientation: '',
                new_partner_recently: false, partner_has_sti: false, condom_use: 'sometimes',
                previous_sti_history: [], hiv_status: '', last_sti_test: 'never',
                has_symptoms: false, symptoms: [], risk_factors: [],
                living_area: 'normal'
              });
            }}
            className="w-full bg-gray-500 text-white py-3 px-6 rounded-lg hover:bg-gray-600 transition-colors"
          >
            Đánh giá lại
          </button>

          <button
            onClick={handleConsultantBooking}
            className="w-full bg-gradient-to-r from-green-600 to-emerald-600 text-white py-3 px-6 rounded-lg hover:from-green-700 hover:to-emerald-700 transition-colors shadow-lg"
          >
            Đặt lịch tư vấn với chuyên gia ngay để hiểu kĩ hơn
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
              'Đặt lịch xét nghiệm STI ngay'
            )}
          </button>
        </div>

        {/* Modal xác nhận gửi kết quả sàng lọc */}
        <Modal
          title="Gửi kết quả sàng lọc cho chuyên gia"
          open={showConsultantModal}
          onCancel={() => setShowConsultantModal(false)}
          footer={null}
          width={500}
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Bạn có đồng ý gửi thêm kết quả sàng lọc STI này cho chuyên gia không?
            </p>

            {recommendation && (
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h4 className="font-semibold text-blue-800 mb-2">Kết quả sàng lọc:</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Mức độ nguy cơ:</span>
                    <span className={`ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${recommendation.risk_level === 'Cao' ? 'bg-red-100 text-red-800' :
                      recommendation.risk_level === 'Trung bình' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
                      }`}>
                      {recommendation.risk_level}
                    </span>
                  </div>
                  <div>
                    <span className="font-medium">Gói đề xuất:</span>
                    <span className="ml-2 text-blue-700">{recommendation.recommended_package}</span>
                  </div>
                </div>
              </div>
            )}

            <p className="text-sm text-gray-600">
              Việc gửi kết quả sàng lọc sẽ giúp chuyên gia hiểu rõ hơn về tình trạng của bạn và đưa ra lời khuyên phù hợp hơn.
            </p>

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => handleConfirmConsultantBooking(false)}
                className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Không gửi
              </button>
              <button
                onClick={() => handleConfirmConsultantBooking(true)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Đồng ý gửi
              </button>
            </div>
          </div>
        </Modal>
      </div>
    );
  };

  const isStepValid = () => {
    const age = parseInt(formData.age);
    return formData.age && formData.gender && age >= 13 && age <= 100 &&
      formData.sexually_active && formData.hiv_status;
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

      {/* Form Content */}
      {!recommendation ? (
        <div className="space-y-6">
          {/* All sections on one page with color coding */}
          {renderPersonalInfo()}
          {renderSexualInfo()}
          {renderMedicalHistory()}
          {renderSymptoms()}
          {renderRiskFactors()}

          {/* Submit Button */}
          <div className="text-center">
            <button
              onClick={submitAssessment}
              disabled={!isStepValid() || loading}
              className={`px-8 py-4 rounded-lg font-semibold text-lg transition-colors ${!isStepValid() || loading
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg'
                }`}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2 inline-block"></div>
                  Đang phân tích...
                </>
              ) : (
                'Xem kết quả đánh giá'
              )}
            </button>
          </div>
        </div>
      ) : (
        renderRecommendation()
      )}

      {/* Disclaimer */}
      <div className="mt-8 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
          <div className="text-sm text-amber-800">
            <p className="font-semibold mb-1">Lưu ý quan trọng:</p>
            <ul className="space-y-1 list-disc list-inside">
              <li>Kết quả này chỉ mang tính chất tham khảo dựa trên hướng dẫn CDC</li>
              <li>Không thay thế cho tư vấn trực tiếp từ bác sĩ chuyên khoa</li>
              <li>Nếu có triệu chứng cấp tính, hãy liên hệ ngay với cơ sở y tế</li>
              <li>Thông tin cá nhân được bảo mật tuyệt đối</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="mt-6 text-center text-sm text-gray-600">
        <p>Cần hỗ trợ? Liên hệ hotline: <span className="font-semibold text-blue-600">1900 6789</span></p>
        <p>Hoặc đặt lịch hẹn trực tuyến với chuyên gia tư vấn</p>
      </div>
    </div>
  );
};

export default STIAssessmentForm;