import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Button, 
  Tag, 
  Modal, 
  Card, 
  Space, 
  Row, 
  Col, 
  Input, 
  DatePicker,
  Select,
  Collapse,
  Descriptions,
  Alert,
  Empty,
  Tooltip,
  Badge
} from 'antd';
import { 
  EyeOutlined,
  FileTextOutlined,
  CalendarOutlined,
  UserOutlined,
  ExperimentOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  SearchOutlined,
  ClearOutlined
} from '@ant-design/icons';
import { useAuth } from '../../../../../frontend/src/contexts/AuthContext';
import apiClient from '../../../services/apiClient';
import { API } from '../../../config/apiEndpoints';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Panel } = Collapse;
const { Search } = Input;

interface StiTest {
  _id: string;
  sti_test_name: string;
  sti_test_code: string;
  description: string;
  price: number;
  category: string;
  sti_test_type: string;
}

interface StiResultItem {
  result: {
    blood?: {
      platelets?: number;
      red_blood_cells?: number;
      white_blood_cells?: number;
      hemo_level?: number;
      hiv?: boolean | null;
      HBsAg?: boolean | null;
      anti_HBs?: boolean | null;
      anti_HBc?: boolean | null;
      anti_HCV?: boolean | null;
      HCV_RNA?: boolean | null;
      TPHA_syphilis?: boolean | null;
      VDRL_syphilis?: boolean | null;
      RPR_syphilis?: boolean | null;
      treponema_pallidum_IgM?: boolean | null;
      treponema_pallidum_IgG?: boolean | null;
    };
    swab?: {
      bacteria?: string[];
      virus?: string[];
      parasites?: string[];
      PCR_HSV?: boolean | null;
      HPV?: boolean | null;
      NAAT_Trichomonas?: boolean | null;
      rapidAntigen_Trichomonas?: boolean | null;
      culture_Trichomonas?: boolean | null;
    };
    urine?: {
      color?: string;
      clarity?: string;
      GLU?: number;
      KET?: number;
      PRO?: number;
      NIT?: number;
      pH?: number;
      blood?: boolean;
      LEU?: number;
    };
    sample_type: string;
    time_completed: string;
    staff_id: string;
  };
  sti_test_id: StiTest;
  _id: string;
}

interface StiResult {
  _id: string;
  sti_order_id: string;
  sti_result_items: StiResultItem[];
  is_testing_completed: boolean;
  diagnosis: string;
  is_confirmed: boolean;
  is_critical: boolean;
  medical_notes: string;
  createdAt: string;
  updatedAt: string;
}

interface StiResultsPageProps {
  userRole?: 'customer' | 'staff' | 'consultant';
}

const StiResultsPage: React.FC<StiResultsPageProps> = () => {
  const [results, setResults] = useState<StiResult[]>([]);
  const [filteredResults, setFilteredResults] = useState<StiResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<StiResult | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  
  // Filter states
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs] | null>(null);
  const [confirmationFilter, setConfirmationFilter] = useState<string>('all');

  useEffect(() => {
    fetchResults();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [results, searchText, statusFilter, dateRange, confirmationFilter]);

  const fetchResults = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(API.STI.MY_STI_RESULTS);
      const resData = (response as any).data;

      if (resData?.success) {
        const confirmedResults = (resData.data || []).filter((item: any) => item.is_confirmed === true);
        setResults(confirmedResults || []);
      } else {
        console.error('Failed to fetch results:', resData?.message);
      }
    } catch (error) {
      console.error('Error fetching STI results:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...results];

    // Search filter
    if (searchText) {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(result => 
        result.sti_order_id.toLowerCase().includes(searchLower) ||
        result.diagnosis.toLowerCase().includes(searchLower) ||
        result.medical_notes.toLowerCase().includes(searchLower) ||
        result.sti_result_items.some(item => 
          item.sti_test_id.sti_test_name.toLowerCase().includes(searchLower) ||
          item.sti_test_id.sti_test_code.toLowerCase().includes(searchLower)
        )
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(result => {
        if (statusFilter === 'completed') return result.is_testing_completed;
        if (statusFilter === 'pending') return !result.is_testing_completed;
        return true;
      });
    }

    // Confirmation filter
    if (confirmationFilter !== 'all') {
      filtered = filtered.filter(result => {
        if (confirmationFilter === 'confirmed') return result.is_confirmed;
        if (confirmationFilter === 'unconfirmed') return !result.is_confirmed;
        return true;
      });
    }

    // Date range filter
    if (dateRange) {
      filtered = filtered.filter(result => {
        const resultDate = dayjs(result.createdAt);
        return resultDate.isAfter(dateRange[0].startOf('day')) && 
               resultDate.isBefore(dateRange[1].endOf('day'));
      });
    }

    setFilteredResults(filtered);
  };

  const handleClearFilters = () => {
    setSearchText('');
    setStatusFilter('all');
    setDateRange(null);
    setConfirmationFilter('all');
  };

  const getStatusColor = (result: StiResult) => {
    if (result.is_critical) return 'red';
    if (result.is_confirmed && result.is_testing_completed) return 'green';
    if (result.is_testing_completed && !result.is_confirmed) return 'orange';
    return 'blue';
  };

  const getStatusText = (result: StiResult) => {
    if (result.is_critical) return 'Cần chú ý';
    if (result.is_confirmed && result.is_testing_completed) return 'Đã xác nhận';
    if (result.is_testing_completed && !result.is_confirmed) return 'Chờ xác nhận';
    return 'Đang xử lý';
  };

  const renderTestResult = (item: StiResultItem) => {
    const { result, sti_test_id } = item;
    
    return (
      <Card 
        key={item._id} 
        size="small" 
        style={{ marginBottom: 12 }}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{sti_test_id.sti_test_name}</span>
            <Tag color="blue">{sti_test_id.sti_test_type}</Tag>
          </div>
        }
      >
        <Descriptions size="small" column={2} bordered>
          <Descriptions.Item label="Mã xét nghiệm">
            {sti_test_id.sti_test_code}
          </Descriptions.Item>
          <Descriptions.Item label="Loại mẫu">
            {result.sample_type === 'blood' ? 'Máu' : 
             result.sample_type === 'swab' ? 'Dịch âm đạo/niệu đạo' : 
             result.sample_type === 'urine' ? 'Nước tiểu' : result.sample_type}
          </Descriptions.Item>
          <Descriptions.Item label="Thời gian hoàn thành" span={2}>
            {dayjs(result.time_completed).format('DD/MM/YYYY HH:mm')}
          </Descriptions.Item>
        </Descriptions>

        {/* Render specific test results */}
        {result.blood && (
          <div style={{ marginTop: 12 }}>
            <strong>Kết quả xét nghiệm máu:</strong>
            <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
              {Object.entries(result.blood).map(([key, value]) => {
                if (value === null || value === undefined) return null;

                let displayValue: string | number;
                let color = 'default';

                if (typeof value === 'boolean') {
                    displayValue = value ? 'Dương tính' : 'Âm tính';
                    color = value ? 'red' : 'green';
                } else {
                    displayValue = value; // số hoặc chuỗi
                }

                return (
                    <Col span={12} key={key}>
                    <Tag color={color}>
                        {key}: {displayValue}
                    </Tag>
                    </Col>
                );
            })}
            </Row>
          </div>
        )}

<<<<<<< HEAD
        {result.swab && (((result.swab.bacteria?.length ?? 0) > 0 ||
                          (result.swab.virus?.length ?? 0) > 0 ||
                          (result.swab.parasites?.length ?? 0) > 0 ||
                          result.swab.PCR_HSV !== null ||
                          result.swab.HPV !== null ||
                          result.swab.NAAT_Trichomonas !== null ||
                          result.swab.rapidAntigen_Trichomonas !== null ||
                          result.swab.culture_Trichomonas !== null) &&
=======
        {result.swab && (
>>>>>>> e27dadd9bbb88346272f3cfb2875fc6d5fa6c2ca
          <div style={{ marginTop: 12 }}>
            <strong>Kết quả xét nghiệm dịch:</strong>
            <div style={{ marginTop: 8 }}>
              {result.swab.bacteria && result.swab.bacteria.length > 0 && (
                <div>
                  <span style={{ fontWeight: 500 }}>Vi khuẩn: </span>
                  {result.swab.bacteria.map(bacteria => (
                    <Tag color="orange" key={bacteria}>{bacteria}</Tag>
                  ))}
                </div>
              )}
              {result.swab.virus && result.swab.virus.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontWeight: 500 }}>Virus: </span>
                  {result.swab.virus.map(virus => (
                    <Tag color="red" key={virus}>{virus}</Tag>
                  ))}
                </div>
              )}
              {result.swab.parasites && result.swab.parasites.length > 0 && (
                <div style={{ marginTop: 4 }}>
                  <span style={{ fontWeight: 500 }}>Ký sinh trùng: </span>
                  {result.swab.parasites.map(parasite => (
                    <Tag color="purple" key={parasite}>{parasite}</Tag>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {result.urine && (
          <div style={{ marginTop: 12 }}>
            <strong>Kết quả xét nghiệm nước tiểu:</strong>
            <Row gutter={[16, 8]} style={{ marginTop: 8 }}>
              {Object.entries(result.urine).map(([key, value]) => {
                if (value === null || value === undefined) return null;
                
                let displayValue: string | number | boolean = value;
                let color = 'default';
                if (typeof value === 'boolean') {
                  displayValue = value ? 'Có' : 'Không';
                  color = value ? 'red' : 'green';
                }
                
                return (
                  <Col span={12} key={key}>
                    <Tag color={color}>
                      {key}: {displayValue}
                    </Tag>
                  </Col>
                );
              })}
            </Row>
          </div>
        )}
      </Card>
    );
  };

  const columns = [
    {
      title: 'Mã đơn hàng',
      dataIndex: 'sti_order_id',
      key: 'sti_order_id',
      width: 150,
      render: (orderId: string) => (
        <span style={{ fontFamily: 'monospace' }}>
          {orderId.slice(-8)}
        </span>
      )
    },
    {
      title: 'Số lượng xét nghiệm',
      key: 'test_count',
      width: 120,
      render: (_: any, record: StiResult) => (
        <Badge 
          count={record.sti_result_items.length} 
          style={{ backgroundColor: '#52c41a' }}
        />
      )
    },
    {
      title: 'Trạng thái',
      key: 'status',
      width: 120,
      render: (_: any, record: StiResult) => (
        <Tag color={getStatusColor(record)} icon={
          record.is_critical ? <WarningOutlined /> :
          record.is_confirmed ? <CheckCircleOutlined /> : <ClockCircleOutlined />
        }>
          {getStatusText(record)}
        </Tag>
      )
    },
    {
      title: 'Chẩn đoán',
      dataIndex: 'diagnosis',
      key: 'diagnosis',
      width: 200,
      render: (diagnosis: string) => (
        <span>{diagnosis || 'Chưa có chẩn đoán'}</span>
      )
    },
    {
      title: 'Ngày tạo',
      dataIndex: 'createdAt',
      key: 'createdAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Cập nhật cuối',
      dataIndex: 'updatedAt',
      key: 'updatedAt',
      width: 120,
      render: (date: string) => dayjs(date).format('DD/MM/YYYY')
    },
    {
      title: 'Hành động',
      key: 'actions',
      width: 100,
      render: (_: any, record: StiResult) => (
        <Space>
          <Tooltip title="Xem chi tiết">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedResult(record);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FileTextOutlined />
          Kết quả xét nghiệm STI
        </h2>
        <p style={{ color: '#666', margin: '4px 0 0 0' }}>
          Quản lý và xem chi tiết các kết quả xét nghiệm của bạn
        </p>
      </div>

      {/* Filters */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={6}>
            <Search
              placeholder="Tìm kiếm theo mã đơn, chẩn đoán..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: '100%' }}
              allowClear
            />
          </Col>
          
          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              value={statusFilter}
              onChange={setStatusFilter}
              placeholder="Trạng thái"
            >
              <Option value="all">Tất cả trạng thái</Option>
              <Option value="completed">Đã hoàn thành</Option>
              <Option value="pending">Đang xử lý</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <Select
              style={{ width: '100%' }}
              value={confirmationFilter}
              onChange={setConfirmationFilter}
              placeholder="Xác nhận"
            >
              <Option value="all">Tất cả</Option>
              <Option value="confirmed">Đã xác nhận</Option>
              <Option value="unconfirmed">Chờ xác nhận</Option>
            </Select>
          </Col>

          <Col xs={24} sm={12} md={6}>
            <RangePicker
              style={{ width: '100%' }}
              value={dateRange}
              onChange={(dates) => setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs] | null)}
              format="DD/MM/YYYY"
              placeholder={['Từ ngày', 'Đến ngày']}
            />
          </Col>

          <Col xs={24} sm={24} md={24}>
            <Button 
              icon={<ClearOutlined />}
              onClick={handleClearFilters}
            >
              Xóa bộ lọc
            </Button>
          </Col>
        </Row>
      </Card>

      {/* Statistics Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: '16px' }}>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#1890ff' }}>
                {results.length}
              </div>
              <div style={{ color: '#666' }}>Tổng số kết quả</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#52c41a' }}>
                {results.filter(r => r.is_confirmed && r.is_testing_completed).length}
              </div>
              <div style={{ color: '#666' }}>Đã xác nhận</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#faad14' }}>
                {results.filter(r => r.is_testing_completed && !r.is_confirmed).length}
              </div>
              <div style={{ color: '#666' }}>Chờ xác nhận</div>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={8} md={6}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f5222d' }}>
                {results.filter(r => r.is_critical).length}
              </div>
              <div style={{ color: '#666' }}>Cần chú ý</div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Results Table */}
      <Card>
        <Table
          columns={columns}
          dataSource={filteredResults}
          rowKey="_id"
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} kết quả`,
          }}
          locale={{
            emptyText: (
              <Empty
                image={Empty.PRESENTED_IMAGE_SIMPLE}
                description="Không có kết quả nào"
              />
            )
          }}
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExperimentOutlined />
            Chi tiết kết quả xét nghiệm
          </div>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={1000}
        style={{ top: 20 }}
      >
        {selectedResult && (
          <div>
            {/* Header Info */}
            <Card style={{ marginBottom: 16 }}>
              <Row gutter={[16, 16]}>
                <Col span={12}>
                  <strong>Mã đơn hàng:</strong> {selectedResult.sti_order_id}
                </Col>
                <Col span={12}>
                  <strong>Trạng thái:</strong>
                  <Tag color={getStatusColor(selectedResult)} style={{ marginLeft: 8 }}>
                    {getStatusText(selectedResult)}
                  </Tag>
                </Col>
                <Col span={12}>
                  <strong>Ngày tạo:</strong> {dayjs(selectedResult.createdAt).format('DD/MM/YYYY HH:mm')}
                </Col>
                <Col span={12}>
                  <strong>Cập nhật cuối:</strong> {dayjs(selectedResult.updatedAt).format('DD/MM/YYYY HH:mm')}
                </Col>
              </Row>
            </Card>

            {/* Critical Alert */}
            {selectedResult.is_critical && (
              <Alert
                message="Kết quả cần chú ý"
                description="Kết quả xét nghiệm này cần được chú ý đặc biệt. Vui lòng liên hệ với bác sĩ để được tư vấn."
                type="error"
                showIcon
                style={{ marginBottom: 16 }}
              />
            )}

            {/* Diagnosis and Notes */}
            {(selectedResult.diagnosis || selectedResult.medical_notes) && (
              <Card title="Chẩn đoán và Ghi chú" style={{ marginBottom: 16 }}>
                {selectedResult.diagnosis && (
                  <div style={{ marginBottom: 12 }}>
                    <strong>Chẩn đoán:</strong>
                    <div style={{ 
                      marginTop: 4, 
                      padding: '8px 12px', 
                      backgroundColor: '#f6ffed', 
                      border: '1px solid #b7eb8f',
                      borderRadius: '6px'
                    }}>
                      {selectedResult.diagnosis}
                    </div>
                  </div>
                )}
                {selectedResult.medical_notes && (
                  <div>
                    <strong>Ghi chú y tế:</strong>
                    <div style={{ 
                      marginTop: 4, 
                      padding: '8px 12px', 
                      backgroundColor: '#fff7e6', 
                      border: '1px solid #ffd591',
                      borderRadius: '6px'
                    }}>
                      {selectedResult.medical_notes}
                    </div>
                  </div>
                )}
              </Card>
            )}

            {/* Test Results */}
            <Card title={`Kết quả xét nghiệm (${selectedResult.sti_result_items.length} xét nghiệm)`}>
              {selectedResult.sti_result_items.length > 0 ? (
                selectedResult.sti_result_items.map(renderTestResult)
              ) : (
                <Empty description="Chưa có kết quả xét nghiệm" />
              )}
            </Card>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default StiResultsPage;