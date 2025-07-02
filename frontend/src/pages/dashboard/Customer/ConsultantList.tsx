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
      
      if (response.success && response.data) {
        const consultantsData = response.data.consultants || [];
        console.log('Consultants data:', consultantsData);
        
        // Add mock additional fields for better display
        const enrichedConsultants = consultantsData.map((consultant: Consultant) => ({
          ...consultant,
          rating: Math.random() * 2 + 3, // Random rating between 3-5
          total_consultations: Math.floor(Math.random() * 500) + 50, // Random consultations
          bio: `Chuyên gia ${consultant.specialization} với ${consultant.experience_years} năm kinh nghiệm.`,
          is_available: Math.random() > 0.2 // 80% available
        }));
        
        setConsultants(enrichedConsultants);
      } else {
        console.error('Failed to fetch consultants:', response.message);
        setError(response.message || 'Không thể tải danh sách chuyên gia');
      }
    } catch (err: any) {
      console.error('Error fetching consultants:', err);
      setError('Có lỗi xảy ra khi tải danh sách chuyên gia: ' + (err.message || ''));
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
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    }
    
    if (hasHalfStar) {
      stars.push(<span key="half" className="text-yellow-400">☆</span>);
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
        <div className="flex items-center py-2">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mr-3">
            {row.avatar ? (
              <img src={row.avatar} alt={row.full_name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <span className="text-blue-600 font-semibold text-lg">
                {row.full_name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{row.full_name}</div>
            <div className="text-sm text-gray-600">{row.qualifications}</div>
          </div>
        </div>
      ),
      style: { minWidth: '200px' },
      sortable: true,
      selector: row => row.full_name,
    },
    {
      name: 'Chuyên khoa',
      selector: row => row.specialization,
      sortable: true,
      style: { minWidth: '150px' },
    },
    {
      name: 'Kinh nghiệm',
      selector: row => row.experience_years || 0,
      format: row => `${row.experience_years || 0} năm`,
      sortable: true,
      style: { minWidth: '100px' },
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
      style: { minWidth: '140px' },
    },
    {
      name: 'Tư vấn',
      selector: row => row.total_consultations || 0,
      format: row => `${row.total_consultations || 0} buổi`,
      sortable: true,
      style: { minWidth: '100px' },
    },
    {
      name: 'Trạng thái',
      cell: row => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          row.is_available 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {row.is_available ? 'Có thể tư vấn' : 'Tạm nghỉ'}
        </span>
      ),
      sortable: true,
      selector: row => row.is_available ? 1 : 0,
      style: { minWidth: '120px' },
    },
    {
      name: 'Hành động',
      cell: row => (
        <div className="flex gap-2">
          <button
            onClick={() => setSelectedConsultant(row)}
            className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
          >
            Xem chi tiết
          </button>
          {row.is_available && (
            <Link
              to={`/consultation/book-appointment?consultant=${row.consultant_id}`}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Đặt lịch
            </Link>
          )}
        </div>
      ),
      ignoreRowClick: true,
      style: { minWidth: '150px' },
    },
  ];

  const customStyles = {
    header: {
      style: {
        backgroundColor: '#f8fafc',
        borderBottom: '1px solid #e2e8f0',
      },
    },
    headRow: {
      style: {
        backgroundColor: '#f1f5f9',
        borderBottom: '1px solid #e2e8f0',
      },
    },
    headCells: {
      style: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#374151',
        paddingLeft: '16px',
        paddingRight: '16px',
      },
    },
    cells: {
      style: {
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px',
      },
    },
  };

  return (
    <div className="container mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Danh Sách Chuyên Gia</h1>
          <p className="text-gray-600">Tìm hiểu về các chuyên gia tư vấn sức khỏe</p>
        </div>

        {/* Filters */}
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700">Chuyên khoa:</label>
              <select
                value={filterSpecialization}
                onChange={(e) => setFilterSpecialization(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Tất cả</option>
                {specializations.map(spec => (
                  <option key={spec} value={spec}>{spec}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {error ? (
            <div className="text-center py-8">
              <div className="text-red-600 mb-4">❌ {error}</div>
              <button
                onClick={fetchConsultants}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Thử lại
              </button>
            </div>
          ) : (
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
          )}
        </div>
      </div>

      {/* Consultant Detail Modal */}
      {selectedConsultant && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Thông tin chuyên gia</h3>
              <button
                onClick={() => setSelectedConsultant(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            
            <div className="text-center mb-4">
              <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                {selectedConsultant.avatar ? (
                  <img 
                    src={selectedConsultant.avatar} 
                    alt={selectedConsultant.full_name} 
                    className="w-20 h-20 rounded-full object-cover" 
                  />
                ) : (
                  <span className="text-blue-600 font-semibold text-2xl">
                    {selectedConsultant.full_name.charAt(0)}
                  </span>
                )}
              </div>
              <h4 className="text-xl font-semibold text-gray-800">{selectedConsultant.full_name}</h4>
              <p className="text-gray-600">{selectedConsultant.specialization}</p>
            </div>

            <div className="space-y-3 mb-6">
              <div>
                <span className="text-gray-600 text-sm">Trình độ:</span>
                <p className="font-medium">{selectedConsultant.qualifications}</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Kinh nghiệm:</span>
                <p className="font-medium">{selectedConsultant.experience_years} năm</p>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Đánh giá:</span>
                <div className="flex items-center">
                  <div className="flex mr-2">
                    {renderStars(selectedConsultant.rating || 0)}
                  </div>
                  <span className="text-sm text-gray-600">
                    ({selectedConsultant.rating?.toFixed(1) || '0.0'})
                  </span>
                </div>
              </div>
              <div>
                <span className="text-gray-600 text-sm">Số buổi tư vấn:</span>
                <p className="font-medium">{selectedConsultant.total_consultations || 0} buổi</p>
              </div>
              {selectedConsultant.bio && (
                <div>
                  <span className="text-gray-600 text-sm">Giới thiệu:</span>
                  <p className="text-sm">{selectedConsultant.bio}</p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setSelectedConsultant(null)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Đóng
              </button>
              {selectedConsultant.is_available && (
                <Link
                  to={`/consultation/book-appointment?consultant=${selectedConsultant.consultant_id}`}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center"
                >
                  Đặt lịch tư vấn
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantList;