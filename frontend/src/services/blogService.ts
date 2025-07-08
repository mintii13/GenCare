import apiClient from './apiClient';
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
    // Validate sort_order before building params
    if (query?.sort_order && !['asc', 'desc'].includes(query.sort_order)) {

      throw new Error(`Invalid sort_order: ${query.sort_order}. Must be 'asc' or 'desc'`);
    }
    
    const response = await apiClient.get<BlogsPaginatedResponse>(API.Blog.LIST, { params: query });
    return response.data;
  },

  // Search blogs với pagination - sử dụng endpoint chính với search param
  searchBlogs: async (searchQuery: string, query?: Omit<BlogQuery, 'search'>): Promise<BlogsPaginatedResponse> => {
    return await blogService.getBlogs({
      search: searchQuery,
      ...query
    });
  },

  // Lấy thống kê blog theo author
  getBlogStats: async (authorId: string): Promise<BlogStatsResponse> => {
    const response = await apiClient.get<BlogStatsResponse>(`${API.Blog.LIST}/author/${authorId}/stats`);
    return response.data;
  },

  // Lấy chi tiết blog theo ID
  getBlogById: async (blogId: string): Promise<BlogResponse> => {
    const response = await apiClient.get<BlogResponse>(API.Blog.DETAIL(blogId));
    return response.data;
  },

  // Lấy danh sách comment của blog
  getBlogComments: async (blogId: string): Promise<CommentsResponse> => {
    const response = await apiClient.get<CommentsResponse>(API.Blog.COMMENTS_FOR_BLOG(blogId));
    return response.data;
  },

  // Đăng comment mới (chỉ customer)
  createComment: async (blogId: string, content: string, isAnonymous: boolean = false, parentCommentId?: string) => {
    const response = await apiClient.post(API.Blog.POST_COMMENT(blogId), {
      content,
      is_anonymous: isAnonymous,
      parent_comment_id: parentCommentId
    });
    return response.data;
  },

  // Tạo blog mới (chỉ consultant)
  createBlog: async (title: string, content: string) => {
    const response = await apiClient.post(API.Blog.CREATE, {
      title,
      content
    });
    return response.data;
  },

  // Cập nhật blog (chỉ consultant và chỉ blog của mình)
  updateBlog: async (blogId: string, title: string, content: string) => {
    const response = await apiClient.put(API.Blog.UPDATE(blogId), {
      title,
      content
    });
    return response.data;
  },

  // Xóa blog (chỉ consultant và chỉ blog của mình)
  deleteBlog: async (blogId: string) => {
    const response = await apiClient.delete(API.Blog.DELETE(blogId));
    return response.data;
  },

  // Lấy danh sách chuyên khoa để filter
  getSpecializations: async () => {
    // Không còn dùng mock, trả về mảng rỗng hoặc có thể xóa hàm này nếu không dùng nữa
    return { success: true, data: { specializations: [] } };
  },

  // Sửa bình luận
  updateComment: async (blogId: string, commentId: string, content: string, isAnonymous?: boolean) => {
    const response = await apiClient.put(API.Blog.UPDATE_COMMENT(commentId), {
      content,
      ...(typeof isAnonymous !== 'undefined' ? { is_anonymous: isAnonymous } : {})
    });
    return response.data;
  },

  // Xóa bình luận
  deleteComment: async (blogId: string, commentId: string) => {
    const response = await apiClient.delete(API.Blog.DELETE_COMMENT(commentId));
    return response.data;
  },

  // Backward compatibility methods
  getAllBlogs: async (): Promise<Blog[]> => {
    try {
      const response = await blogService.getBlogs({ page: 1, limit: 100, status: true });
      if (response && response.data && Array.isArray(response.data.blogs)) {
        return response.data.blogs.map(blog => ({
          _id: blog.blog_id,
          title: blog.title,
          content: blog.content,
          authorId: blog.author_id,
          tags: [],
          createdAt: blog.publish_date,
          updatedAt: blog.updated_date
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  },

  getBlogsByAuthor: async (authorId: string): Promise<Blog[]> => {
    try {
      const response = await blogService.getBlogs({ author_id: authorId, limit: 100 });
      if (response && response.data && Array.isArray(response.data.blogs)) {
        return response.data.blogs.map(blog => ({
          _id: blog.blog_id,
          title: blog.title,
          content: blog.content,
          authorId: blog.author_id,
          tags: [],
          createdAt: blog.publish_date,
          updatedAt: blog.updated_date
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  },

  getBlogsByTag: async (tag: string): Promise<Blog[]> => {
    try {
      const response = await blogService.searchBlogs(tag);
      if (response && response.data && Array.isArray(response.data.blogs)) {
        return response.data.blogs.map(blog => ({
          _id: blog.blog_id,
          title: blog.title,
          content: blog.content,
          authorId: blog.author_id,
          tags: [],
          createdAt: blog.publish_date,
          updatedAt: blog.updated_date
        }));
      }
      return [];
    } catch (error) {
      throw error;
    }
  },

  likeBlog: async (id: string): Promise<void> => {
    await apiClient.post(`${API.Blog.DETAIL(id)}/like`);
  }
};