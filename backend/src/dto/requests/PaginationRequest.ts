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