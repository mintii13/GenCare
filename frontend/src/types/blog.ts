export interface Author {
  user_id: string;
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
  authorId?: string;
  specialization?: string;
  sortBy?: 'publish_date' | 'updated_date' | 'title';
  sortOrder?: 'asc' | 'desc';
}