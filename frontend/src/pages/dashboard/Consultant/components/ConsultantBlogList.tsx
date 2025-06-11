import React, { useEffect, useState } from 'react';
import { blogService } from '../../../../services/blogService';
import { Blog } from '../../../../types/blog';
import { useAuth } from '../../../../contexts/AuthContext';

const ConsultantBlogList: React.FC = () => {
  const { user } = useAuth();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<{ [blogId: string]: number }>({});

  useEffect(() => {
    const fetchBlogs = async () => {
      if (!user) return;
      setLoading(true);
      setError(null);
      try {
        const res = await blogService.getBlogs({ authorId: user.id });
        setBlogs((res.data.blogs || []).filter(blog => blog.author_id === user.id));
      } catch (err) {
        setError('Không thể tải danh sách blog');
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, [user]);

  useEffect(() => {
    const fetchCommentCounts = async () => {
      if (!blogs.length) return;
      const counts: { [blogId: string]: number } = {};
      await Promise.all(
        blogs.map(async (blog) => {
          try {
            const res = await blogService.getBlogComments(blog.blog_id);
            counts[blog.blog_id] = res.data.comments.length;
          } catch {
            counts[blog.blog_id] = 0;
          }
        })
      );
      setCommentCounts(counts);
    };
    fetchCommentCounts();
  }, [blogs]);

  if (loading) return <div>Đang tải blog...</div>;
  if (error) return <div className="text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-xl font-bold mb-4">Blog của tôi</h2>
      {blogs.length === 0 ? (
        <div>Chưa có blog nào.</div>
      ) : (
        <ul className="space-y-4">
          {blogs.map((blog) => (
            <li key={blog.blog_id} className="p-4 border rounded-lg bg-white shadow">
              <div className="flex items-center">
                <div className="font-semibold text-lg">{blog.title}</div>
                {commentCounts[blog.blog_id] > 0 && (
                  <span className="ml-2 px-2 py-1 bg-red-500 text-white text-xs rounded">
                    {commentCounts[blog.blog_id]} bình luận
                  </span>
                )}
              </div>
              <div className="text-gray-500 text-sm mb-2">Ngày đăng: {new Date(blog.publish_date).toLocaleDateString()}</div>
              <div className="line-clamp-2 text-gray-700 mb-2">{blog.content}</div>
              <div className="flex gap-2">
                <a href={`/blogs/${blog.blog_id}`} className="text-blue-600 hover:underline">Xem chi tiết</a>
                <a href={`/blogs/${blog.blog_id}/edit`} className="text-yellow-600 hover:underline">Chỉnh sửa</a>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ConsultantBlogList; 