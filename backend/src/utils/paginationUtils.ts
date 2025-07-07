import { PaginationQuery } from '../dto/requests/PaginationRequest';
import { PaginationInfo } from '../dto/responses/PaginationResponse';
import { AppointmentHistoryQuery } from '../dto/requests/AppointmentHistoryRequest';
import mongoose from 'mongoose';

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

    static buildAppointmentFilter(query: any): any {
        const filter: any = {};

        // Customer filter
        if (query.customer_id) {
            filter.customer_id = query.customer_id;
        }

        // Consultant filter
        if (query.consultant_id) {
            filter.consultant_id = query.consultant_id;
        }

        // Status filter
        if (query.status) {
            filter.status = query.status;
        }

        // Video call status filter
        if (query.video_call_status) {
            filter.video_call_status = query.video_call_status;
        }

        // UPDATED: Appointment date range filter (support both formats)
        const dateFrom = query.appointment_date_from || query.start_date;
        const dateTo = query.appointment_date_to || query.end_date;

        if (dateFrom || dateTo) {
            filter.appointment_date = {};
            if (dateFrom) {
                filter.appointment_date.$gte = new Date(dateFrom);
            }
            if (dateTo) {
                const endDate = new Date(dateTo);
                endDate.setHours(23, 59, 59, 999);
                filter.appointment_date.$lte = endDate;
            }
        }

        // Has feedback filter
        if (query.has_feedback !== undefined) {
            if (query.has_feedback === 'true' || query.has_feedback === true) {
                filter.feedback = { $exists: true, $ne: null };
            } else {
                filter.feedback = { $exists: false };
            }
        }

        // Feedback rating filter
        if (query.feedback_rating) {
            filter['feedback.rating'] = parseInt(query.feedback_rating);
        }

        // Notes search (trong customer_notes hoặc consultant_notes)
        if (query.search) {
            const searchRegex = { $regex: query.search.trim(), $options: 'i' };
            filter.$or = [
                { customer_notes: searchRegex },
                { consultant_notes: searchRegex }
            ];
        }

        return filter;
    }
    /**
         * Build MongoDB filter query cho appointment history
         */
    static buildAppointmentHistoryFilter(query: AppointmentHistoryQuery): any {
        const filter: any = {};

        // Appointment filter
        if (query.appointment_id) {
            filter.appointment_id = query.appointment_id;
        }

        // Action filter
        if (query.action) {
            filter.action = query.action;
        }

        // Performed by user filter
        if (query.performed_by_user_id) {
            filter.performed_by_user_id = query.performed_by_user_id;
        }

        // Performed by role filter
        if (query.performed_by_role) {
            filter.performed_by_role = query.performed_by_role;
        }

        // Date range filter
        if (query.date_from || query.date_to) {
            filter.timestamp = {};
            if (query.date_from) {
                filter.timestamp.$gte = new Date(query.date_from);
            }
            if (query.date_to) {
                const endDate = new Date(query.date_to);
                endDate.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = endDate;
            }
        }

        return filter;
    }
    /**
     * Build MongoDB filter query cho STI Orders
     */
    static buildStiOrderFilter(query: any): any {
        const filter: any = {};

        // Customer filter
        if (query.customer_id) {
            filter.customer_id = new mongoose.Types.ObjectId(query.customer_id);
        }

        // Order status filter
        if (query.order_status) {
            filter.order_status = query.order_status;
        }

        // Payment status filter
        if (query.payment_status) {
            filter.payment_status = query.payment_status;
        }

        // Date range filter
        if (query.date_from || query.date_to) {
            filter.order_date = {};
            if (query.date_from) {
                filter.order_date.$gte = new Date(query.date_from);
            }
            if (query.date_to) {
                // Include toàn bộ ngày cuối
                const endDate = new Date(query.date_to);
                endDate.setHours(23, 59, 59, 999);
                filter.order_date.$lte = endDate;
            }
        }

        // Amount range filter
        if (query.min_amount || query.max_amount) {
            filter.total_amount = {};
            if (query.min_amount) {
                filter.total_amount.$gte = parseFloat(query.min_amount);
            }
            if (query.max_amount) {
                filter.total_amount.$lte = parseFloat(query.max_amount);
            }
        }

        // Consultant filter
        if (query.consultant_id) {
            filter.consultant_id = new mongoose.Types.ObjectId(query.consultant_id);
        }

        // Staff filter
        if (query.staff_id) {
            filter.staff_id = new mongoose.Types.ObjectId(query.staff_id);
        }

        // STI Package filter
        if (query.sti_package_id) {
            filter['sti_package_item.sti_package_id'] = new mongoose.Types.ObjectId(query.sti_package_id);
        }

        return filter;
    }

    /**
     * Validate và normalize pagination parameters cho STI Order
     */
    static validateStiOrderPagination(query: any): {
        page: number;
        limit: number;
        sort_by: string;
        sort_order: 1 | -1;
    } {
        const page = Math.max(1, parseInt(query.page?.toString() || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit?.toString() || '10') || 10));
        const sort_by = query.sort_by || 'order_date'; // Default sort by order_date
        const sort_order = query.sort_order === 'asc' ? 1 : -1; // Default: newest first

        return { page, limit, sort_by, sort_order };
    }
}