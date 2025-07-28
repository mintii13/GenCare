export interface PaginationInfo {
    current_page: number;
    total_pages: number;
    total_items: number;
    items_per_page: number;
    has_next: boolean;
    has_prev: boolean;
}

export interface PaginatedResponse<T> {
    success: boolean;
    message: string;
    data: {
        items: T[];
        pagination: PaginationInfo;
        filters_applied?: Record<string, any>;
    };
    timestamp: string;
}

