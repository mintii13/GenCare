import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable, { TableColumn } from 'react-data-table-component';
import { consultantService } from '../../../services/consultantService';

interface Consultant {
  consultant_id: string;
  user_id: string;
  full_name: string;
  email: string;
  phone?: string;
  avatar?: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  // Additional fields for display
  rating?: number;
  total_consultations?: number;
  bio?: string;
  is_available?: boolean;
}

interface ApiResponse {
  success: boolean;
  message: string;
  data: {
    consultants: Consultant[];
    total: number;
  };
}

const ConsultantList: React.FC = () => {
  const [consultants, setConsultants] = useState<Consultant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [filterSpecialization, setFilterSpecialization] = useState<string>('all');
  const [selectedConsultant, setSelectedConsultant] = useState<Consultant | null>(null);

  const specializations = [
    'Sức khỏe sinh sản',
    'Dinh dưỡng',
    'Sức khỏe tâm thần',
    'Y học gia đình',
    'Sức khỏe phụ nữ',
    'Nhi khoa'
  ];

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      setError('');
      
      console.log('Fetching consultants with specialization:', filterSpecialization);
      let response;
      
      if (filterSpecialization === 'all') {
        // Get all consultants
        response = await consultantService.getAllConsultants(1, 100);
      } else {
        // Use search endpoint with specialization filter
        response = await consultantService.searchConsultants('', {
          specialization: filterSpecialization
        });
      }
      
      console.log('API Response:', response);
      
      const apiResponse = response as ApiResponse;
      if (apiResponse.success && apiResponse.data) {
        const consultantsData = apiResponse.data.consultants || [];
        console.log('Consultants data:', consultantsData);
        
        // Add mock additional fields for better display
        const enrichedConsultants = consultantsData.map((consultant: Consultant, index: number) => {
          // Create consistent random values based on consultant ID to avoid re-randomization
          const seed = consultant.consultant_id ? consultant.consultant_id.length + index : index;
          const rating = (seed % 20) / 10 + 3.5; // Rating between 3.5-5.5, then clamp to 3-5
          const clampedRating = Math.min(Math.max(rating, 3), 5);
          
          return {
            ...consultant,
            rating: Math.round(clampedRating * 10) / 10, // Round to 1 decimal
            total_consultations: (seed * 37) % 500 + 50, // Deterministic consultations
            bio: `Chuyên gia ${consultant.specialization} với ${consultant.experience_years} năm kinh nghiệm.`,
            is_available: true // Always available by default
          };
        });
        
        setConsultants(enrichedConsultants);
      } else {
        console.error('Failed to fetch consultants:', apiResponse.message);
        setError(apiResponse.message || 'Không thể tải danh sách chuyên gia');
      }
    } catch (err) {
      console.error('Error fetching consultants:', err);
      if (err instanceof Error) {
        setError('Có lỗi xảy ra khi tải danh sách chuyên gia: ' + err.message);
      } else {
        setError('Có lỗi xảy ra khi tải danh sách chuyên gia: ' + String(err));
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConsultants();
  }, [filterSpecialization]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(<span key={i} className="text-warning">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-warning">☆</span>);
    }
    
    const emptyStars = 5 - Math.ceil(rating);
    for (let i = 0; i < emptyStars; i++) {
      stars.push(<span key={`empty-${i}`} className="text-gray-300">★</span>);
    }

    return stars;
  };

  const columns: TableColumn<Consultant>[] = [
    {
      name: 'Chuyên gia',
      cell: row => (
        <div className="flex items-center py-2" onClick={(e) => e.stopPropagation()}>
          <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center mr-2 flex-shrink-0">
            {row.avatar ? (
              <img src={row.avatar} alt={row.full_name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <span className="text-primary-600 font-semibold text-sm">
                {row.full_name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="font-semibold text-gray-800 text-sm truncate">{row.full_name}</div>
            <div className="text-xs text-gray-600 truncate">{row.qualifications}</div>
          </div>
        </div>
      ),
      width: '280px',
      style: { width: '280px' },
      sortable: true,
      selector: row => row.full_name,
    },
    {
      name: 'Chuyên khoa',
      selector: row => row.specialization,
      sortable: true,
      width: '200px',
      style: { width: '200px' },
    },
    {
      name: 'Kinh nghiệm',
      selector: row => row.experience_years || 0,
      format: row => `${row.experience_years || 0} năm`,
      sortable: true,
      width: '140px',
      style: { width: '140px' },
    },
    {
      name: 'Đánh giá',
      cell: row => (
        <div className="flex items-center">
          <div className="flex mr-2">
            {renderStars(row.rating || 0)}
          </div>
          <span className="text-sm text-gray-600">
            ({row.rating?.toFixed(1) || '0.0'})
          </span>
        </div>
      ),
      sortable: true,
      selector: row => row.rating || 0,
      width: '180px',
      style: { width: '180px' },
    },


    {
      name: 'Hành động',
      cell: (row: Consultant) => (
        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setSelectedConsultant(row);
            }}
            className="px-3 py-1 bg-primary-600 text-white rounded text-sm hover:bg-primary-700 transition-colors"
          >
            Xem chi tiết
          </button>
          {row.is_available && (
            <Link
              to={`/consultation/book-appointment?consultant=${row.consultant_id}`}
              onClick={(e) => e.stopPropagation()}
              className="px-3 py-1 bg-accent-600 text-white rounded text-sm hover:bg-accent-700 transition-colors"
            >
              Đặt lịch
            </Link>
          )}
        </div>
      ),
      ignoreRowClick: true,
      width: '200px',
      style: { width: '200px' },
    },
  ];

  const customStyles = {
    header: {
      style: {
        backgroundColor: 'var(--color-primary-50)',
        borderBottom: '1px solid var(--color-primary-200)',
      },
    },
    headRow: {
      style: {
        backgroundColor: 'var(--color-primary-100)',
        borderBottom: '1px solid var(--color-primary-200)',
      },
    },
    headCells: {
      style: {
        fontSize: '14px',
        fontWeight: '600',
        color: 'var(--color-primary-800)',
        padding: '16px',
        textAlign: 'left' as const,
        verticalAlign: 'middle' as const,
      },
    },
    cells: {
      style: {
        padding: '16px',
        textAlign: 'left' as const,
        verticalAlign: 'middle' as const,
      },
    },
    rows: {
      style: {
        backgroundColor: 'white',
        '&:nth-of-type(even)': {
          backgroundColor: 'var(--color-gray-50)',
        },
        '&:hover': {
          backgroundColor: 'var(--color-primary-50)',
        },
      },
    },
    table: {
      style: {
        borderCollapse: 'collapse' as const,
        width: '100%',
        tableLayout: 'fixed' as const,
      },
    },
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-4">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-blue-600 mb-2">Danh Sách Chuyên Gia</h1>
          <p className="text-gray-600">Tìm hiểu về các chuyên gia tư vấn sức khỏe</p>
        </div>



        {/* Content */}
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4"> {error}</div>
              <button
                onClick={fetchConsultants}
                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
              >
                Thử lại
              </button>
            </div>
          ) : (
            <div className="table-fixed">
              <DataTable
                columns={columns}
                data={consultants}
                pagination
                highlightOnHover
                striped
                progressPending={loading}
                noDataComponent={
                  <div className="text-center py-8">
                    <p className="text-gray-600">Không tìm thấy chuyên gia nào</p>
                  </div>
                }
                customStyles={customStyles}
              />
            </div>
          )}
        </div>
      </div>

      {/* Consultant Detail Modal */}
      {selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div 
            className="bg-white rounded-xl shadow-2xl relative max-h-[90vh] overflow-hidden"
            style={{ 
              width: '60vw', 
              maxWidth: '800px'
            }}
          >
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h3 className="text-2xl font-bold text-gray-800">Thông tin chuyên gia</h3>
              <button
                onClick={() => setSelectedConsultant(null)}
                className="text-gray-400 hover:text-gray-600 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
              >
                ✕
              </button>
            </div>

            {/* Content */}
                        <div className="flex" style={{ height: '500px' }}>
              {/* Left Half - Consultant Info */}
              <div className="w-1/2 p-6 border-r border-gray-200">
                <div className="h-full flex flex-col">
                  {/* Avatar and Basic Info */}
                  <div className="text-center mb-6">
                    <div className="w-24 h-24 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      {selectedConsultant.avatar ? (
                        <img 
                          src={selectedConsultant.avatar} 
                          alt={selectedConsultant.full_name} 
                          className="w-24 h-24 rounded-full object-cover" 
                        />
                      ) : (
                        <span className="text-primary-600 font-bold text-3xl">
                          {selectedConsultant.full_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <h4 className="text-2xl font-bold text-gray-800 mb-1">{selectedConsultant.full_name}</h4>
                    <p className="text-primary-600 font-medium text-lg">{selectedConsultant.specialization}</p>
                  </div>

                  {/* Basic Info */}
                  <div className="space-y-4 flex-1">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Email liên hệ:</span>
                      <p className="font-medium text-gray-800">{selectedConsultant.email}</p>
                    </div>
                    
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Trình độ chuyên môn:</span>
                      <p className="font-medium text-gray-800">{selectedConsultant.qualifications}</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Kinh nghiệm:</span>
                      <p className="font-medium text-gray-800">{selectedConsultant.experience_years} năm</p>
                    </div>

                    <div className="bg-gray-50 p-4 rounded-lg">
                      <span className="text-gray-600 text-sm font-medium block mb-1">Đánh giá:</span>
                      <div className="flex items-center">
                        <div className="flex mr-2">
                          {renderStars(selectedConsultant.rating || 0)}
                        </div>
                        <span className="text-gray-600 font-medium">
                          ({selectedConsultant.rating?.toFixed(1) || '0.0'}) - {selectedConsultant.total_consultations || 0} buổi tư vấn
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => setSelectedConsultant(null)}
                      className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                    >
                      Đóng
                    </button>
                    {selectedConsultant.is_available && (
                      <Link
                        to={`/consultation/book-appointment?consultant=${selectedConsultant.consultant_id}`}
                        className="flex-1 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 text-center font-medium transition-colors"
                      >
                        Đặt lịch tư vấn
                      </Link>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Half - Notes & Bio */}
              <div className="w-1/2 p-6">
                <div className="h-full flex flex-col">
                  <h5 className="text-lg font-bold text-gray-800 mb-4">Giới thiệu & Ghi chú</h5>
                  <div className="flex-1 overflow-y-auto bg-gray-50 rounded-lg p-4">
                    {selectedConsultant.bio ? (
                      <div className="space-y-4">
                        <div>
                          <h6 className="font-semibold text-gray-800 mb-2">Giới thiệu bản thân:</h6>
                          <p className="text-gray-700 leading-relaxed">{selectedConsultant.bio}</p>
                        </div>
                        
                        <div className="border-t border-gray-200 pt-4">
                          <h6 className="font-semibold text-gray-800 mb-2">Lĩnh vực chuyên môn:</h6>
                          <p className="text-gray-700">{selectedConsultant.specialization}</p>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <h6 className="font-semibold text-gray-800 mb-2">Thông tin thêm:</h6>
                          <div className="text-gray-700 space-y-2">
                            <p>• Kinh nghiệm {selectedConsultant.experience_years} năm trong lĩnh vực {selectedConsultant.specialization}</p>
                            <p>• Đã tư vấn cho {selectedConsultant.total_consultations || 0} khách hàng</p>
                            <p>• Đánh giá trung bình: {selectedConsultant.rating?.toFixed(1) || '0.0'}/5.0 sao</p>
                            <p>• Trình độ: {selectedConsultant.qualifications}</p>
                          </div>
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <h6 className="font-semibold text-gray-800 mb-2">Phương thức tư vấn:</h6>
                          <div className="text-gray-700 space-y-1">
                            <p>• Tư vấn trực tuyến qua video call</p>
                            <p>• Thời gian tư vấn: 30-60 phút/buổi</p>
                            <p>• Lịch làm việc: Thứ 2 - Thứ 6 (8:00 - 17:00)</p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 mt-8">
                        <p>Chuyên gia chưa cập nhật thông tin giới thiệu.</p>
                        <p className="mt-2">Vui lòng liên hệ trực tiếp để biết thêm chi tiết.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantList;