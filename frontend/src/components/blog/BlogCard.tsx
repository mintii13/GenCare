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
      className="group bg-white rounded-2xl border border-slate-200/60 shadow-sm hover:shadow-xl hover:shadow-blue-500/10 transition-all duration-500 overflow-hidden cursor-pointer flex flex-col hover:border-blue-300/50 hover:-translate-y-1"
      onClick={() => onClick(blog.blog_id)}
    >
      <BlogCardHeader blog={blog} />
      <BlogCardContent blog={blog} />
    </article>
  );
};

export default BlogCard;