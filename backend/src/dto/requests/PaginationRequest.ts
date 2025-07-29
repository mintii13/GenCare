export interface PaginationQuery {
    page?: number;        // Default: 1
    limit?: number;       // Default: 10
    sort_by?: string;     // Field to sort
    sort_order?: 'asc' | 'desc'; // Default: 'desc'
}

export interface BlogQuery extends PaginationQuery {
    // Filters
    search?: string;      // Tìm trong title, content
    author_id?: string;   // Lọc theo tác giả
    status?: boolean;     // true = published, false = deleted
    date_from?: string;   // Lọc theo publish_date (YYYY-MM-DD)
    date_to?: string;     // Lọc theo publish_date (YYYY-MM-DD)

    // Sorting - override to specify valid fields
    sort_by?: 'publish_date' | 'updated_date' | 'title';
}

export interface BlogCommentQuery extends PaginationQuery {
    // Filters
    blog_id?: string;         // Comments của blog cụ thể
    customer_id?: string;     // Comments của user
    status?: boolean;         // true = active, false = deleted
    is_anonymous?: boolean;   // Ẩn danh hay không
    parent_comment_id?: string; // null = root comments, có giá trị = replies
    date_from?: string;       // Lọc theo comment_date
    date_to?: string;

    // Sorting
    sort_by?: 'comment_date' | 'status';
}

export interface BlogCommentQuery extends PaginationQuery {
    // Filters
    search?: string;              // Tìm trong content
    blog_id?: string;             // Comments của blog cụ thể
    customer_id?: string;         // Comments của user
    status?: boolean;             // true = active, false = deleted
    is_anonymous?: boolean;       // Ẩn danh hay không
    parent_comment_id?: string;   // null = root comments, có giá trị = replies
    date_from?: string;           // Lọc theo comment_date
    date_to?: string;

    // Sorting
    sort_by?: 'comment_date' | 'status';
}

export interface AppointmentQuery extends PaginationQuery {
    // Filters
    search?: string;              // THÊM DÒNG NÀY - Search trong notes
    customer_id?: string;         // Lịch hẹn của khách hàng
    consultant_id?: string;       // Lịch hẹn của consultant
    status?: 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'in_progress';
    appointment_date_from?: string;
    appointment_date_to?: string;
    video_call_status?: 'not_started' | 'in_progress' | 'ended';
    has_feedback?: boolean;       // Có feedback hay chưa
    feedback_rating?: number;     // Lọc theo rating (1-5)

    // Sorting - override to specify valid fields
    sort_by?: 'appointment_date' | 'created_date' | 'updated_date' | 'status';
}

export interface AppointmentHistoryQuery extends PaginationQuery {
    // Filter fields
    appointment_id?: string;
    action?: 'created' | 'confirmed' | 'rescheduled' | 'cancelled' | 'completed' | 'updated' | 'started';
    performed_by_user_id?: string;
    performed_by_role?: 'customer' | 'consultant' | 'staff' | 'admin';
    date_from?: string;
    date_to?: string;
}

export type StiResultQuery = {
    page?: string;
    limit?: string;
    sort_by?: string;
    sort_order?: 'asc' | 'desc';
  
    sti_order_id?: string;
    is_testing_completed?: string;
    is_confirmed?: string;        
    staff_id?: string;
    received_time_from?: string;   
    received_time_to?: string;    
};