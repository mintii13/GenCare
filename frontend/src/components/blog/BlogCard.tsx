import React from 'react';
import { Blog } from '../../types/blog';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { User, Calendar, BookOpen, Star } from 'lucide-react';

interface BlogCardProps {
  blog: Blog;
  onClick: (blogId: number) => void;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog, onClick }) => {
  const formatDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { 
      addSuffix: true, 
      locale: vi 
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    return content.length > maxLength ? content.substring(0, maxLength) + '...' : content;
  };

  return (
    <div 
      className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 cursor-pointer border border-gray-200"
      onClick={() => onClick(blog.blog_id)}
    >
      <div className="p-6">
        {/* Header với thông tin tác giả */}
        <div className="flex items-center mb-4">
          <img
            src={blog.author.avatar}
            alt={blog.author.full_name}
            className="w-12 h-12 rounded-full object-cover mr-4"
          />
          <div className="flex-1">
            <h4 className="font-semibold text-gray-900">{blog.author.full_name}</h4>
            <div className="flex items-center text-sm text-gray-600">
              <User className="w-4 h-4 mr-1" />
              <span>{blog.author.specialization}</span>
              <Star className="w-4 h-4 ml-3 mr-1 text-yellow-500" />
              <span>{blog.author.consultation_rating}/5</span>
            </div>
          </div>
        </div>

        {/* Tiêu đề blog */}
        <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
          {blog.title}
        </h3>

        {/* Nội dung tóm tắt */}
        <p className="text-gray-700 mb-4 line-clamp-3">
          {truncateContent(blog.content)}
        </p>

        {/* Footer với ngày đăng và trạng thái */}
        <div className="flex items-center justify-between">
          <div className="flex items-center text-sm text-gray-500">
            <Calendar className="w-4 h-4 mr-1" />
            <span>Đăng {formatDate(blog.publish_date)}</span>
          </div>
          
          <div className="flex items-center">
            <BookOpen className="w-4 h-4 mr-1 text-blue-600" />
            <span className="text-blue-600 font-medium text-sm">Đọc thêm</span>
          </div>
        </div>

        {/* Badge trạng thái */}
        <div className="mt-3">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            blog.status === 'published' 
              ? 'bg-green-100 text-green-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {blog.status === 'published' ? 'Đã xuất bản' : 'Bản nháp'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BlogCard; 