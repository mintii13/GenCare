export interface Author {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  role: 'consultant';
  avatar: string;
  specialization: string;
  qualifications: string;
  experience_years: number;
  consultation_rating: number;
  total_consultations: number;
}

export interface Customer {
  user_id: number;
  full_name: string;
  email: string;
  phone: string;
  role: 'customer';
  avatar: string;
  medical_history: string;
  custom_avatar: string | null;
  last_updated: string;
}

export interface Blog {
  blog_id: number;
  author_id: number;
  title: string;
  content: string;
  publish_date: string;
  updated_date: string;
  status: 'published' | 'draft';
  author: Author;
}

export interface Comment {
  comment_id: number;
  blog_id: number;
  customer_id: number | null;
  content: string;
  comment_date: string;
  parent_comment_id: number | null;
  status: 'approved' | 'pending' | 'rejected';
  is_anonymous: boolean;
  customer: Customer | null;
}

export interface BlogsResponse {
  success: boolean;
  message: string;
  data: {
    blogs: Blog[];
  };
}

export interface CommentsResponse {
  success: boolean;
  message: string;
  data: {
    comments: Comment[];
  };
  timestamp: string;
}

export interface BlogFilters {
  searchQuery?: string;
  authorId?: number;
  specialization?: string;
  sortBy?: 'publish_date' | 'updated_date' | 'title';
  sortOrder?: 'asc' | 'desc';
} 