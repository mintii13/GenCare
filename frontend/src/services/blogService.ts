import api from './api';
import { BlogsResponse, CommentsResponse, BlogFilters, Comment } from '../types/blog';
import { 
  mockBlogsData, 
  mockCommentsData, 
  mockSpecializationsData,
  getBlogById as getMockBlogById,
  getCommentsByBlogId as getMockCommentsByBlogId
} from '../data/mockBlogData';

// Flag để bật/tắt mock data
const USE_MOCK_DATA = true; // Luôn dùng mock data để demo

export const blogService = {
  // Lấy danh sách blog với filter
  getBlogs: async (filters?: BlogFilters): Promise<BlogsResponse> => {
    console.log('🔧 BlogService.getBlogs called with USE_MOCK_DATA:', USE_MOCK_DATA);
    console.log('📋 Input filters:', filters);
    
    if (USE_MOCK_DATA) {
      console.log('🎭 Using mock data');
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      let filteredBlogs = [...mockBlogsData.data.blogs];
      console.log('📚 Initial mock blogs count:', filteredBlogs.length);
      
      // Apply filters
      if (filters?.searchQuery) {
        const query = filters.searchQuery.toLowerCase();
        filteredBlogs = filteredBlogs.filter(blog => 
          blog.title.toLowerCase().includes(query) ||
          blog.content.toLowerCase().includes(query) ||
          blog.author.full_name.toLowerCase().includes(query)
        );
      }
      
      if (filters?.specialization) {
        filteredBlogs = filteredBlogs.filter(blog => 
          blog.author.specialization === filters.specialization
        );
      }
      
      if (filters?.authorId) {
        filteredBlogs = filteredBlogs.filter(blog => 
          blog.author_id === filters.authorId
        );
      }
      
      // Apply sorting
      if (filters?.sortBy) {
        filteredBlogs.sort((a, b) => {
          let valueA: any, valueB: any;
          
          switch (filters.sortBy) {
            case 'publish_date':
              valueA = new Date(a.publish_date);
              valueB = new Date(b.publish_date);
              break;
            case 'updated_date':
              valueA = new Date(a.updated_date);
              valueB = new Date(b.updated_date);
              break;
            case 'title':
              valueA = a.title.toLowerCase();
              valueB = b.title.toLowerCase();
              break;
            default:
              return 0;
          }
          
          if (filters.sortOrder === 'asc') {
            return valueA > valueB ? 1 : -1;
          } else {
            return valueA < valueB ? 1 : -1;
          }
        });
      }
      
      return {
        ...mockBlogsData,
        data: { blogs: filteredBlogs }
      };
    }

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
      console.error('API Error, falling back to mock data:', error);
      return mockBlogsData;
    }
  },

  // Lấy chi tiết blog theo ID
  getBlogById: async (blogId: number): Promise<BlogsResponse> => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      const blog = getMockBlogById(blogId);
      if (blog) {
        return {
          success: true,
          message: "Lấy chi tiết blog thành công",
          data: { blogs: [blog] }
        };
      } else {
        return {
          success: false,
          message: "Không tìm thấy blog",
          data: { blogs: [] }
        };
      }
    }

    try {
      const response = await api.get(`/blogs/${blogId}`);
      return response.data;
    } catch (error) {
      console.error('API Error, falling back to mock data:', error);
      const blog = getMockBlogById(blogId);
      return {
        success: !!blog,
        message: blog ? "Lấy chi tiết blog thành công" : "Không tìm thấy blog",
        data: { blogs: blog ? [blog] : [] }
      };
    }
  },

  // Lấy danh sách comment của blog
  getBlogComments: async (blogId: number): Promise<CommentsResponse> => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 200));
      
      const comments = getMockCommentsByBlogId(blogId);
      return {
        success: true,
        message: "Lấy danh sách comment thành công",
        data: { comments },
        timestamp: new Date().toISOString()
      };
    }

    try {
      const response = await api.get(`/blogs/${blogId}/comments`);
      return response.data;
    } catch (error) {
      console.error('API Error, falling back to mock data:', error);
      const comments = getMockCommentsByBlogId(blogId);
      return {
        success: true,
        message: "Lấy danh sách comment thành công (mock)",
        data: { comments },
        timestamp: new Date().toISOString()
      };
    }
  },

  // Đăng comment mới (chỉ customer)
  createComment: async (blogId: number, content: string, isAnonymous: boolean = false, parentCommentId?: number) => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulate successful comment creation
      const newComment = {
        comment_id: Date.now(), // Simple ID generation
        blog_id: blogId,
        customer_id: isAnonymous ? null : 999, // Mock customer ID
        content,
        comment_date: new Date().toISOString(),
        parent_comment_id: parentCommentId || null,
        status: "approved" as const,
        is_anonymous: isAnonymous,
        customer: isAnonymous ? null : {
          user_id: 999,
          full_name: "Người dùng test",
          email: "test@example.com",
          phone: "0123456789",
          role: "customer" as const,
          avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
          medical_history: "Không có",
          custom_avatar: null,
          last_updated: new Date().toISOString()
        }
      };
      
      // Add to mock data (in real app, this would be handled by state management)
      if (!mockCommentsData[blogId]) {
        mockCommentsData[blogId] = {
          success: true,
          message: "Lấy danh sách comment thành công",
          data: { comments: [] },
          timestamp: new Date().toISOString()
        };
      }
      mockCommentsData[blogId].data.comments.push(newComment);
      
      return {
        success: true,
        message: "Đăng comment thành công",
        data: { comment: newComment }
      };
    }

    try {
      const response = await api.post(`/blogs/${blogId}/comments`, {
        content,
        is_anonymous: isAnonymous,
        parent_comment_id: parentCommentId
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Tạo blog mới (chỉ consultant)
  createBlog: async (title: string, content: string) => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));
      
      const newBlogId = mockBlogsData.data.blogs.length + 1;
      const newBlog = {
        blog_id: newBlogId,
        author_id: 999, // Mock author ID
        title,
        content,
        publish_date: new Date().toISOString(),
        updated_date: new Date().toISOString(),
        status: "published" as const,
        author: {
          user_id: 999,
          full_name: "BS. Test User",
          email: "test@example.com",
          phone: "0123456789",
          role: "consultant" as const,
          avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80",
          specialization: "Test Specialization",
          qualifications: "Test Qualifications",
          experience_years: 5,
          consultation_rating: 4.5,
          total_consultations: 100
        }
      };
      
      // Add to mock data
      mockBlogsData.data.blogs.unshift(newBlog);
      
      return {
        success: true,
        message: "Tạo blog thành công",
        data: { blog_id: newBlogId, blog: newBlog }
      };
    }

    try {
      const response = await api.post('/blogs', {
        title,
        content
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Cập nhật blog (chỉ consultant và chỉ blog của mình)
  updateBlog: async (blogId: number, title: string, content: string) => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const blogIndex = mockBlogsData.data.blogs.findIndex(blog => blog.blog_id === blogId);
      if (blogIndex !== -1) {
        mockBlogsData.data.blogs[blogIndex] = {
          ...mockBlogsData.data.blogs[blogIndex],
          title,
          content,
          updated_date: new Date().toISOString()
        };
        
        return {
          success: true,
          message: "Cập nhật blog thành công",
          data: { blog: mockBlogsData.data.blogs[blogIndex] }
        };
      } else {
        throw new Error('Blog không tồn tại');
      }
    }

    try {
      const response = await api.put(`/blogs/${blogId}`, {
        title,
        content
      });
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Xóa blog (chỉ consultant và chỉ blog của mình)
  deleteBlog: async (blogId: number) => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 400));
      
      const blogIndex = mockBlogsData.data.blogs.findIndex(blog => blog.blog_id === blogId);
      if (blogIndex !== -1) {
        mockBlogsData.data.blogs.splice(blogIndex, 1);
        return {
          success: true,
          message: "Xóa blog thành công"
        };
      } else {
        throw new Error('Blog không tồn tại');
      }
    }

    try {
      const response = await api.delete(`/blogs/${blogId}`);
      return response.data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  // Lấy danh sách chuyên khoa để filter
  getSpecializations: async () => {
    if (USE_MOCK_DATA) {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 100));
      return mockSpecializationsData;
    }

    try {
      const response = await api.get('/specializations');
      return response.data;
    } catch (error) {
      console.error('API Error, falling back to mock data:', error);
      return mockSpecializationsData;
    }
  }
}; 