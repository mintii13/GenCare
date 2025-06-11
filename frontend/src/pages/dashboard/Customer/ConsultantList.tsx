import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import DataTable, { TableColumn } from 'react-data-table-component';

interface Consultant {
  _id: string;
  specialization: string;
  qualifications: string;
  experience_years?: number;
  rating?: number;
  total_consultations?: number;
  user_id: {
    _id: string;
    full_name: string;
    email: string;
    avatar?: string;
  };
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

  useEffect(() => {
    fetchConsultants();
  }, [filterSpecialization]);

  const fetchConsultants = async () => {
    try {
      setLoading(true);
      // TODO: Replace with actual API call
      // For now using mock data
      const mockConsultants: Consultant[] = [
        {
          _id: '1',
          specialization: 'Sức khỏe sinh sản',
          qualifications: 'Bác sĩ chuyên khoa I',
          experience_years: 8,
          rating: 4.8,
          total_consultations: 324,
          user_id: {
            _id: 'u1',
            full_name: 'BS. Nguyễn Văn An',
            email: 'nguyen.van.an@hospital.com'
          },
          bio: 'Chuyên gia với 8 năm kinh nghiệm trong lĩnh vực sức khỏe sinh sản, tư vấn kế hoạch hóa gia đình.',
          is_available: true
        },
        {
          _id: '2',
          specialization: 'Dinh dưỡng',
          qualifications: 'Thạc sĩ Dinh dưỡng',
          experience_years: 5,
          rating: 4.6,
          total_consultations: 156,
          user_id: {
            _id: 'u2',
            full_name: 'ThS. Trần Thị Bích',
            email: 'tran.thi.bich@nutrition.com'
          },
          bio: 'Chuyên gia dinh dưỡng với kinh nghiệm tư vấn chế độ ăn uống khoa học cho mọi lứa tuổi.',
          is_available: true
        },
        {
          _id: '3',
          specialization: 'Sức khỏe tâm thần',
          qualifications: 'Bác sĩ tâm thần',
          experience_years: 12,
          rating: 4.9,
          total_consultations: 542,
          user_id: {
            _id: 'u3',
            full_name: 'BS. Lê Minh Cường',
            email: 'le.minh.cuong@mental.com'
          },
          bio: 'Bác sĩ tâm thần với 12 năm kinh nghiệm, chuyên trị các vấn đề về stress, trầm cảm, lo âu.',
          is_available: false
        }
      ];

      // Apply filter
      const filteredData = filterSpecialization === 'all' 
        ? mockConsultants 
        : mockConsultants.filter(c => c.specialization === filterSpecialization);

      setConsultants(filteredData);
    } catch (err) {
      setError('Có lỗi xảy ra khi tải danh sách chuyên gia');
    } finally {
      setLoading(false);
    }
  };

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
            {row.user_id.avatar ? (
              <img src={row.user_id.avatar} alt={row.user_id.full_name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <span className="text-blue-600 font-semibold text-lg">
                {row.user_id.full_name.charAt(0)}
              </span>
            )}
          </div>
          <div>
            <div className="font-semibold text-gray-900">{row.user_id.full_name}</div>
            <div className="text-sm text-gray-600">{row.qualifications}</div>
          </div>
        </div>
      ),
      minWidth: '200px',
      sortable: true,
      selector: row => row.user_id.full_name,
    },
    {
      name: 'Chuyên khoa',
      selector: row => row.specialization,
      sortable: true,
      minWidth: '150px',
    },
    {
      name: 'Kinh nghiệm',
      selector: row => row.experience_years || 0,
      format: row => `${row.experience_years || 0} năm`,
      sortable: true,
      minWidth: '100px',
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
      minWidth: '140px',
    },
    {
      name: 'Tư vấn',
      selector: row => row.total_consultations || 0,
      format: row => `${row.total_consultations || 0} buổi`,
      sortable: true,
      minWidth: '100px',
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
      minWidth: '120px',
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
              to={`/dashboard/customer/book-appointment?consultant=${row._id}`}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
            >
              Đặt lịch
            </Link>
          )}
        </div>
      ),
      ignoreRowClick: true,
      minWidth: '150px',
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
    rows: {
      style: {
        fontSize: '14px',
        minHeight: '60px',
      },
    },
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách chuyên gia...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Danh Sách Chuyên Gia</h1>
          <p className="text-gray-600">Tìm và kết nối với các chuyên gia y tế</p>
        </div>

        {/* Filter */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center gap-4">
            <label className="font-medium text-gray-700">Lọc theo chuyên khoa:</label>
            <select
              value={filterSpecialization}
              onChange={(e) => setFilterSpecialization(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">Tất cả</option>
              {specializations.map(spec => (
                <option key={spec} value={spec}>{spec}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Consultants Table */}
        <div className="bg-white rounded-lg shadow-sm">
          <DataTable
            title="Chuyên Gia Y Tế"
            columns={columns}
            data={consultants}
            pagination
            paginationPerPage={10}
            paginationRowsPerPageOptions={[10, 20, 30]}
            highlightOnHover
            striped
            customStyles={customStyles}
            noDataComponent={
              <div className="p-8 text-center">
                <div className="text-gray-400 text-6xl mb-4">👨‍⚕️</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Không tìm thấy chuyên gia</h3>
                <p className="text-gray-600">Không có chuyên gia nào phù hợp với bộ lọc hiện tại.</p>
              </div>
            }
          />
        </div>

        {/* Detail Modal */}
        {selectedConsultant && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Thông Tin Chuyên Gia</h2>
                  <button
                    onClick={() => setSelectedConsultant(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>

                <div className="flex items-start gap-6 mb-6">
                  <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center">
                    {selectedConsultant.user_id.avatar ? (
                      <img 
                        src={selectedConsultant.user_id.avatar} 
                        alt={selectedConsultant.user_id.full_name} 
                        className="w-24 h-24 rounded-full object-cover" 
                      />
                    ) : (
                      <span className="text-blue-600 font-semibold text-2xl">
                        {selectedConsultant.user_id.full_name.charAt(0)}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-gray-900 mb-1">
                      {selectedConsultant.user_id.full_name}
                    </h3>
                    <p className="text-blue-600 font-medium mb-2">{selectedConsultant.qualifications}</p>
                    <p className="text-gray-600 mb-2">
                      <strong>Chuyên khoa:</strong> {selectedConsultant.specialization}
                    </p>
                    <p className="text-gray-600 mb-2">
                      <strong>Kinh nghiệm:</strong> {selectedConsultant.experience_years} năm
                    </p>
                    
                    <div className="flex items-center gap-4 mb-2">
                      <div className="flex items-center">
                        <span className="mr-2">Đánh giá:</span>
                        <div className="flex mr-2">
                          {renderStars(selectedConsultant.rating || 0)}
                        </div>
                        <span>({selectedConsultant.rating?.toFixed(1)})</span>
                      </div>
                      <span className="text-gray-600">
                        {selectedConsultant.total_consultations} buổi tư vấn
                      </span>
                    </div>

                    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${
                      selectedConsultant.is_available 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedConsultant.is_available ? 'Có thể tư vấn' : 'Tạm nghỉ'}
                    </span>
                  </div>
                </div>

                {selectedConsultant.bio && (
                  <div className="mb-6">
                    <h4 className="font-medium text-gray-900 mb-2">Giới thiệu:</h4>
                    <p className="text-gray-600 leading-relaxed">{selectedConsultant.bio}</p>
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedConsultant(null)}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    Đóng
                  </button>
                  
                  {selectedConsultant.is_available && (
                    <Link
                      to={`/dashboard/customer/book-appointment?consultant=${selectedConsultant._id}`}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-center"
                      onClick={() => setSelectedConsultant(null)}
                    >
                      Đặt lịch tư vấn
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantList; 