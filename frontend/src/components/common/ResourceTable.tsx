import React from 'react';
import { Table } from 'antd';

interface ResourceTableProps<T> {
  data: T[];
  columns: any[];
  loading?: boolean;
  pagination?: any;
  filters?: React.ReactNode;
  onRowClick?: (record: T) => void;
}

export function ResourceTable<T extends object>({
  data,
  columns,
  loading,
  pagination,
  filters,
  onRowClick,
}: ResourceTableProps<T>) {
  return (
    <div>
      {filters && <div className="mb-4">{filters}</div>}
      <Table
        columns={columns}
        dataSource={data}
        loading={loading}
        pagination={pagination}
        rowKey={(record) => (record as any)._id || (record as any).id}
        onRow={onRowClick ? (record) => ({ onClick: () => onRowClick(record) }) : undefined}
      />
    </div>
  );
} 