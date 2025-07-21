import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Blog, BlogQuery, PaginationInfo } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { useAuth } from '../../contexts/AuthContext';
import BlogCard from '../../components/blog/BlogCard';
import { Plus, FileText, Loader, ChevronLeft, ChevronRight, Search, Filter, SortAsc, Users } from 'lucide-react';

const BlogListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 10,
    has_next: false,
    has_prev: false
  });
  
  // Separate state for search input to enable debounce
  const [searchTerm, setSearchTerm] = useState('');
  
  const [query, setQuery] = useState<BlogQuery>({
    page: 1,
    limit: 12,
    sort_by: 'publish_date',
    sort_order: 'desc'
  });

  const isConsultant = user?.role === 'consultant';

  const handleSearch = () => {
    setQuery(prev => ({
      ...prev,
      page: 1,
      search: searchTerm.trim() || undefined,
    }));
  };

  // Debounce search term - REMOVED
  /*
  useEffect(() => {
    const timer = setTimeout(() => {
      setQuery(prev => ({
        ...prev,
        page: 1,
        search: searchTerm.trim() || undefined,
        // Ensure sort fields remain valid
        sort_by: prev.sort_by || 'publish_date',
        sort_order: prev.sort_order || 'desc'
      }));
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchTerm]);
  */

  // Debug query changes
  useEffect(() => {
  }, [query]);

  useEffect(() => {
    fetchBlogs();
  }, [query]);

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('--- [FRONTEND] Sending query to backend:', JSON.stringify(query, null, 2));
      const response = await blogService.getBlogs(query);
      
      if (response.success) {
        setBlogs(response.data.blogs);
        setPagination(response.data.pagination);
      } else {
        setError(response.message || 'Có lỗi xảy ra khi tải danh sách blog');
      }
    } catch (error) {
      setError('Không thể tải danh sách blog. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlogClick = (blogId: string) => {
    navigate(`/blogs/${blogId}`);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
  };

  const handleSortChange = (sort_by: string, sort_order: 'asc' | 'desc') => {
    // Validate sort_order
    const validSortOrder = ['asc', 'desc'].includes(sort_order) ? sort_order : 'desc';
    const validSortBy = ['publish_date', 'updated_date', 'title'].includes(sort_by) ? sort_by : 'publish_date';
    
    
    setQuery(prev => ({
      ...prev,
      page: 1,
      sort_by: validSortBy as any,
      sort_order: validSortOrder
    }));
  };

  const handleAuthorFilter = (authorId?: string) => {
    setQuery(prev => ({
      ...prev,
      page: 1,
      author_id: authorId
    }));
  };

  const handlePageChange = (page: number) => {
    setQuery(prev => ({ ...prev, page }));
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setQuery({
      page: 1,
      limit: 12,
      sort_by: 'publish_date',
      sort_order: 'desc'
    });
  };

  const handleCreateBlog = () => {
    navigate('/blogs/create');
  };

  // Generate page numbers for pagination
  const generatePageNumbers = () => {
    const pages = [];
    const { current_page, total_pages } = pagination;
    
    // Always show first page
    if (total_pages > 1) pages.push(1);
    
    // Add pages around current page
    for (let i = Math.max(2, current_page - 1); i <= Math.min(total_pages - 1, current_page + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    
    // Always show last page
    if (total_pages > 1 && !pages.includes(total_pages)) {
      pages.push(total_pages);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang tải danh sách blog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
        {/* Header + Search + Filters - All in one */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-600 mb-4">
              Blog Sức Khỏe
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">
              Khám phá những kiến thức hữu ích về sức khỏe từ các chuyên gia
            </p>
            


            {isConsultant && (
              <button
                onClick={handleCreateBlog}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium shadow-sm mb-8"
              >
                <Plus className="w-5 h-5 mr-2" />
                Viết bài mới
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 flex gap-2">
                <div className="relative flex-grow">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm bài viết..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearch();
                      }
                    }}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 placeholder-gray-500"
                  />
                </div>
                <button
                  onClick={handleSearch}
                  className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                >
                  Tìm kiếm
                </button>
              </div>

              {/* Sort and Filter */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <select
                    value={`${query.sort_by || 'publish_date'}_${query.sort_order || 'desc'}`}
                    onChange={(e) => {
                      const [sort_by, sort_order] = e.target.value.split('_');
                      if (sort_by && sort_order) {
                        handleSortChange(sort_by, sort_order as 'asc' | 'desc');
                      }
                    }}
                    className="appearance-none pl-4 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white min-w-40"
                  >
                    <option value="publish_date_desc">Mới nhất</option>
                    <option value="publish_date_asc">Cũ nhất</option>
                    <option value="title_asc">Tiêu đề A-Z</option>
                    <option value="title_desc">Tiêu đề Z-A</option>
                  </select>
                  <SortAsc className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
                </div>

                <button
                  onClick={handleClearFilters}
                  className="px-4 py-3 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Xóa bộ lọc
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-4 h-4 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-medium text-red-800">Có lỗi xảy ra</h3>
                <p className="text-sm text-red-700">{error}</p>
                <button
                  onClick={fetchBlogs}
                  className="mt-1 text-sm text-red-600 hover:text-red-800 font-medium underline"
                >
                  Thử lại
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Blog grid */}
        {blogs.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 mb-8">
              {blogs.map((blog) => (
                <BlogCard
                  key={blog.blog_id}
                  blog={blog}
                  onClick={handleBlogClick}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_pages > 1 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    Hiển thị <span className="font-medium text-gray-900">{(pagination.current_page - 1) * pagination.items_per_page + 1}</span> - <span className="font-medium text-gray-900">{Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)}</span> trong tổng số <span className="font-medium text-gray-900">{pagination.total_items}</span> bài viết
                  </p>
                  
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handlePageChange(pagination.current_page - 1)}
                      disabled={!pagination.has_prev}
                      className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" />
                      Trước
                    </button>

                    {generatePageNumbers().map((page, index, array) => (
                      <React.Fragment key={page}>
                        {index > 0 && array[index - 1] < page - 1 && (
                          <span className="px-2 text-gray-400">...</span>
                        )}
                        <button
                          onClick={() => handlePageChange(page)}
                          className={`px-3 py-2 rounded-md font-medium transition-colors ${
                            page === pagination.current_page
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-600 hover:bg-gray-100 border border-gray-300'
                          }`}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    ))}

                    <button
                      onClick={() => handlePageChange(pagination.current_page + 1)}
                      disabled={!pagination.has_next}
                      className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                    >
                      Sau
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : !loading && (
          <div className="text-center py-16">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 max-w-md mx-auto">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Không tìm thấy bài viết
              </h3>
              <p className="text-gray-600 mb-6">
                {query.search
                  ? 'Thử thay đổi từ khóa tìm kiếm để tìm thấy nhiều bài viết hơn.'
                  : 'Chưa có bài viết nào được đăng tải.'}
              </p>
              {query.search && (
                <button
                  onClick={handleClearFilters}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Xóa bộ lọc
                </button>
              )}
            </div>
          </div>
        )}

        {/* Info for consultants */}
        {isConsultant && blogs.length === 0 && !query.search && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-8 mt-6">
            <div className="text-center max-w-xl mx-auto">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Chào mừng bạn đến với nền tảng blog!
              </h3>
              <p className="text-gray-600 mb-6">
                Với tư cách là chuyên gia tư vấn, bạn có thể chia sẻ kiến thức và kinh nghiệm của mình 
                thông qua việc viết blog. Hãy bắt đầu tạo bài viết đầu tiên của bạn!
              </p>
              <button
                onClick={handleCreateBlog}
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Viết bài đầu tiên
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListPage;