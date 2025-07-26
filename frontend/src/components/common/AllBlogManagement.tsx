import React, { useEffect, useState } from 'react';
import { blogService } from '../../services/blogService';
import { Blog } from '../../types/blog';
import { useAuth } from '../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, FileText, Edit, Eye, MessageCircle, Calendar, ChevronLeft, ChevronRight, User } from 'lucide-react';

const AllBlogManagement: React.FC = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<{ [blogId: string]: number }>({});
  const [stats, setStats] = useState<{ published: number; draft: number; total: number }>({
    published: 0,
    draft: 0,
    total: 0
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  useEffect(() => {
    const fetchBlogs = async () => {
      if (!user) {

        setLoading(false);
        return;
      }
      

      setLoading(true);
      setError(null);
      
      try {
        // Sử dụng API với pagination nhưng KHÔNG filter theo author_id để lấy tất cả blog
        const res = await blogService.getBlogs({
          page: currentPage,
          limit: 10,
          // Bỏ author_id để lấy tất cả blog
          sort_by: 'publish_date',
          sort_order: 'desc'
        });
        

        
        if (res.success && res.data.blogs) {
          setBlogs(res.data.blogs);
          setCurrentPage(res.data.pagination.current_page);
          setTotalPages(res.data.pagination.total_pages);
          setTotalItems(res.data.pagination.total_items);
        } else {

          setBlogs([]);
        }

        // Lấy thống kê tất cả blog (không filter theo author)
        try {
          const statsRes = await blogService.getAllBlogStats();
          if (statsRes.success) {
            setStats(statsRes.data);
          }
        } catch (statsError) {

          // Fallback: tính stats từ dữ liệu hiện có
          const published = res.data.blogs?.filter((blog: Blog) => blog.status).length || 0;
          const total = res.data.blogs?.length || 0;
          setStats({ published, draft: total - published, total });
        }
        
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách blog');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, [user, currentPage]);

  useEffect(() => {
    const fetchCommentCounts = async () => {
      if (!blogs.length) return;
      const counts: { [blogId: string]: number } = {};
      await Promise.all(
        blogs.map(async (blog) => {
          try {
            const res = await blogService.getBlogComments(blog.blog_id);
            counts[blog.blog_id] = res.data.comments.length;
          } catch {
            counts[blog.blog_id] = 0;
          }
        })
      );
      setCommentCounts(counts);
    };
    fetchCommentCounts();
  }, [blogs]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const generatePageNumbers = () => {
    const pages = [];
    
    // Always show first page
    if (totalPages > 1) pages.push(1);
    
    // Add pages around current page
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    
    // Always show last page
    if (totalPages > 1 && !pages.includes(totalPages)) {
      pages.push(totalPages);
    }
    
    return pages;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Đang tải danh sách blog...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-red-400 mr-3">
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-medium text-red-800">Có lỗi xảy ra</h3>
                <p className="text-red-700">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý Tất cả Blog</h1>
              <p className="text-gray-600">Quản lý và theo dõi tất cả bài viết blog trong hệ thống</p>
              <p className="text-sm text-gray-500 mt-1">
                {totalItems} bài viết • Trang {currentPage} / {totalPages}
              </p>
            </div>
            {user?.role === 'admin' && (
              <Link
                to="/blogs/create"
                className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Viết bài mới
              </Link>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng bài viết</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-100 rounded-lg">
                <Eye className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Đã xuất bản</p>
                <p className="text-2xl font-bold text-gray-900">{stats.published}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="p-3 bg-orange-100 rounded-lg">
                <MessageCircle className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Tổng bình luận</p>
                <p className="text-2xl font-bold text-gray-900">
                  {Object.values(commentCounts).reduce((sum, count) => sum + count, 0)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Blog List */}
        {blogs.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">Chưa có bài viết nào</h3>
            <p className="text-gray-600 mb-6">
              Hệ thống chưa có bài blog nào được tạo
            </p>
            {user?.role === 'admin' && (
              <Link
                to="/blogs/create"
                className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                Viết bài đầu tiên
              </Link>
            )}
          </div>
        ) : (
          <>
            <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Danh sách tất cả bài viết</h2>
              </div>
              
              <div className="divide-y divide-gray-200">
                {blogs.map((blog) => (
                  <div key={blog.blog_id} className="p-6 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600">
                            <Link to={`/blogs/${blog.blog_id}`}>
                              {blog.title}
                            </Link>
                          </h3>
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            blog.status 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {blog.status ? 'Đã xuất bản' : 'Nháp'}
                          </span>
                        </div>
                        
                        <div className="flex items-center text-sm text-gray-600 gap-4 mb-3">
                          <div className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {blog.author_id || 'Không rõ tác giả'}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            {
                              blog.publish_date ? 
                                (() => {
                                  try {
                                    return new Date(blog.publish_date).toLocaleDateString('vi-VN');
                                  } catch {
                                    return 'Không xác định';
                                  }
                                })() : 'Không xác định'
                            }
                          </div>
                          <div className="flex items-center">
                            <MessageCircle className="w-4 h-4 mr-1" />
                            {commentCounts[blog.blog_id] || 0} bình luận
                          </div>
                        </div>
                        
                        <div 
                          className="text-gray-600 text-sm line-clamp-2"
                          dangerouslySetInnerHTML={{ 
                            __html: blog.content.substring(0, 200) + (blog.content.length > 200 ? '...' : '') 
                          }}
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 ml-4">
                        <Link
                          to={`/blogs/${blog.blog_id}`}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Xem chi tiết"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {user?.role === 'admin' && (
                          <Link
                            to={`/blogs/${blog.blog_id}/edit`}
                            className="p-2 text-gray-400 hover:text-green-600 transition-colors"
                            title="Chỉnh sửa"
                          >
                            <Edit className="w-4 h-4" />
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1}
                  className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                      className={`px-3 py-2 rounded-lg ${
                        page === currentPage
                          ? 'bg-blue-600 text-white'
                          : 'text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      {page}
                    </button>
                  </React.Fragment>
                ))}

                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages}
                  className="flex items-center px-3 py-2 text-gray-500 hover:text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Sau
                  <ChevronRight className="w-4 h-4 ml-1" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AllBlogManagement; 