import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Blog, BlogFilters as BlogFiltersType } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { useAuth } from '../../contexts/AuthContext';
import BlogCard from '../../components/blog/BlogCard';
import BlogFilters from '../../components/blog/BlogFilters';
import { Plus, FileText, Loader, Wifi } from 'lucide-react';
import { runAllAPITests } from '../../utils/testAPI';

const BlogListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [apiTesting, setApiTesting] = useState(false);
  const [filters, setFilters] = useState<BlogFiltersType>({
    sortBy: 'publish_date',
    sortOrder: 'desc'
  });

  const isConsultant = user?.role === 'consultant';

  useEffect(() => {
    fetchBlogs();
  }, [filters]);

  const fetchBlogs = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('🔍 Fetching blogs with filters:', filters);
      const response = await blogService.getBlogs(filters);
      console.log('📊 API Response:', response);
      
      if (response.success) {
        // Lọc blog_id hợp lệ (24 ký tự)
        const validBlogs = response.data.blogs.filter(
          (blog) => typeof blog.blog_id === 'string' && blog.blog_id.length === 24
        );
        console.log('✅ Blogs loaded successfully:', validBlogs.length, 'blogs');
        setBlogs(validBlogs);
      } else {
        console.error('❌ API returned success: false');
        setError(response.message || 'Có lỗi xảy ra khi tải danh sách blog');
      }
    } catch (error) {
      console.error('💥 Error fetching blogs:', error);
      setError('Không thể tải danh sách blog. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleBlogClick = (blogId: string) => {
    navigate(`/blogs/${blogId}`);
  };

  const handleFiltersChange = (newFilters: BlogFiltersType) => {
    setFilters(newFilters);
  };

  const handleClearFilters = () => {
    setFilters({
      sortBy: 'publish_date',
      sortOrder: 'desc'
    });
  };

  const handleCreateBlog = () => {
    navigate('/blogs/create');
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Blog Sức Khỏe Sinh Sản
            </h1>
            <p className="text-gray-600">
              Khám phá những kiến thức hữu ích về sức khỏe sinh sản từ các chuyên gia
            </p>
          </div>
          
          <div className="flex gap-3">
            {isConsultant && (
              <button
                onClick={handleCreateBlog}
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Viết bài mới
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <BlogFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onClearFilters={handleClearFilters}
        />

        {/* Error message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800">{error}</p>
            <button
              onClick={fetchBlogs}
              className="mt-2 text-red-600 hover:text-red-800 font-medium"
            >
              Thử lại
            </button>
          </div>
        )}

        {/* Blog grid */}
        {blogs.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {blogs.map((blog) => (
              <BlogCard
                key={blog.blog_id}
                blog={blog}
                onClick={handleBlogClick}
              />
            ))}
          </div>
        ) : !loading && (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Không tìm thấy bài viết
            </h3>
            <p className="text-gray-600 mb-4">
              {filters.searchQuery || filters.specialization
                ? 'Thử thay đổi bộ lọc để tìm thấy nhiều bài viết hơn.'
                : 'Chưa có bài viết nào được đăng tải.'}
            </p>
            {(filters.searchQuery || filters.specialization) && (
              <button
                onClick={handleClearFilters}
                className="text-blue-600 hover:text-blue-800 font-medium"
              >
                Xóa bộ lọc
              </button>
            )}
          </div>
        )}

        {/* Stats */}
        {blogs.length > 0 && (
          <div className="mt-8 text-center text-gray-600">
            <p>Hiển thị {blogs.length} bài viết</p>
          </div>
        )}

        {/* Info for consultants */}
        {isConsultant && blogs.length === 0 && !filters.searchQuery && !filters.specialization && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Chào mừng bạn đến với nền tảng blog!
            </h3>
            <p className="text-blue-800 mb-4">
              Với tư cách là chuyên gia tư vấn, bạn có thể chia sẻ kiến thức và kinh nghiệm của mình 
              thông qua việc viết blog. Hãy bắt đầu tạo bài viết đầu tiên của bạn!
            </p>
            <button
              onClick={handleCreateBlog}
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Viết bài đầu tiên
            </button>
          </div>
        )}

        {/* Info for customers */}
        {user?.role === 'customer' && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-6 mt-6">
            <h3 className="text-lg font-medium text-green-900 mb-2">
              Tham gia thảo luận
            </h3>
            <p className="text-green-800">
              Bạn có thể bình luận và thảo luận với các chuyên gia về những chủ đề 
              sức khỏe sinh sản mà bạn quan tâm. Đừng ngần ngại đặt câu hỏi!
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogListPage; 