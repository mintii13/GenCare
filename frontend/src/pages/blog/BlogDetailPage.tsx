import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Blog, Comment } from '../../types/blog';
import { blogService } from '../../services/blogService';
import { useAuth } from '../../contexts/AuthContext';
import CommentSection from '../../components/blog/CommentSection';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { 
  ArrowLeft, 
  Calendar, 
  User, 
  Star, 
  Eye, 
  MessageCircle,
  Loader,
  AlertCircle,
  Edit,
  Trash2
} from 'lucide-react';

const BlogDetailPage: React.FC = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (blogId) {
      fetchBlogDetail();
      fetchComments();
    }
  }, [blogId]);

  const fetchBlogDetail = async () => {
    if (!blogId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await blogService.getBlogById(blogId);
      if (response.success && response.data.blogs.length > 0) {
        setBlog(response.data.blogs[0]);
      } else {
        setError('Không tìm thấy bài viết');
      }
    } catch (error) {
      console.error('Error fetching blog detail:', error);
      setError('Không thể tải bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    if (!blogId) return;

    try {
      const response = await blogService.getBlogComments(blogId);
      if (response.success) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: vi 
    });
  };

  const formatFullDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleBack = () => {
    navigate('/blogs');
  };

  const handleEdit = () => {
    if (blog) {
      navigate(`/blogs/${blog.blog_id}/edit`);
    }
  };

  const handleDelete = async () => {
    if (!blog) return;

    if (window.confirm('Bạn có chắc chắn muốn xóa bài viết này?')) {
      try {
        await blogService.deleteBlog(blog.blog_id);
        navigate('/blogs');
      } catch (error) {
        console.error('Error deleting blog:', error);
        alert('Có lỗi xảy ra khi xóa bài viết');
      }
    }
  };

  const isAuthor = user && blog && user.id === blog.author_id.toString();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang tải bài viết...</p>
        </div>
      </div>
    );
  }

  if (error || !blog) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không thể tải bài viết
          </h2>
          <p className="text-gray-600 mb-6">
            {error || 'Bài viết không tồn tại hoặc đã bị xóa.'}
          </p>
          <button
            onClick={handleBack}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <button
          onClick={handleBack}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Quay lại danh sách blog
        </button>

        {/* Blog content */}
        <article className="bg-white rounded-lg shadow-sm border border-gray-200">
          {/* Header */}
          <div className="px-8 py-6 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                blog.status === 'published' 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {blog.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
              </span>

              {/* Actions for author */}
              {isAuthor && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Sửa
                  </button>
                  <button
                    onClick={handleDelete}
                    className="flex items-center px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Xóa
                  </button>
                </div>
              )}
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
              {blog.title}
            </h1>

            {/* Author info */}
            <div className="flex items-center mb-4">
              <img
                src={blog.author.avatar}
                alt={blog.author.full_name}
                className="w-12 h-12 rounded-full object-cover mr-4"
              />
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{blog.author.full_name}</h3>
                <div className="flex items-center text-sm text-gray-600">
                  <User className="w-4 h-4 mr-1" />
                  <span>{blog.author.specialization}</span>
                  <Star className="w-4 h-4 ml-3 mr-1 text-yellow-500" />
                  <span>{blog.author.consultation_rating}/5</span>
                  <span className="ml-2">({blog.author.total_consultations} tư vấn)</span>
                </div>
              </div>
            </div>

            {/* Meta info */}
            <div className="flex items-center text-sm text-gray-600 space-x-6">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-1" />
                <span>Đăng {formatDate(blog.publish_date)}</span>
              </div>
              {blog.updated_date !== blog.publish_date && (
                <div className="flex items-center">
                  <Edit className="w-4 h-4 mr-1" />
                  <span>Cập nhật {formatDate(blog.updated_date)}</span>
                </div>
              )}
              <div className="flex items-center">
                <MessageCircle className="w-4 h-4 mr-1" />
                <span>{comments.length} bình luận</span>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-8 py-6">
            <div className="prose prose-lg max-w-none">
              <div 
                className="text-gray-800 leading-relaxed"
                style={{ whiteSpace: 'pre-wrap' }}
              >
                {blog.content}
              </div>
            </div>
          </div>

          {/* Author bio */}
          <div className="px-8 py-6 bg-gray-50 border-t border-gray-200">
            <h4 className="font-semibold text-gray-900 mb-3">Về tác giả</h4>
            <div className="flex items-start">
              <img
                src={blog.author.avatar}
                alt={blog.author.full_name}
                className="w-16 h-16 rounded-full object-cover mr-4"
              />
              <div>
                <h5 className="font-medium text-gray-900">{blog.author.full_name}</h5>
                <p className="text-gray-600 mb-2">{blog.author.qualifications}</p>
                <p className="text-sm text-gray-600">
                  Chuyên khoa: {blog.author.specialization} • 
                  Kinh nghiệm: {blog.author.experience_years} năm • 
                  Đánh giá: {blog.author.consultation_rating}/5 sao
                </p>
              </div>
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <div className="mt-8">
          <CommentSection
            blogId={blog.blog_id}
            comments={comments}
            onCommentsUpdate={fetchComments}
          />
        </div>
      </div>
    </div>
  );
};

export default BlogDetailPage; 