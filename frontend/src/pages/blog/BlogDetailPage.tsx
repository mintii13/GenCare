import React, { useState, useEffect, useCallback } from 'react';
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
  Trash2,
  X
} from 'lucide-react';
import { useToast } from '../../components/ui/ToastProvider';
import QuillEditor from '../../components/common/QuillEditor';

const BlogDetailPage: React.FC = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { success, error: showError } = useToast();
  
  const [blog, setBlog] = useState<Blog | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchBlogDetail = useCallback(async () => {
    if (!blogId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await blogService.getBlogById(blogId);
      if (response.success && response.data.blogs.length > 0) {
        const blogData = response.data.blogs[0];
        setBlog(blogData);
        setEditTitle(blogData.title);
        setEditContent(blogData.content);
      } else {
        setError('Không tìm thấy bài viết');
      }
    } catch (error) {
      console.error('Error fetching blog detail:', error);
      setError('Không thể tải bài viết. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  }, [blogId]);

  const fetchComments = useCallback(async () => {
    if (!blogId) return;

    try {
      const response = await blogService.getBlogComments(blogId);
      if (response.success) {
        setComments(response.data.comments);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
      showError('Không thể tải bình luận');
    }
  }, [blogId]);

  useEffect(() => {
    if (blogId) {
      fetchBlogDetail();
      fetchComments();
    }
  }, [blogId, fetchBlogDetail, fetchComments]);

  const handleCommentsUpdate = useCallback(async () => {
    await fetchComments();
  }, [fetchComments]);

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
      setIsEditing(true);
      setEditTitle(blog.title);
      setEditContent(blog.content);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    if (!blog) return;
    try {
      const updated = await blogService.updateBlog(blog.blog_id, editTitle, editContent);
      if (updated.success) {
        setBlog({ ...blog, title: editTitle, content: editContent });
        setIsEditing(false);
      } else {
        alert(updated.message || 'Cập nhật thất bại');
      }
    } catch (error) {
      alert('Có lỗi khi cập nhật blog');
    }
  };

  const handleDelete = async () => {
    if (!blog) return;
    try {
      const response = await blogService.deleteBlog(blog.blog_id);
      if (response.success) {
        success('Xóa bài viết thành công!', 3000);
        navigate('/blogs');
      } else {
        showError(response.message || 'Có lỗi xảy ra khi xóa bài viết', 4000);
      }
    } catch (error) {
      console.error('Error deleting blog:', error);
      showError('Có lỗi xảy ra khi xóa bài viết', 4000);
    } finally {
      setShowDeleteConfirm(false);
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
                blog.status === true
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-yellow-100 text-yellow-800'
              }`}>
                {blog.status === true ? 'Đã xuất bản' : 'Bản nháp'}
              </span>

              {/* Actions for author */}
              {isAuthor && !isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleEdit}
                    className="flex items-center px-3 py-1 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
                  >
                    <Edit className="w-4 h-4 mr-1" />
                    Sửa
                  </button>
                  <button
                    onClick={() => setShowDeleteConfirm(true)}
                    className="flex items-center px-3 py-1 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50 transition-colors"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Xóa
                  </button>
                </div>
              )}
              {isAuthor && isEditing && (
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveEdit}
                    className="flex items-center px-3 py-1 text-sm text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition-colors"
                  >
                    Lưu
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center px-3 py-1 text-sm text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Hủy
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <>
                <input
                  className="w-full mb-4 px-3 py-2 border rounded-lg text-xl font-bold"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                />
                <QuillEditor
                  value={editContent}
                  onChange={setEditContent}
                  readOnly={false}
                />
              </>
            ) : (
              <>
                <h1 className="text-3xl font-bold text-gray-900 mb-4 leading-tight">
                  {blog.title}
                </h1>
                <div className="prose max-w-none mb-4">
                  <div
                    className="text-gray-800 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: blog.content }}
                  />
                </div>
              </>
            )}

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
            blogId={blog?.blog_id || ''}
            comments={comments}
            onCommentsUpdate={handleCommentsUpdate}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && blog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Xác nhận xóa</h3>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn xóa bài viết "{blog.title}"? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Hủy
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md"
              >
                Xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BlogDetailPage; 