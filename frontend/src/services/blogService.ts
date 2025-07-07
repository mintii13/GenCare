import api from './api';
import { API } from '../config/apiEndpoints';
import { 
  BlogsPaginatedResponse, 
  BlogResponse, 
  CommentsResponse, 
  BlogFilters, 
  BlogQuery,
  BlogStatsResponse,
  Comment 
} from '../types/blog';

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
  // Lấy danh sách blog với pagination mới
  getBlogs: async (query?: BlogQuery): Promise<BlogsPaginatedResponse> => {
    try {
      console.log('🚀 BlogService.getBlogs called with:', query);
      
      // Validate sort_order before building params
      if (query?.sort_order && !['asc', 'desc'].includes(query.sort_order)) {
        console.error('❌ Invalid sort_order:', query.sort_order);
        throw new Error(`Invalid sort_order: ${query.sort_order}. Must be 'asc' or 'desc'`);
      }
      
      const params = new URLSearchParams();
      
      if (query?.page) params.append('page', query.page.toString());
      if (query?.limit) params.append('limit', query.limit.toString());
      if (query?.search) params.append('search', query.search);
      if (query?.author_id) params.append('author_id', query.author_id);
      if (query?.status !== undefined) params.append('status', query.status.toString());
      if (query?.date_from) params.append('date_from', query.date_from);
      if (query?.date_to) params.append('date_to', query.date_to);
      if (query?.sort_by) params.append('sort_by', query.sort_by);
      if (query?.sort_order) params.append('sort_order', query.sort_order);

      const response = await api.get(`${API.Blog.LIST}?${params.toString()}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Search blogs với pagination - sử dụng endpoint chính với search param
  searchBlogs: async (searchQuery: string, query?: Omit<BlogQuery, 'search'>): Promise<BlogsPaginatedResponse> => {
    try {
      return await blogService.getBlogs({
        search: searchQuery,
        ...query
      });
    } catch (error) {
      throw error;
    }
  },

  // Lấy thống kê blog theo author
  getBlogStats: async (authorId: string): Promise<BlogStatsResponse> => {
    try {
      const response = await api.get(`${API.Blog.LIST}/author/${authorId}/stats`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy chi tiết blog theo ID
  getBlogById: async (blogId: string): Promise<BlogResponse> => {
    try {
      const response = await api.get(API.Blog.DETAIL(blogId));
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Lấy danh sách comment của blog
  getBlogComments: async (blogId: string): Promise<CommentsResponse> => {
    try {
      const response = await api.get(`${API.Blog.DETAIL(blogId)}/comments`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Đăng comment mới (chỉ customer)
  createComment: async (blogId: string, content: string, isAnonymous: boolean = false, parentCommentId?: string) => {
    try {
      const response = await api.post(`${API.Blog.DETAIL(blogId)}/comments`, {
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
      const response = await api.post(API.Blog.CREATE, {
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
      const response = await api.put(API.Blog.UPDATE(blogId), {
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
      const response = await api.delete(API.Blog.DELETE(blogId));
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
      const response = await api.put(`${API.Blog.DETAIL(blogId)}/comments/${commentId}`, {
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
      const response = await api.delete(`${API.Blog.DETAIL(blogId)}/comments/${commentId}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Backward compatibility methods
  getAllBlogs: async (): Promise<Blog[]> => {
    try {
      const response = await blogService.getBlogs({ page: 1, limit: 100, status: true });
      return response.data.blogs.map(blog => ({
        _id: blog.blog_id,
        title: blog.title,
        content: blog.content,
        authorId: blog.author_id,
        tags: [],
        createdAt: blog.publish_date,
        updatedAt: blog.updated_date
      }));
    } catch (error) {
      throw error;
    }
  },

  getBlogsByAuthor: async (authorId: string): Promise<Blog[]> => {
    try {
      const response = await blogService.getBlogs({ author_id: authorId, limit: 100 });
      return response.data.blogs.map(blog => ({
        _id: blog.blog_id,
        title: blog.title,
        content: blog.content,
        authorId: blog.author_id,
        tags: [],
        createdAt: blog.publish_date,
        updatedAt: blog.updated_date
      }));
    } catch (error) {
      throw error;
    }
  },

  getBlogsByTag: async (tag: string): Promise<Blog[]> => {
    try {
      const response = await blogService.searchBlogs(tag);
      return response.data.blogs.map(blog => ({
        _id: blog.blog_id,
        title: blog.title,
        content: blog.content,
        authorId: blog.author_id,
        tags: [],
        createdAt: blog.publish_date,
        updatedAt: blog.updated_date
      }));
    } catch (error) {
      throw error;
    }
  },

  likeBlog: async (id: string): Promise<void> => {
    try {
      await api.post(`${API.Blog.DETAIL(id)}/like`);
    } catch (error) {
      throw error;
    }
  }
};