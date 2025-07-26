import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { apiClient } from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import  QuillEditor from '../../components/common/QuillEditor';
import { sanitizeText, sanitizeFormData, SanitizeOptions } from '../../utils/inputSanitizer';

interface BlogFormData {
  title: string;
  content: string;
}

interface ValidationErrors {
  title?: string;
  content?: string;
}

interface BlogData {
  blog_id: string;
  title: string;
  content: string;
  author_id: string;
}

const BlogFormPage: React.FC = () => {
  const navigate = useNavigate();
  const { blogId } = useParams<{ blogId: string }>();
  const isEdit = Boolean(blogId);

  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: ''
  });
  const [formErrors, setFormErrors] = useState<ValidationErrors>({});
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalBlog, setOriginalBlog] = useState<BlogData | null>(null);

  // Sanitization configurations
  const sanitizeConfigs: Record<keyof BlogFormData, SanitizeOptions> = {
    title: {
      allowHtml: false,
      maxLength: 200,
      trimWhitespace: true,
      removeEmptyLines: true
    },
    content: {
      allowHtml: true,
      trimWhitespace: true,
      allowedTags: ['p', 'br', 'strong', 'em', 'u', 'ol', 'ul', 'li', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote', 'pre', 'code']
    }
  };

  useEffect(() => {
    if (isEdit && blogId) {
      fetchBlogData();
    }
  }, [isEdit, blogId]);

  const fetchBlogData = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${API.Blog.BASE}/${blogId}`);
      
      if (response.data && (response.data as any).success) {
        const blog = (response.data as any).data.blog;
        setOriginalBlog(blog);
        
        // Sanitize loaded data
        const sanitizedBlog = sanitizeFormData(blog, sanitizeConfigs);
        setFormData({
          title: sanitizedBlog.title || '',
          content: sanitizedBlog.content || ''
        });
      } else {
        throw new Error('Không thể tải dữ liệu bài viết');
      }
    } catch (error: any) {
      console.error('Error fetching blog:', error);
      const errorMessage = error?.response?.data?.message || 'Không thể tải dữ liệu bài viết';
      toast.error(errorMessage);
      setError(errorMessage);
      navigate('/blogs');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<BlogFormData> = {};

    // Validate title
    const sanitizedTitle = sanitizeText(formData.title, sanitizeConfigs.title);
    if (!sanitizedTitle.trim()) {
      errors.title = 'Tiêu đề là bắt buộc';
    } else if (sanitizedTitle.length < 5) {
      errors.title = 'Tiêu đề phải có ít nhất 5 ký tự';
    } else if (sanitizedTitle.length > 200) {
      errors.title = 'Tiêu đề không được vượt quá 200 ký tự';
    }

    // Validate content
    const sanitizedContent = sanitizeText(formData.content, sanitizeConfigs.content);
    if (!sanitizedContent.trim()) {
      errors.content = 'Nội dung là bắt buộc';
    } else if (sanitizedContent.length < 50) {
      errors.content = 'Nội dung phải có ít nhất 50 ký tự';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof BlogFormData, value: string | string[]) => {
    // Sanitize input in real-time but don't be too aggressive to allow typing
    let sanitizedValue = '';
    
    if (typeof value === 'string') {
      if (field === 'title') {
        // For title, do basic sanitization while typing
        sanitizedValue = sanitizeText(value, { 
          allowHtml: false, 
          maxLength: 200, 
          trimWhitespace: false // Don't trim while typing
        });
      } else if (field === 'content') {
        // For content, allow HTML but sanitize dangerous elements
        sanitizedValue = sanitizeText(value, {
          allowHtml: true,
          trimWhitespace: false,
          allowedTags: sanitizeConfigs.content.allowedTags
        });
      } else {
        sanitizedValue = sanitizeText(value);
      }
    }

    setFormData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));

    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({
        ...prev,
        [field]: undefined
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Vui lòng kiểm tra và sửa các lỗi trong form');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      // Final sanitization before submission
      const sanitizedData = sanitizeFormData(formData, sanitizeConfigs);
      
      let response;
      if (isEdit) {
        // Update existing blog
        response = await apiClient.put(`${API.Blog.BASE}/${blogId}`, {
          title: sanitizedData.title,
          content: sanitizedData.content
        });
        
        if ((response.data as any)?.success) {
          toast.success('Cập nhật bài viết thành công!'); 
          navigate(`/blogs/${blogId}`);
        }
      } else {
        // Create new blog
        response = await apiClient.post(API.Blog.CREATE, {
          title: sanitizedData.title,
          content: sanitizedData.content
        });
        
        if ((response.data as any)?.success) {
          toast.success('Tạo bài viết thành công!');
          navigate(`/blogs/${(response.data as any).data.blog.blog_id}`);
        }
      }

      if (!((response.data as any)?.success)) {
        const errorMessage = (response.data as any)?.message || 'Có lỗi xảy ra';
        toast.error(errorMessage);
        setError(errorMessage);
      }
    } catch (error: any) {
      console.error('Error saving blog:', error);
      const errorMessage = error?.response?.data?.message || 
                          error?.response?.data?.details || 
                          'Có lỗi xảy ra khi lưu bài viết';
      toast.error(errorMessage);
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    if (isEdit && originalBlog) {
      navigate(`/blogs/${originalBlog.blog_id}`);
    } else {
      navigate('/blogs');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
            </h1>
            <p className="mt-1 text-sm text-gray-600">
              {isEdit ? 'Cập nhật nội dung bài viết của bạn' : 'Chia sẻ kiến thức và kinh nghiệm với cộng đồng'}
            </p>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title Input */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Tiêu đề bài viết <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  formErrors.title ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="Nhập tiêu đề bài viết..."
                maxLength={200}
                disabled={submitting}
              />
              {formErrors.title && (
                <p className="mt-1 text-sm text-red-600">{formErrors.title}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.title.length}/200 ký tự
              </p>
            </div>

            {/* Content Editor */}
            <div>
              <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
                Nội dung bài viết <span className="text-red-500">*</span>
              </label>
              <div className={`${formErrors.content ? 'border-red-500' : ''}`}>
                <QuillEditor
                  value={formData.content}
                  onChange={(value) => handleInputChange('content', value)}
                  placeholder="Nhập nội dung bài viết..."
                  height={400}
                  readOnly={submitting}
                />
              </div>
              {formErrors.content && (
                <p className="mt-1 text-sm text-red-600">{formErrors.content}</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {formData.content.length} ký tự
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex items-center justify-end space-x-4">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                disabled={submitting}
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Đang lưu...
                  </>
                ) : (
                  isEdit ? 'Cập nhật' : 'Đăng bài'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BlogFormPage; 