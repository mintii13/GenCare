import React, { useEffect, useState } from 'react';
import { blogService } from '../../../../services/blogService';
import { Blog } from '../../../../types/blog';
import { useAuth } from '../../../../contexts/AuthContext';
import { Link } from 'react-router-dom';
import { Plus, FileText, Edit, Eye, MessageCircle, Calendar } from 'lucide-react';

const ConsultantBlogList: React.FC = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<{ [blogId: string]: number }>({});

  useEffect(() => {
    const fetchBlogs = async () => {
      if (!user) {
        console.log('ConsultantBlogList: No user found');
        setLoading(false);
        return;
      }
      
      console.log('ConsultantBlogList: Fetching blogs for user:', user);
      setLoading(true);
      setError(null);
      
      try {
        // Lấy tất cả blogs trước, sau đó filter
        const res = await blogService.getBlogs();
        console.log('ConsultantBlogList: API response:', res);
        
        if (res.success && res.data.blogs) {
          // Filter blogs của user hiện tại
          const userBlogs = res.data.blogs.filter(blog => {
            console.log('Comparing blog.author_id:', blog.author_id, 'with user.id:', user.id);
            return blog.author_id === user.id;
          });
          
          console.log('ConsultantBlogList: Filtered user blogs:', userBlogs);
          setBlogs(userBlogs);
        } else {
          console.log('ConsultantBlogList: API returned no blogs or failed');
          setBlogs([]);
        }
      } catch (err: any) {
        console.error('ConsultantBlogList: Error fetching blogs:', err);
        setError(err.message || 'Không thể tải danh sách blog');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, [user]);

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
              <h1 className="text-2xl font-bold text-gray-800 mb-2">Quản lý Blog</h1>
              <p className="text-gray-600">Quản lý và theo dõi các bài viết blog của bạn</p>
            </div>
            <Link
              to="/blogs/create"
              className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Viết bài mới
            </Link>
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
                <p className="text-2xl font-bold text-gray-900">{blogs.length}</p>
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
                <p className="text-2xl font-bold text-gray-900">{blogs.filter(blog => blog.status).length}</p>
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
              Bắt đầu chia sẻ kiến thức của bạn bằng cách viết bài blog đầu tiên
            </p>
            <Link
              to="/blogs/create"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Plus className="w-5 h-5 mr-2" />
              Viết bài đầu tiên
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">Danh sách bài viết</h2>
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
                        {commentCounts[blog.blog_id] > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <MessageCircle className="w-3 h-3 mr-1" />
                            {commentCounts[blog.blog_id]}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center text-sm text-gray-500 mb-3">
                        <Calendar className="w-4 h-4 mr-1" />
                        <span>Ngày đăng: {new Date(blog.publish_date).toLocaleDateString('vi-VN')}</span>
                        <span className="mx-2">•</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          blog.status 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {blog.status ? 'Đã xuất bản' : 'Nháp'}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 line-clamp-2 mb-4">
                        {blog.content?.replace(/<[^>]*>/g, '').substring(0, 200)}...
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Link
                      to={`/blogs/${blog.blog_id}`}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Xem chi tiết
                    </Link>
                    <Link
                      to={`/blogs/${blog.blog_id}/edit`}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-yellow-600 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Chỉnh sửa
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConsultantBlogList;