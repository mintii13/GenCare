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
  FileText,
  X,
  Calendar,
  Clock
} from 'lucide-react';
import QuillEditor from '../../components/common/QuillEditor';
import { Button } from '../../components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/card';
import { Label } from '../../components/ui/label';
import apiClient from '../../services/apiClient';
import { API } from '../../config/apiEndpoints';
import { toast } from 'react-hot-toast';

interface BlogFormData {
  title: string;
  content: string;
}

const BlogFormPage: React.FC = () => {
  const { blogId } = useParams<{ blogId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [originalBlog, setOriginalBlog] = useState<Blog | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  // Form state
  const [formData, setFormData] = useState<BlogFormData>({
    title: '',
    content: ''
  });

  // Form errors
  const [formErrors, setFormErrors] = useState<Partial<BlogFormData>>({});

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
  }, [blogId, isConsultant, navigate]);

  const fetchBlogData = async () => {
    if (!blogId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await blogService.getBlogById(blogId);
      if ((response as any).success && (response as any).data.blog) {
        const blog = (response as any).data.blog;
        
        // Kiểm tra quyền chỉnh sửa (chỉ tác giả)
        if (blog.author_id.toString() !== user?.id) {
          setError('Bạn không có quyền chỉnh sửa bài viết này');
          return;
        }

        setOriginalBlog(blog);
        
        // Set form data
        setFormData({
          title: blog.title || '',
          content: blog.content || ''
        });
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

  const validateForm = (): boolean => {
    const errors: Partial<BlogFormData> = {};

    if (!formData.title.trim()) {
      errors.title = 'Tiêu đề là bắt buộc';
    } else if (formData.title.length > 200) {
      errors.title = 'Tiêu đề không được vượt quá 200 ký tự';
    }

    if (!formData.content.trim()) {
      errors.content = 'Nội dung là bắt buộc';
    }



    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (field: keyof BlogFormData, value: string | string[]) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
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
      let response;
      if (isEdit) {
        // Update existing blog
        response = await apiClient.put(`${API.Blog.BASE}/${blogId}`, {
          title: formData.title,
          content: formData.content
        });
        
        if ((response.data as any)?.success) {
          toast.success('Cập nhật bài viết thành công!'); 
          navigate(`/blogs/${blogId}`);
        }
      } else {
        // Create new blog
        response = await apiClient.post(API.Blog.CREATE, {
          title: formData.title,
          content: formData.content
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

  const handlePreview = () => {
    if (!formData.title.trim() || !formData.content.trim()) {
      toast.error('Vui lòng nhập tiêu đề và nội dung trước khi xem trước');
      return;
    }
    setShowPreview(true);
  };

  const estimateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const textContent = content.replace(/<[^>]*>/g, '');
    const wordCount = textContent.split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);
    return `${minutes} phút đọc`;
  };

  // Preview Modal Component
  const PreviewModal: React.FC = () => {
    if (!showPreview) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Modal Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-bold text-gray-900">Xem trước bài viết</h2>
            <button
              onClick={() => setShowPreview(false)}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
            <div className="p-8">
              {/* Blog Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">{formData.title}</h1>
                
                {/* Meta information */}
                <div className="flex items-center gap-6 text-sm text-gray-600 mb-6">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{new Date().toLocaleDateString('vi-VN')}</span>
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-2" />
                    <span>{estimateReadingTime(formData.content || '')}</span>
                  </div>
                  <div className="flex items-center">
                    <FileText className="w-4 h-4 mr-2" />
                    <span>Tác giả: {user?.full_name}</span>
                  </div>
                </div>
              </div>

              {/* Blog Content */}
              <div 
                className="prose prose-lg max-w-none prose-gray"
                dangerouslySetInnerHTML={{ __html: formData.content || '' }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Có lỗi xảy ra</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button 
              onClick={() => navigate('/blogs')}
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại danh sách
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-12 py-6 lg:py-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex items-center"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Quay lại
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {isEdit ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}
              </h1>
              <p className="text-gray-600">
                {isEdit ? 'Cập nhật nội dung bài viết' : 'Viết và chia sẻ kiến thức của bạn'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={handlePreview}
              disabled={!formData.title.trim() || !formData.content.trim()}
            >
              <Eye className="w-4 h-4 mr-2" />
              Xem trước
            </Button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="max-w-4xl mx-auto">
            {/* Main Content */}
            <div className="space-y-6">
              <Card className="border-2 border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle>Nội dung bài viết</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Tiêu đề <span className="text-red-500">*</span>
                    </Label>
                    <input
                      type="text"
                      value={formData.title}
                      onChange={(e) => handleInputChange('title', e.target.value)}
                      placeholder="Tiêu đề bài viết..."
                      className={`w-full text-lg font-medium px-3 py-2 border-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        formErrors.title ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {formErrors.title && (
                      <p className="text-sm text-red-600">{formErrors.title}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Nội dung <span className="text-red-500">*</span>
                    </Label>
                    <QuillEditor
                      value={formData.content}
                      onChange={(value) => handleInputChange('content', value)}
                      placeholder="Viết nội dung bài viết của bạn..."
                    />
                    {formErrors.content && (
                      <p className="text-sm text-red-600">{formErrors.content}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
              
              {/* Action Buttons */}
              <Card className="border-2 border-gray-200 shadow-sm">
                <CardContent className="p-6">
                  <div className="flex justify-end space-x-3">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancel}
                      disabled={submitting}
                    >
                      Hủy
                    </Button>
                    <Button
                      type="submit"
                      disabled={submitting}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {submitting 
                        ? (isEdit ? 'Đang cập nhật...' : 'Đang tạo...') 
                        : (isEdit ? 'Cập nhật bài viết' : 'Tạo bài viết')
                      }
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </form>
      </div>

      {/* Preview Modal */}
      <PreviewModal />
    </div>
  );
};

export default BlogFormPage; 