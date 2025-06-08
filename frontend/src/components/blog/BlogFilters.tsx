import React, { useState, useEffect } from 'react';
import { BlogFilters as BlogFiltersType } from '../../types/blog';
import { Search, Filter, SortAsc, SortDesc, X } from 'lucide-react';
import { blogService } from '../../services/blogService';

interface BlogFiltersProps {
  filters: BlogFiltersType;
  onFiltersChange: (filters: BlogFiltersType) => void;
  onClearFilters: () => void;
  specializations: string[];
}

const BlogFilters: React.FC<BlogFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  specializations
}) => {
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFiltersChange({
      ...filters,
      searchQuery: e.target.value
    });
  };

  const handleSpecializationChange = (specialization: string) => {
    onFiltersChange({
      ...filters,
      specialization: filters.specialization === specialization ? undefined : specialization
    });
  };

  const handleSortChange = (sortBy: string) => {
    const newSortOrder = filters.sortBy === sortBy && filters.sortOrder === 'desc' ? 'asc' : 'desc';
    onFiltersChange({
      ...filters,
      sortBy: sortBy as any,
      sortOrder: newSortOrder
    });
  };

  const hasActiveFilters = filters.searchQuery || filters.specialization || filters.sortBy;

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Thanh tìm kiếm */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm bài viết..."
            value={filters.searchQuery || ''}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Nút filter */}
        <button
          onClick={() => setIsFilterOpen(!isFilterOpen)}
          className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
            isFilterOpen || filters.specialization
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Lọc theo chuyên khoa
        </button>

        {/* Nút sắp xếp */}
        <div className="flex gap-2">
          <button
            onClick={() => handleSortChange('publish_date')}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              filters.sortBy === 'publish_date'
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {filters.sortBy === 'publish_date' && filters.sortOrder === 'desc' ? (
              <SortDesc className="w-4 h-4 mr-2" />
            ) : (
              <SortAsc className="w-4 h-4 mr-2" />
            )}
            Ngày đăng
          </button>

          <button
            onClick={() => handleSortChange('title')}
            className={`flex items-center px-4 py-2 border rounded-lg transition-colors ${
              filters.sortBy === 'title'
                ? 'bg-blue-50 border-blue-300 text-blue-700'
                : 'border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            {filters.sortBy === 'title' && filters.sortOrder === 'desc' ? (
              <SortDesc className="w-4 h-4 mr-2" />
            ) : (
              <SortAsc className="w-4 h-4 mr-2" />
            )}
            Tiêu đề
          </button>
        </div>

        {/* Nút xóa filter */}
        {hasActiveFilters && (
          <button
            onClick={onClearFilters}
            className="flex items-center px-4 py-2 border border-red-300 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
          >
            <X className="w-4 h-4 mr-2" />
            Xóa bộ lọc
          </button>
        )}
      </div>

      {/* Dropdown chuyên khoa */}
      {isFilterOpen && (
        <div className="mt-4 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium text-gray-900 mb-3">Chọn chuyên khoa:</h4>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {specializations.map((specialization) => (
              <button
                key={specialization}
                onClick={() => handleSpecializationChange(specialization)}
                className={`px-3 py-2 text-sm rounded-lg border transition-colors ${
                  filters.specialization === specialization
                    ? 'bg-blue-100 border-blue-300 text-blue-700'
                    : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {specialization}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Hiển thị filter đang áp dụng */}
      {hasActiveFilters && (
        <div className="mt-4 flex flex-wrap gap-2">
          {filters.searchQuery && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
              Tìm kiếm: "{filters.searchQuery}"
            </span>
          )}
          {filters.specialization && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
              Chuyên khoa: {filters.specialization}
            </span>
          )}
          {filters.sortBy && (
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-purple-100 text-purple-800">
              Sắp xếp: {filters.sortBy === 'publish_date' ? 'Ngày đăng' : 'Tiêu đề'} 
              ({filters.sortOrder === 'desc' ? 'Giảm dần' : 'Tăng dần'})
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default BlogFilters; 