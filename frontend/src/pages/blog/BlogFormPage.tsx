import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { blogService } from '../../services/blogService';
import { Blog } from '../../types/blog';
import { 
  ArrowLeft, 
  Save, 
  Eye, 
  AlertCircle,
  Loader,
  FileText
} from 'lucide-react';
import QuillEditor from '../../components/common/QuillEditor';
import toast from 'react-hot-toast';

const BlogFormPage: React.FC = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalBlog, setOriginalBlog] = useState<Blog | null>(null);

  const isEdit = !!blogId;
  const isConsultant = user?.role === 'consultant';

  useEffect(() => {
    // Kiểm tra quyền truy cập
    if (!isConsultant) {
      navigate('/blogs');
      return;
    }

    // Nếu là chỉnh sửa, load dữ liệu blog
    if (isEdit) {
      fetchBlogData();
    }
  }, [blogId, isConsultant]);

  const fetchBlogData = async () => {
    if (!blogId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await blogService.getBlogById(blogId);
      if (response.success && response.data.blogs.length > 0) {
        const blog = response.data.blogs[0];
        
        // Kiểm tra quyền chỉnh sửa (chỉ tác giả)
        if (blog.author_id.toString() !== user?.id) {
          setError('Bạn không có quyền chỉnh sửa bài viết này');
          return;
        }

        setOriginalBlog(blog);
        setTitle(blog.title);
        
        // Kiểm tra và xử lý nội dung
        if (blog.content) {
          console.log('Setting valid content:', blog.content);
          setContent(blog.content);
        } else {
          console.warn('Invalid content, using default state');
          setContent('');
        }
      } else {
        setError('Không tìm thấy bài viết');
      }
    } catch (error) {
      console.error('Error fetching blog:', error);
      setError('Không thể tải dữ liệu bài viết');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Vui lòng nhập tiêu đề');
      return;
    }

    setSaving(true);
    setError(null);

    try {
      let response;
      if (isEdit) {
        response = await blogService.updateBlog(blogId!, title, content);
        if (response.success) {
          toast.success('Cập nhật bài viết thành công!', {
            duration: 3000,
            icon: '✅',
            style: {
              background: '#363636',
              color: '#fff',
            },
          });
          navigate(`/blogs/${blogId}`);
        }
      } else {
        response = await blogService.createBlog(title, content);
        if (response.success) {
          toast.success('Tạo bài viết thành công!', {
            duration: 3000,
            icon: '✅',
            style: {
              background: '#363636',
              color: '#fff',
            },
          });
          navigate(`/blogs/${response.data.blog.blog_id}`);
        }
      }

      if (!response.success) {
        toast.error(response.message || 'Có lỗi xảy ra', {
          duration: 4000,
          icon: '❌',
          style: {
            background: '#363636',
            color: '#fff',
          },
        });
        setError(response.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      toast.error('Có lỗi xảy ra khi lưu bài viết', {
        duration: 4000,
        icon: '❌',
        style: {
          background: '#363636',
          color: '#fff',
        },
      });
      setError('Có lỗi xảy ra khi lưu bài viết');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    if (isEdit && originalBlog) {
      navigate(`/blogs/${originalBlog.blog_id}`);
    } else {
      navigate('/blogs');
    }
  };

  const handlePreview = () => {
    // Có thể mở modal preview hoặc tab mới
    alert('Tính năng xem trước đang được phát triển');
  };

  // Redirect nếu không phải consultant
  if (!isConsultant) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Truy cập bị từ chối
          </h2>
          <p className="text-gray-600 mb-6">
            Chỉ có chuyên gia tư vấn mới có thể tạo và chỉnh sửa bài viết blog.
          </p>
          <button
            onClick={() => navigate('/blogs')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách blog
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error && isEdit) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Không thể tải bài viết
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/blogs')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors mx-auto"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Quay lại danh sách blog
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
          onClick={handleCancel}
          className="flex items-center text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isEdit ? 'Quay lại bài viết' : 'Quay lại danh sách blog'}
        </button>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              {isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </h1>
            <p className="text-gray-600">
              {isEdit 
                ? 'Cập nhật nội dung bài viết của bạn'
                : 'Chia sẻ kiến thức chuyên môn với cộng đồng'
              }
            </p>
          </div>
          <FileText className="w-12 h-12 text-blue-600" />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
                  <p className="text-red-800">{error}</p>
                </div>
              </div>
            )}

            {/* Title */}
            <div className="mb-6">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Tiêu đề bài viết *
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Nhập tiêu đề bài viết..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
                required
                maxLength={200}
              />
              <p className="mt-1 text-sm text-gray-500">
                {title.length}/200 ký tự
              </p>
            </div>

            {/* Content */}
            <div className="mb-6">
              <label className="block font-medium text-gray-700 mb-2">Nội dung bài viết</label>
              <QuillEditor
                value={content}
                onChange={setContent}
                placeholder="Nhập nội dung bài viết..."
              />
            </div>

            {/* Writing tips */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-medium text-blue-900 mb-2">Gợi ý viết bài:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Sử dụng ngôn ngữ dễ hiểu, tránh thuật ngữ y khoa phức tạp</li>
                <li>• Cung cấp thông tin chính xác và có căn cứ khoa học</li>
                <li>• Chia nhỏ nội dung thành các đoạn để dễ đọc</li>
                <li>• Thêm ví dụ thực tế để minh họa</li>
                <li>• Kết thúc bằng lời khuyên hoặc kêu gọi hành động</li>
              </ul>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePreview}
                className="flex items-center px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Eye className="w-4 h-4 mr-2" />
                Xem trước
              </button>

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={saving || !title.trim() || !content.trim()}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? (
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4 mr-2" />
                  )}
                  {saving 
                    ? 'Đang lưu...' 
                    : isEdit 
                      ? 'Cập nhật bài viết' 
                      : 'Đăng bài viết'
                  }
                </button>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogFormPage; 