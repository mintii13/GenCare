import React from 'react';
import { Blog } from '../../types/blog';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import { Calendar, Clock, Eye, ArrowRight, Star } from 'lucide-react';
import { createExcerpt, estimateReadingTime } from '../../utils/blogUtils';

interface BlogCardContentProps {
  blog: Blog;
}

const BlogCardContent: React.FC<BlogCardContentProps> = ({ blog }) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) {
      return 'Không xác định';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Ngày không hợp lệ';
      }
      
      return date.toLocaleDateString("vi-VN", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    } catch (error) {
      console.error('Error formatting date in BlogCardContent:', error);
      return 'Lỗi định dạng ngày';
    }
  };

  return (
    <div className="p-6 flex flex-col flex-1">
      {/* Title section - Fixed height */}
      <div className="h-[3.5rem] mb-3">
        <h3 className="text-xl font-bold text-slate-900 group-hover:text-emerald-600 transition-colors line-clamp-2 leading-tight h-full">
          {blog.title}
        </h3>
      </div>

      {/* Excerpt section - Fixed height */}
      <div className="h-[6rem] mb-6">
        <p className="text-slate-600 line-clamp-4 leading-relaxed h-full">
          {createExcerpt(blog.content, 180)}
        </p>
      </div>

      {/* Spacer to push footer down */}
      <div className="flex-1"></div>

      {/* Bottom section - Fixed height */}
      <div className="h-[6.5rem] flex flex-col justify-end space-y-3">
        {/* Meta information - Fixed height */}
        <div className="h-[1.25rem] flex items-center gap-4 text-xs text-slate-500 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            <span className="truncate">{formatDate(blog.publish_date)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            <span>{estimateReadingTime(blog.content)}</span>
          </div>
          <div className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            <span>0 lượt xem</span>
          </div>
        </div>

        {/* Author section - Fixed height */}
        <div className="h-[4rem] flex items-center justify-between">
                      <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center flex-shrink-0">
              {blog.author?.avatar ? (
                <img
                  src={blog.author.avatar}
                  alt={blog.author.full_name || 'Tác giả'}
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                <span className="text-white text-sm font-medium">
                  {(blog.author?.full_name || 'A').charAt(0).toUpperCase()}
                </span>
              )}
            </div>
            <div className="text-sm min-w-0 flex-1">
              <p className="font-medium text-slate-900 truncate leading-tight mb-1">
                {blog.author?.full_name || 'Không rõ tác giả'}
              </p>
              <p className="text-xs text-slate-500 truncate mb-1">
                {blog.author?.specialization || 'Chuyên gia tư vấn'}
              </p>
              {blog.author?.consultation_rating && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-3 h-3 fill-current" />
                  <span className="text-xs text-slate-600">
                    {blog.author.consultation_rating}/5 ({blog.author.total_consultations || 0} lượt tư vấn)
                  </span>
                </div>
              )}
            </div>
          </div>

          <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all flex-shrink-0" />
        </div>
      </div>
    </div>
  );
};

export default BlogCardContent;