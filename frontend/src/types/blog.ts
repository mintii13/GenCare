export interface Author {
  consultant_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'consultant';
  avatar: string;
  specialization?: string;
  qualifications?: string;
  experience_years?: number;
  consultation_rating?: number;
  total_consultations?: number;
}

export interface Customer {
  user_id: string;
  full_name: string;
  email: string;
  phone: string;
  role: 'customer' | 'consultant' | 'staff' | 'admin';
  avatar: string;
  medical_history: string;
  custom_avatar: string | null;
  last_updated: string;
}

export interface Blog {
  blog_id: string;
  author_id: string;
  title: string;
  content: string;
  publish_date: string;
  updated_date: string;
  status: boolean;
  author: Author;
}

export interface Comment {
  comment_id: string;
  blog_id: string;
  user_id: string;
  content: string;
  comment_date: string;
  parent_comment_id: string | null;
  status: boolean;
  is_anonymous: boolean;
  user: Customer | null;
}

// Pagination types mới
export interface PaginationInfo {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
  has_next: boolean;
  has_prev: boolean;
}

export interface FiltersApplied {
  search?: string;
  author_id?: string;
  status?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: string;
  sort_order?: string;
}

// Response types mới với pagination
export interface BlogsPaginatedResponse {
  success: boolean;
  message: string;
  data: {
    blogs: Blog[];
    pagination: PaginationInfo;
    filters_applied: FiltersApplied;
  };
  timestamp: string;
}

export interface BlogResponse {
  success: boolean;
  message: string;
  data: {
    blog: Blog;
  };
  timestamp: string;
}

export interface CommentsResponse {
  success: boolean;
  message: string;
  data: {
    comments: Comment[];
  };
  timestamp: string;
}

export interface BlogStatsResponse {
  success: boolean;
  data: {
    published: number;
    draft: number;
    total: number;
  };
}

// Query parameters cho pagination
export interface BlogQuery {
  page?: number;
  limit?: number;
  search?: string;
  author_id?: string;
  status?: boolean;
  date_from?: string;
  date_to?: string;
  sort_by?: 'publish_date' | 'updated_date' | 'title';
  sort_order?: 'asc' | 'desc';
}

export interface BlogFilters {
  searchQuery?: string;
  authorId?: string;
  specialization?: string;
  sortBy?: 'publish_date' | 'updated_date' | 'title';
  sortOrder?: 'asc' | 'desc';
  
  // Deprecated - keep for backward compatibility
  page?: number;
  limit?: number;
  status?: boolean;
  dateFrom?: string;
  dateTo?: string;
}