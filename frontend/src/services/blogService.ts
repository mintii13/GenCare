import api from './api';
import { BlogsResponse, CommentsResponse, BlogFilters, Comment } from '../types/blog';

export interface Blog {
  _id: string;
  title: string;
  content: string;
  authorId: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export const blogService = {
  // Lấy danh sách blog với filter
  getBlogs: async (filters?: BlogFilters): Promise<BlogsResponse> => {
    try {
      const params = new URLSearchParams();
      if (filters?.searchQuery) params.append('search', filters.searchQuery);
      if (filters?.authorId) params.append('author_id', filters.authorId.toString());
      if (filters?.specialization) params.append('specialization', filters.specialization);
      if (filters?.sortBy) params.append('sort_by', filters.sortBy);
      if (filters?.sortOrder) params.append('sort_order', filters.sortOrder);
      const response = await api.get(`/blogs?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy chi tiết blog theo ID
  getBlogById: async (blogId: string): Promise<BlogsResponse> => {
    try {
      const response = await api.get(`/blogs/${blogId}`);
      if (response.data.success && response.data.data.blog) {
        return {
          ...response.data,
          data: { blogs: [response.data.data.blog] }
        };
      }
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách comment của blog
  getBlogComments: async (blogId: string): Promise<CommentsResponse> => {
    try {
      const response = await api.get(`/blogs/${blogId}/comments`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Đăng comment mới (chỉ customer)
  createComment: async (blogId: string, content: string, isAnonymous: boolean = false, parentCommentId?: string) => {
    try {
      const response = await api.post(`/blogs/${blogId}/comments`, {
        content,
        is_anonymous: isAnonymous,
        parent_comment_id: parentCommentId
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Tạo blog mới (chỉ consultant)
  createBlog: async (title: string, content: string) => {
    try {
      const response = await api.post('/blogs', {
        title,
        content
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Cập nhật blog (chỉ consultant và chỉ blog của mình)
  updateBlog: async (blogId: string, title: string, content: string) => {
    try {
      const response = await api.put(`/blogs/${blogId}`, {
        title,
        content
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Xóa blog (chỉ consultant và chỉ blog của mình)
  deleteBlog: async (blogId: string) => {
    try {
      const response = await api.delete(`/blogs/${blogId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách chuyên khoa để filter
  getSpecializations: async () => {
    // Không còn dùng mock, trả về mảng rỗng hoặc có thể xóa hàm này nếu không dùng nữa
    return { success: true, data: { specializations: [] } };
  },

  // Sửa bình luận
  updateComment: async (blogId: string, commentId: string, content: string, isAnonymous?: boolean) => {
    try {
      const response = await api.put(`/blogs/${blogId}/comments/${commentId}`, {
        content,
        ...(typeof isAnonymous !== 'undefined' ? { is_anonymous: isAnonymous } : {})
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Xóa bình luận
  deleteComment: async (blogId: string, commentId: string) => {
    try {
      const response = await api.delete(`/blogs/${blogId}/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  async getAllBlogs(): Promise<Blog[]> {
    try {
      const response = await api.get('/blogs');
      return response.data.data.blogs || [];
    } catch (error) {
      throw error;
    }
  },

  async getBlogsByAuthor(authorId: string): Promise<Blog[]> {
    try {
      const response = await api.get(`/blogs/author/${authorId}`);
      return response.data.data.blogs || [];
    } catch (error) {
      throw error;
    }
  },

  async searchBlogs(query: string): Promise<Blog[]> {
    try {
      const response = await api.get(`/blogs/search?q=${encodeURIComponent(query)}`);
      return response.data.data.blogs || [];
    } catch (error) {
      throw error;
    }
  },

  async getBlogsByTag(tag: string): Promise<Blog[]> {
    try {
      const response = await api.get(`/blogs/tag/${encodeURIComponent(tag)}`);
      return response.data.data.blogs || [];
    } catch (error) {
      throw error;
    }
  },

  async likeBlog(id: string): Promise<void> {
    try {
      await api.post(`/blogs/${id}/like`);
    } catch (error) {
      throw error;
    }
  }
};