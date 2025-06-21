import React, { useState } from 'react';
import { BlogFilters as BlogFiltersType } from '../../types/blog';
import { Search, Filter, X, SortAsc, SortDesc } from 'lucide-react';

interface BlogFiltersProps {
  filters: BlogFiltersType;
  onFiltersChange: (filters: BlogFiltersType) => void;
  onClearFilters: () => void;
  specializations: string[];
}

const sortOptions = [
  { value: "publish_date_desc", label: "Mới nhất", sortBy: "publish_date", sortOrder: "desc" },
  { value: "publish_date_asc", label: "Cũ nhất", sortBy: "publish_date", sortOrder: "asc" },
  { value: "title_asc", label: "A-Z", sortBy: "title", sortOrder: "asc" },
  { value: "title_desc", label: "Z-A", sortBy: "title", sortOrder: "desc" },
];

const BlogFilters: React.FC<BlogFiltersProps> = ({
  filters,
  onFiltersChange,
  onClearFilters,
  specializations
}) => {
  const [searchInput, setSearchInput] = useState(filters.searchQuery || '');

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    onFiltersChange({
      ...filters,
      searchQuery: value
    });
  };

  const handleSpecializationChange = (value: string) => {
    onFiltersChange({
      ...filters,
      specialization: value === filters.specialization ? undefined : value
    });
  };

  const handleSortChange = (value: string) => {
    const option = sortOptions.find(opt => opt.value === value);
    if (option) {
      onFiltersChange({
        ...filters,
        sortBy: option.sortBy as any,
        sortOrder: option.sortOrder as any
      });
    }
  };

  const removeSpecializationFilter = () => {
    onFiltersChange({
      ...filters,
      specialization: undefined
    });
  };

  const removeSearchFilter = () => {
    setSearchInput('');
    onFiltersChange({
      ...filters,
      searchQuery: undefined
    });
  };

  const getCurrentSortValue = () => {
    return `${filters.sortBy}_${filters.sortOrder}`;
  };

  const getCurrentSortLabel = () => {
    const option = sortOptions.find(opt => opt.value === getCurrentSortValue());
    return option?.label || "Mới nhất";
  };

  const activeFilters = [];
  if (filters.searchQuery) activeFilters.push({ type: 'search', value: filters.searchQuery });
  if (filters.specialization) activeFilters.push({ type: 'specialization', value: filters.specialization });

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="p-6 space-y-6">
        {/* Search and Sort Row */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Tìm kiếm bài viết..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full pl-10 pr-4 h-11 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20 transition-colors"
            />
          </div>

          {/* Specialization Filter */}
          <div className="relative">
            <select
              value={filters.specialization || ''}
              onChange={(e) => handleSpecializationChange(e.target.value)}
              className="appearance-none w-full sm:w-64 h-11 pl-10 pr-8 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20 bg-white transition-colors"
            >
              <option value="">Chọn chuyên khoa</option>
              {specializations.map((spec) => (
                <option key={spec} value={spec}>
                  {spec}
                </option>
              ))}
            </select>
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Sort Filter */}
          <div className="relative">
            <select
              value={getCurrentSortValue()}
              onChange={(e) => handleSortChange(e.target.value)}
              className="appearance-none w-full sm:w-48 h-11 pl-10 pr-8 border border-slate-200 rounded-lg focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500 focus:ring-opacity-20 bg-white transition-colors"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            {filters.sortOrder === 'desc' ? (
              <SortDesc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            ) : (
              <SortAsc className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-4 h-4" />
            )}
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
              <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm font-medium text-slate-600">Bộ lọc đang áp dụng:</span>
            {activeFilters.map((filter, index) => (
              <span
                key={index}
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700"
              >
                {filter.type === 'search' ? `Tìm kiếm: "${filter.value}"` : filter.value}
                <button
                  onClick={() => filter.type === 'search' ? removeSearchFilter() : removeSpecializationFilter()}
                  className="ml-2 hover:text-red-600 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            <button
              onClick={onClearFilters}
              className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
            >
              Xóa tất cả
            </button>
          </div>
        )}

        {/* Results Info */}
        <div className="text-sm text-slate-500">
          Sắp xếp theo: <span className="font-medium">{getCurrentSortLabel()}</span>
        </div>
      </div>
    </div>
  );
};

export default BlogFilters;