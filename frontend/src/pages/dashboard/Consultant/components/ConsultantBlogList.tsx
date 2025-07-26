import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { blogService } from '@/services/blogService';
import { Blog, BlogQuery, PaginationInfo } from '@/types/blog';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2, MessageSquare, Eye, Loader, ChevronLeft, ChevronRight, SortAsc, SortDesc, ChevronDown, FileText } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const ConsultantBlogList: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentCounts, setCommentCounts] = useState<{ [blogId: string]: number }>({});
  
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [query, setQuery] = useState<BlogQuery>({
    page: 1,
    limit: 10,
    sort_by: 'publish_date',
    sort_order: 'desc',
  });

  useEffect(() => {
    const fetchBlogs = async () => {
      if (!user) {
        setLoading(false);
        return;
      }
      
      setLoading(true);
      setError(null);
      
      try {
        const res = await blogService.getBlogs({
          ...query,
          author_id: user.id.toString(),
        });
        
        if (res.success && res.data.blogs) {
          setBlogs(res.data.blogs);
          setPagination(res.data.pagination);
        } else {
          setBlogs([]);
          setPagination(null);
        }

        try {
          const statsRes = await blogService.getBlogStats(user.id.toString());
          if (statsRes.success) {
            setStats(statsRes.data);
          }
        } catch (statsError) {
          const published = res.data.blogs?.filter((blog: Blog) => blog.status).length || 0;
          const total = res.data.blogs?.length || 0;
          setStats({ published, draft: total - published, total });
        }
        
      } catch (err: any) {
        setError(err.message || 'Không thể tải danh sách blog');
      } finally {
        setLoading(false);
      }
    };
    
    fetchBlogs();
  }, [user, query]);

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

  const handlePageChange = (page: number) => {
    setQuery(prev => ({ ...prev, page }));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (sort_by: 'publish_date' | 'title', sort_order: 'asc' | 'desc') => {
    setQuery(prev => ({
      ...prev,
      page: 1,
      sort_by,
      sort_order,
    }));
  };

  const generatePageNumbers = () => {
    if (!pagination) return [];
    const pages = [];
    const { current_page, total_pages } = pagination;
    
    if (total_pages > 1) pages.push(1);
    
    for (let i = Math.max(2, current_page - 1); i <= Math.min(total_pages - 1, current_page + 1); i++) {
      if (!pages.includes(i)) pages.push(i);
    }
    
    if (total_pages > 1 && !pages.includes(total_pages)) {
      pages.push(total_pages);
    }
    
    return pages;
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-600" />
          <p className="text-gray-600">Đang tải danh sách blog...</p>
        </div>
      </div>
    );
  }

  const SortButton: React.FC<{
    sortBy: 'publish_date' | 'title';
    sortOrder: 'asc' | 'desc';
    currentSort: BlogQuery;
    children: React.ReactNode;
  }> = ({ sortBy, sortOrder, currentSort, children }) => (
    <DropdownMenuItem
      onClick={() => handleSortChange(sortBy, sortOrder)}
      className={`flex items-center gap-2 ${currentSort.sort_by === sortBy && currentSort.sort_order === sortOrder ? 'bg-blue-100' : ''}`}
    >
      {children}
    </DropdownMenuItem>
  );

  return (
    <div className="container mx-auto p-4 md:p-6 bg-white rounded-lg shadow-md">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Quản lý Blog</h1>
          <p className="text-gray-500 mt-1">Xem, tạo và quản lý các bài viết của bạn.</p>
        </div>
        <div className="flex items-center gap-2">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                {query.sort_by === 'title' ? 'Sắp xếp theo tiêu đề' : 'Sắp xếp theo ngày'}
                {query.sort_order === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <SortButton sortBy="publish_date" sortOrder="desc" currentSort={query}>
                <SortDesc className="h-4 w-4" /> Mới nhất
              </SortButton>
              <SortButton sortBy="publish_date" sortOrder="asc" currentSort={query}>
                <SortAsc className="h-4 w-4" /> Cũ nhất
              </SortButton>
              <SortButton sortBy="title" sortOrder="asc" currentSort={query}>
                <SortAsc className="h-4 w-4" /> Tên (A-Z)
              </SortButton>
              <SortButton sortBy="title" sortOrder="desc" currentSort={query}>
                <SortDesc className="h-4 w-4" /> Tên (Z-A)
              </SortButton>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={() => navigate('/blogs/create')} className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            <span>Tạo Blog Mới</span>
          </Button>
        </div>
      </div>

      <div className="relative border border-gray-200 rounded-lg p-4 mb-6">
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm font-medium text-gray-500">Đã xuất bản</p>
              <p className="text-2xl font-bold text-green-600">{stats.published || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Bản nháp</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.draft || 0}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Tổng số</p>
              <p className="text-2xl font-bold text-blue-600">{stats.total || 0}</p>
            </div>
          </div>
        )}
        {loading && <div className="absolute top-4 right-4"><Loader className="w-6 h-6 animate-spin text-blue-600" /></div>}
      </div>

      <div className="mt-6">
        {blogs.length > 0 ? (
          <div className="space-y-4">
            {blogs.map((blog) => (
              <div key={blog.blog_id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-800 hover:text-blue-600 cursor-pointer" onClick={() => navigate(`/blogs/${blog.blog_id}`)}>
                    {blog.title}
                  </h3>
                  <div className="flex items-center text-sm text-gray-500 mt-2 space-x-4">
                     <span className={`px-2 py-1 text-xs font-semibold rounded-full ${blog.status ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {blog.status ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                    <span>
                      Cập nhật: {
                        blog.updated_date ? 
                          (() => {
                            try {
                              return new Date(blog.updated_date).toLocaleDateString();
                            } catch {
                              return 'Không xác định';
                            }
                          })() : 'Không xác định'
                        }
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" /> {commentCounts[blog.blog_id] || 0}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/blogs/${blog.blog_id}`)}>
                    <Eye className="w-4 h-4 mr-1" /> Xem
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => navigate(`/blogs/edit/${blog.blog_id}`)}>
                    <Edit className="w-4 h-4 mr-1" /> Sửa
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          !loading && (
            <div className="text-center py-16 border-2 border-dashed border-gray-300 rounded-lg">
              <FileText className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Không có bài viết nào</h3>
              <p className="mt-1 text-sm text-gray-500">Hãy bắt đầu tạo bài viết đầu tiên của bạn.</p>
              <div className="mt-6">
                <Button onClick={() => navigate('/blogs/create')}>
                  <Plus className="-ml-1 mr-2 h-5 w-5" />
                  Tạo Blog Mới
                </Button>
              </div>
            </div>
          )
        )}
      </div>

      {pagination && pagination.total_pages > 1 && (
        <div className="mt-8 flex justify-between items-center">
          <p className="text-sm text-gray-600">
            Hiển thị <span className="font-medium">{(pagination.current_page - 1) * pagination.items_per_page + 1}</span>
            - <span className="font-medium">{Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)}</span>
            {' '}trên <span className="font-medium">{pagination.total_items}</span> bài viết
          </p>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => handlePageChange(pagination.current_page - 1)}
              disabled={!pagination.has_prev}
              variant="outline"
              size="sm"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="ml-2">Trước</span>
            </Button>
            
            <div className="flex items-center gap-1">
              {generatePageNumbers().map((page, index) => (
                <React.Fragment key={page}>
                  {index > 0 && generatePageNumbers()[index - 1] !== page - 1 && (
                    <span className="px-2">...</span>
                  )}
                  <Button
                    onClick={() => handlePageChange(page)}
                    variant={page === pagination.current_page ? 'default' : 'ghost'}
                    size="sm"
                    className="w-9 h-9 p-0"
                  >
                    {page}
                  </Button>
                </React.Fragment>
              ))}
            </div>

            <Button
              onClick={() => handlePageChange(pagination.current_page + 1)}
              disabled={!pagination.has_next}
              variant="outline"
              size="sm"
            >
              <span className="mr-2">Sau</span>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsultantBlogList;