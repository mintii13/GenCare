import React from 'react';
import { Blog } from '../../types/blog';
import { BookOpen } from 'lucide-react';
import { extractFirstImageFromContent } from '../../utils/blogUtils';

interface BlogCardHeaderProps {
  blog: Blog;
}

const BlogCardHeader: React.FC<BlogCardHeaderProps> = ({ blog }) => {
  const blogThumbnail = extractFirstImageFromContent(blog.content);

  return (
    <div className="relative overflow-hidden flex-shrink-0">
      <div className="w-full h-48 bg-gradient-to-br from-blue-50 to-emerald-50 flex items-center justify-center">
        {blogThumbnail ? (
          <img
            src={blogThumbnail}
            alt={blog.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              // Fallback if image fails to load
              e.currentTarget.style.display = 'none';
              e.currentTarget.parentElement!.innerHTML = `
                <div class="text-center text-slate-400">
                  <svg class="w-16 h-16 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                  </svg>
                  <p class="text-sm">Hình ảnh blog</p>
                </div>
              `;
            }}
          />
        ) : (
          <div className="text-center text-slate-400">
            <BookOpen className="w-16 h-16 mx-auto mb-2" />
            <p className="text-sm">Hình ảnh blog</p>
          </div>
        )}
      </div>
      
      {/* Specialization badge */}
      <div className="absolute top-4 left-4">
        <span className="bg-white/90 text-slate-700 px-3 py-1 rounded-full text-xs font-medium backdrop-blur-sm">
          {blog.author?.specialization || 'Tư vấn sức khỏe'}
        </span>
      </div>

      {/* Status badge */}
      <div className="absolute top-4 right-4">
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
          blog.status === true 
            ? 'bg-green-100/90 text-green-800 backdrop-blur-sm' 
            : 'bg-yellow-100/90 text-yellow-800 backdrop-blur-sm'
        }`}>
          {blog.status === true ? 'Xuất bản' : 'Nháp'}
        </span>
      </div>
    </div>
  );
};

export default BlogCardHeader; 