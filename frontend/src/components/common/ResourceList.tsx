import React, { ReactNode } from 'react';
import { Card, Input, Button, Row, Col, Table, Typography, Space } from 'antd';
import { TableProps } from 'antd/es/table';
import { SearchOutlined } from '@ant-design/icons';
import { PaginationInfo } from '../../hooks/usePaginatedResource';

const { Title } = Typography;

// Props have been updated. The component no longer fetches data itself.
interface ResourceListProps<T extends object> {
  resourceTitle: string;
  tableColumns: TableProps<T>['columns'];
  rowKey: keyof T | ((record: T) => string);
  
  // Data and state are now passed in as props from the parent
  data: T[];
  loading: boolean;
  pagination: PaginationInfo;

  // Handlers are also passed in
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  handlePageChange: (page: number, pageSize?: number) => void;
  
  // Optional slots for UI customization
  filterControls?: ReactNode;
  headerActions?: ReactNode;
  emptyText?: string;
}

const ResourceList = <T extends object>({
  resourceTitle,
  tableColumns,
  rowKey,
  data,
  loading,
  pagination,
  searchTerm,
  setSearchTerm,
  handlePageChange,
  filterControls,
  headerActions,
  emptyText = 'No data found',
}: ResourceListProps<T>) => {
  return (
    <div style={{ padding: '24px' }}>
      {/* Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <Title level={2}>{resourceTitle}</Title>
        <Space>{headerActions}</Space>
      </div>

      {/* Filter Section */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input
              placeholder="Search..."
              prefix={<SearchOutlined />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          {/* Render any additional filter controls passed in from parent */}
          {filterControls}
        </Row>
      </Card>

      {/* Table Section */}
      <Table
        columns={tableColumns}
        dataSource={data}
        loading={loading}
        rowKey={rowKey}
        pagination={{
          current: pagination.current_page,
          pageSize: pagination.items_per_page,
          total: pagination.total_items,
          showSizeChanger: true,
          showQuickJumper: true,
          showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          onChange: handlePageChange,
        }}
        locale={{ emptyText }}
        scroll={{ x: 'max-content' }}
      />
    </div>
  );
};

export default ResourceList; 