import React from 'react';
import { Blog } from '../../types/blog';
import BlogCardHeader from './BlogCardHeader';
import BlogCardContent from './BlogCardContent';

interface BlogCardProps {
  blog: Blog;
  onClick: (blogId: string) => void;
}

const BlogCard: React.FC<BlogCardProps> = ({ blog, onClick }) => {
  return (
    <article 
      className="group bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden cursor-pointer h-[520px] flex flex-col"
      onClick={() => onClick(blog.blog_id)}
    >
      <BlogCardHeader blog={blog} />
      <BlogCardContent blog={blog} />
    </article>
  );
};

export default BlogCard; 