import { PaginationQuery } from '../dto/requests/PaginationRequest';
import { PaginationInfo } from '../dto/responses/PaginationResponse';


export class PaginationUtils {
    /**
     * Validate và normalize pagination parameters
     */
    static validatePagination(query: PaginationQuery): {
        page: number;
        limit: number;
        sort_by: string;
        sort_order: 1 | -1;
    } {
        const page = Math.max(1, parseInt(query.page?.toString() || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit?.toString() || '10') || 10));
        const sort_by = query.sort_by || 'publish_date'; // Default sort field
        const sort_order = query.sort_order === 'asc' ? 1 : -1; // Default: newest first

        return { page, limit, sort_by, sort_order };
    }

    /**
     * Calculate pagination info
     */
    static calculatePagination(
        total: number,
        page: number,
        limit: number
    ): PaginationInfo {
        const total_pages = Math.ceil(total / limit);

        return {
            current_page: page,
            total_pages,
            total_items: total,
            items_per_page: limit,
            has_next: page < total_pages,
            has_prev: page > 1
        };
    }

    /**
     * Build MongoDB filter query từ search parameters
     */
    static buildBlogFilter(query: any): any {
        const filter: any = {};

        // Status filter (default: chỉ lấy published blogs)
        if (query.status !== undefined) {
            filter.status = query.status === 'true' || query.status === true;
        } else {
            filter.status = true; // Default: chỉ lấy published
        }

        // Author filter
        if (query.author_id) {
            filter.author_id = query.author_id;
        }

        // Search trong title và content
        if (query.search) {
            const searchRegex = { $regex: query.search.trim(), $options: 'i' };
            filter.$or = [
                { title: searchRegex },
                { content: searchRegex }
            ];
        }

        // Date range filter
        if (query.date_from || query.date_to) {
            filter.publish_date = {};
            if (query.date_from) {
                filter.publish_date.$gte = new Date(query.date_from);
            }
            if (query.date_to) {
                // Include toàn bộ ngày cuối
                const endDate = new Date(query.date_to);
                endDate.setHours(23, 59, 59, 999);
                filter.publish_date.$lte = endDate;
            }
        }

        return filter;
    }


    /**
     * Sanitize search input để tránh regex injection
     */
    static sanitizeSearch(search: string): string {
        return search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    /**
  * Build MongoDB filter query cho blog comments
  */
    static buildBlogCommentFilter(query: any): any {
        const filter: any = {};

        // Status filter (default: chỉ lấy active comments)
        if (query.status !== undefined) {
            filter.status = query.status === 'true' || query.status === true;
        } else {
            filter.status = true; // Default: chỉ lấy active
        }

        // Blog filter
        if (query.blog_id) {
            filter.blog_id = query.blog_id;
        }

        // Customer filter
        if (query.customer_id) {
            filter.customer_id = query.customer_id;
        }

        // Anonymous filter
        if (query.is_anonymous !== undefined) {
            filter.is_anonymous = query.is_anonymous === 'true' || query.is_anonymous === true;
        }

        // Parent comment filter
        if (query.parent_comment_id !== undefined) {
            if (query.parent_comment_id === 'null' || query.parent_comment_id === null) {
                filter.parent_comment_id = null; // Root comments only
            } else {
                filter.parent_comment_id = query.parent_comment_id;
            }
        }

        // Content search
        if (query.search) {
            filter.content = { $regex: query.search.trim(), $options: 'i' };
        }

        // Date range filter
        if (query.date_from || query.date_to) {
            filter.comment_date = {};
            if (query.date_from) {
                filter.comment_date.$gte = new Date(query.date_from);
            }
            if (query.date_to) {
                const endDate = new Date(query.date_to);
                endDate.setHours(23, 59, 59, 999);
                filter.comment_date.$lte = endDate;
            }
        }

        return filter;
    }
}