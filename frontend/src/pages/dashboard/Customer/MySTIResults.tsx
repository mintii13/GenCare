/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Modal, Descriptions, Tag, Spin, Alert, Typography } from 'antd';
import { EyeOutlined, FileTextOutlined, CalendarOutlined } from '@ant-design/icons';
import { getMySTIResults, getMySTIResultByOrderId, StiResultListResponse, StiResultResponse } from '../../../services/stiResultService';
import { toast } from 'react-hot-toast';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

interface STIResult {
    order_id: string;
    order_date: string;
    order_status: string;
    result: {
        is_confirmed: boolean;
        time_result: string;
        result_value: string;
        diagnosis: string;
        notes: string;
    };
}

interface STIResultDetail {
    order: {
        _id: string;
        order_date: string;
        order_status: string;
        notes: string;
    };
    result: {
        is_confirmed: boolean;
        time_result: string;
        result_value: string;
        diagnosis: string;
        notes: string;
        is_critical: boolean;
        sample: {
            timeReceived: string;
            timeTesting: string;
            sampleQualities: Record<string, boolean>;
        };
    };
}

const MySTIResults: React.FC = () => {
    const [results, setResults] = useState<STIResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailModalVisible, setDetailModalVisible] = useState(false);
    const [selectedResult, setSelectedResult] = useState<STIResultDetail | null>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchMyResults();
    }, []);

    const fetchMyResults = async () => {
        try {
            setLoading(true);
            const response = await getMySTIResults() as StiResultListResponse;
            if (response.success) {
                    setResults(response.data as any); // TODO: fix this    
            } else {
                toast.error('Không thể tải kết quả STI');
            }
        } catch (error) {
            console.error('Error fetching STI results:', error);
            toast.error('Có lỗi xảy ra khi tải kết quả STI');
        } finally {
            setLoading(false);
        }
    };

    const handleViewDetail = async (orderId: string) => {
        try {
            setDetailLoading(true);
            setDetailModalVisible(true);
            
            const response = await getMySTIResultByOrderId(orderId) as StiResultResponse;
            if (response.success) {
                console.log(response.data);
                setSelectedResult(response.data as unknown as STIResultDetail);
            } else {
                toast.error('Không thể tải chi tiết kết quả');
                setDetailModalVisible(false);
            }
        } catch (error) {
            console.error('Error fetching STI result detail:', error);
            toast.error('Có lỗi xảy ra khi tải chi tiết kết quả');
            setDetailModalVisible(false);
        } finally {
            setDetailLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'green';
            case 'processing':
                return 'blue';
            case 'testing':
                return 'orange';
            case 'booked':
                return 'cyan';
            case 'canceled':
                return 'red';
            default:
                return 'default';
        }
    };

    const getStatusText = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'Hoàn thành';
            case 'processing':
                return 'Đang xử lý';
            case 'testing':
                return 'Đang xét nghiệm';
            case 'booked':
                return 'Đã đặt';
            case 'canceled':
                return 'Đã hủy';
            default:
                return status;
        }
    };

    const columns = [
        {
            title: 'Mã đơn hàng',
            dataIndex: 'order_id',
            key: 'order_id',
            render: (text: string) => (
                <Text code>{text ? text.slice(-8) : 'N/A'}</Text>
            )
        },
        {
            title: 'Ngày đặt',
            dataIndex: 'order_date',
            key: 'order_date',
            render: (date: string) => (
                <span>
                    <CalendarOutlined style={{ marginRight: 8 }} />
                    {dayjs(date).format('DD/MM/YYYY')}
                </span>
            )
        },
        {
            title: 'Trạng thái',
            dataIndex: 'order_status',
            key: 'order_status',
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>
                    {getStatusText(status)}
                </Tag>
            )
        },
        {
            title: 'Kết quả',
            key: 'result_status',
            render: (record: STIResult) => {
                if (!record.result) {
                    return <Text type="secondary">Chưa có kết quả</Text>;
                }
                
                if (record.result.is_confirmed) {
                    return (
                        <Tag color="green">
                            <FileTextOutlined style={{ marginRight: 4 }} />
                            Đã có kết quả
                        </Tag>
                    );
                } else {
                    return (
                        <Tag color="orange">
                            <FileTextOutlined style={{ marginRight: 4 }} />
                            Chờ xác nhận
                        </Tag>
                    );
                }
            }
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (record: STIResult) => (
                <Button
                    type="primary"
                    icon={<EyeOutlined />}
                    onClick={() => handleViewDetail(record.order_id)}
                    disabled={!record.result}
                >
                    Xem chi tiết
                </Button>
            )
        }
    ];

    const renderResultDetail = () => {
        if (!selectedResult) return null;

        const { order, result } = selectedResult;

        return (
            <div>
                <Descriptions title="Thông tin đơn hàng" bordered column={2}>
                    <Descriptions.Item label="Mã đơn hàng">
                        <Text code>{order._id}</Text>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ngày đặt">
                        {dayjs(order.order_date).format('DD/MM/YYYY')}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        <Tag color={getStatusColor(order.order_status)}>
                            {getStatusText(order.order_status)}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Ghi chú">
                        {order.notes || 'Không có ghi chú'}
                    </Descriptions.Item>
                </Descriptions>

                {result && (
                    <Descriptions title="Kết quả xét nghiệm" bordered column={2} style={{ marginTop: 24 }}>
                        <Descriptions.Item label="Trạng thái kết quả">
                            <Tag color={result.is_confirmed ? 'green' : 'orange'}>
                                {result.is_confirmed ? 'Đã xác nhận' : 'Chờ xác nhận'}
                            </Tag>
                        </Descriptions.Item>
                        <Descriptions.Item label="Ngày có kết quả">
                            {result.time_result ? dayjs(result.time_result).format('DD/MM/YYYY HH:mm') : 'Chưa có'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kết quả" span={2}>
                            {result.result_value || 'Chưa có kết quả'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Chẩn đoán" span={2}>
                            {result.diagnosis || 'Chưa có chẩn đoán'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú" span={2}>
                            {result.notes || 'Không có ghi chú'}
                            </Descriptions.Item>
                            {result.is_critical && (
                            <Descriptions.Item label="Mức độ" span={2}>
                                <Tag color="red">Quan trọng</Tag>
                            </Descriptions.Item>
                        )}
                    </Descriptions>
                )}

                {result?.sample && (
                    <Card title="Thông tin mẫu xét nghiệm" style={{ marginTop: 24 }}>
                        <Descriptions bordered column={2}>
                            <Descriptions.Item label="Thời gian nhận mẫu">
                                {result.sample.timeReceived ? dayjs(result.sample.timeReceived).format('DD/MM/YYYY HH:mm') : 'Chưa có'}
                            </Descriptions.Item>
                            <Descriptions.Item label="Thời gian xét nghiệm">
                                {result.sample.timeTesting ? dayjs(result.sample.timeTesting).format('DD/MM/YYYY HH:mm') : 'Chưa có'}
                            </Descriptions.Item>
                        </Descriptions>
                        
                        {result.sample.sampleQualities && Object.keys(result.sample.sampleQualities).length > 0 && (
                            <div style={{ marginTop: 16 }}>
                                <Title level={5}>Chất lượng mẫu:</Title>
                                {Object.entries(result.sample.sampleQualities).map(([testType, quality]) => (
                                    <div key={testType} style={{ marginBottom: 8 }}>
                                        <Text strong>{testType}: </Text>
                                        <Tag color={quality === true ? 'green' : quality === false ? 'red' : 'default'}>
                                            {quality === true ? 'Đạt' : quality === false ? 'Không đạt' : 'Chưa đánh giá'}
                                        </Tag>
                                    </div>
                                ))}
                            </div>
                        )}
                    </Card>
                )}
            </div>
        );
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>
                    <Text>Đang tải kết quả STI...</Text>
                </div>
            </div>
        );
    }

    return (
        <div style={{ padding: '24px' }}>
            <Title level={2}>Kết quả xét nghiệm STI của tôi</Title>
            
            {results.length === 0 ? (
                <Alert
                    message="Chưa có kết quả STI"
                    description="Bạn chưa có kết quả xét nghiệm STI nào. Vui lòng thực hiện đánh giá STI và đặt lịch tư vấn để có kết quả."
                    type="info"
                    showIcon
                />
            ) : (
                <Card>
                    <Table
                        columns={columns}
                        dataSource={results}
                        rowKey="order_id"
                        pagination={{
                            pageSize: 10,
                            showSizeChanger: true,
                            showQuickJumper: true,
                            showTotal: (total, range) => `${range[0]}-${range[1]} của ${total} kết quả`
                        }}
                    />
                </Card>
            )}

            <Modal
                title="Chi tiết kết quả STI"
                open={detailModalVisible}
                onCancel={() => setDetailModalVisible(false)}
                footer={[
                    <Button key="close" onClick={() => setDetailModalVisible(false)}>
                        Đóng
                    </Button>
                ]}
                width={800}
            >
                {detailLoading ? (
                    <div style={{ textAlign: 'center', padding: '50px' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16 }}>
                            <Text>Đang tải chi tiết kết quả...</Text>
                        </div>
                    </div>
                ) : (
                    renderResultDetail()
                )}
            </Modal>
        </div>
    );
};

export default MySTIResults; 