import { PaginationQuery } from '../dto/requests/PaginationRequest';
import { PaginationInfo } from '../dto/responses/PaginationResponse';
import { AppointmentHistoryQuery } from '../dto/requests/AppointmentHistoryRequest';
import mongoose from 'mongoose';

export class PaginationUtils {
    /**
     * Validate và normalize pagination parameters
     * WARNING: This is a generic function, should specify sort_by based on model
     */
    static validatePagination(query: PaginationQuery): {
        page: number;
        limit: number;
        sort_by: string;
        sort_order: 1 | -1;
    } {
        const page = Math.max(1, parseInt(query.page?.toString() || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit?.toString() || '10') || 10));
        
        // ❌ REMOVED: Default sort field causing issues across different models
        // const sort_by = query.sort_by || 'publish_date'; 
        
        // ✅ FIXED: No default - let each service specify appropriate default
        const sort_by = query.sort_by || '_id'; // Fallback to universal _id field
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
     * Sanitize search input để tránh regex injection và ReDoS attacks
     */
    static sanitizeSearch(search: string): string {
        if (!search || typeof search !== 'string') return '';
        
        // Remove dangerous characters and limit length
        const sanitized = search
            .trim()
            .replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escape regex special chars
            .substring(0, 200); // Limit length to prevent ReDoS
        
        return sanitized;
    }

    /**
     * Create safe regex object for MongoDB queries
     */
    private static createSafeRegex(search: string): { $regex: string; $options: string } {
        const sanitizedSearch = this.sanitizeSearch(search);
        
        // Additional validation - reject if still looks suspicious
        if (sanitizedSearch.length > 100 || 
            /(\\\+|\\\*|\\\?|\\\{|\\\[){3,}/.test(sanitizedSearch)) {
            throw new Error('Search query contains potentially dangerous patterns');
        }
        
        return { $regex: sanitizedSearch, $options: 'i' };
    }

    /**
     * Create safe date range with timezone handling
     */
    private static createDateRange(dateFrom?: string, dateTo?: string): any {
        const dateFilter: any = {};
        
        if (dateFrom) {
            try {
                const startDate = new Date(dateFrom);
                if (isNaN(startDate.getTime())) {
                    throw new Error('Invalid date_from format');
                }
                // Start of day in UTC
                startDate.setUTCHours(0, 0, 0, 0);
                dateFilter.$gte = startDate;
            } catch (error) {
                console.warn('Invalid date_from:', dateFrom);
            }
        }
        
        if (dateTo) {
            try {
                const endDate = new Date(dateTo);
                if (isNaN(endDate.getTime())) {
                    throw new Error('Invalid date_to format');
                }
                // End of day in UTC
                endDate.setUTCHours(23, 59, 59, 999);
                dateFilter.$lte = endDate;
            } catch (error) {
                console.warn('Invalid date_to:', dateTo);
            }
        }
        
        return Object.keys(dateFilter).length > 0 ? dateFilter : undefined;
    }

    /**
     * Build MongoDB filter query từ search parameters với security improvements
     */
    static buildBlogFilter(query: any): any {
        const filter: any = {};

        // Status filter (default: chỉ lấy published blogs)
        if (query.status !== undefined) {
            filter.status = query.status === 'true' || query.status === true;
        } else {
            filter.status = true; // Default: chỉ lấy published
        }

        // Author filter with ObjectId validation
        if (query.author_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.author_id)) {
                    filter.author_id = new mongoose.Types.ObjectId(query.author_id);
                } else {
                    filter.author_id = query.author_id; // Fallback for string IDs
                }
            } catch (error) {
                console.warn('Invalid author_id:', query.author_id);
            }
        }

        // Search với sanitization để tránh ReDoS attacks
        if (query.search && typeof query.search === 'string') {
            try {
                const searchRegex = this.createSafeRegex(query.search);
            filter.$or = [
                { title: searchRegex },
                { content: searchRegex }
            ];
            } catch (error) {
                console.warn('Dangerous search pattern rejected:', query.search);
                // Return empty results for dangerous patterns
                filter._id = { $exists: false };
            }
        }

        // Date range filter với timezone handling
        const dateRange = this.createDateRange(query.date_from, query.date_to);
        if (dateRange) {
            filter.publish_date = dateRange;
        }

        return filter;
    }

    /**
     * Build MongoDB filter query cho blog comments với security improvements
  */
    static buildBlogCommentFilter(query: any): any {
        const filter: any = {};

        // Status filter (default: chỉ lấy active comments)
        if (query.status !== undefined) {
            filter.status = query.status === 'true' || query.status === true;
        } else {
            filter.status = true; // Default: chỉ lấy active
        }

        // Blog filter với ObjectId validation
        if (query.blog_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.blog_id)) {
                    filter.blog_id = new mongoose.Types.ObjectId(query.blog_id);
                } else {
                    filter.blog_id = query.blog_id; // Fallback
                }
            } catch (error) {
                console.warn('Invalid blog_id:', query.blog_id);
            }
        }

        // Customer filter với ObjectId validation
        if (query.customer_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.customer_id)) {
                    filter.customer_id = new mongoose.Types.ObjectId(query.customer_id);
                } else {
            filter.customer_id = query.customer_id;
                }
            } catch (error) {
                console.warn('Invalid customer_id:', query.customer_id);
            }
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
                try {
                    if (mongoose.Types.ObjectId.isValid(query.parent_comment_id)) {
                        filter.parent_comment_id = new mongoose.Types.ObjectId(query.parent_comment_id);
            } else {
                filter.parent_comment_id = query.parent_comment_id;
            }
                } catch (error) {
                    console.warn('Invalid parent_comment_id:', query.parent_comment_id);
                }
            }
        }

        // Content search với sanitization
        if (query.search && typeof query.search === 'string') {
            try {
                filter.content = this.createSafeRegex(query.search);
            } catch (error) {
                console.warn('Dangerous search pattern rejected:', query.search);
                filter._id = { $exists: false };
            }
        }

        // Date range filter
        const dateRange = this.createDateRange(query.date_from, query.date_to);
        if (dateRange) {
            filter.comment_date = dateRange;
        }

        return filter;
    }

    static buildAppointmentFilter(query: any): any {
        const filter: any = {};

        // Customer filter với ObjectId validation
        if (query.customer_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.customer_id)) {
                    filter.customer_id = new mongoose.Types.ObjectId(query.customer_id);
                } else {
            filter.customer_id = query.customer_id;
                }
            } catch (error) {
                console.warn('Invalid customer_id:', query.customer_id);
            }
        }

        // Consultant filter với ObjectId validation
        if (query.consultant_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.consultant_id)) {
                    filter.consultant_id = new mongoose.Types.ObjectId(query.consultant_id);
                } else {
            filter.consultant_id = query.consultant_id;
        }
            } catch (error) {
                console.warn('Invalid consultant_id:', query.consultant_id);
            }
        }

        // Status filter với validation
        if (query.status && typeof query.status === 'string') {
            const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled', 'rescheduled'];
            if (validStatuses.includes(query.status)) {
            filter.status = query.status;
            }
        }

        // Video call status filter
        if (query.video_call_status && typeof query.video_call_status === 'string') {
            const validVideoStatuses = ['pending', 'active', 'completed', 'failed'];
            if (validVideoStatuses.includes(query.video_call_status)) {
            filter.video_call_status = query.video_call_status;
            }
        }

        // Appointment date range filter
        const dateFrom = query.appointment_date_from || query.start_date;
        const dateTo = query.appointment_date_to || query.end_date;
        const dateRange = this.createDateRange(dateFrom, dateTo);
        if (dateRange) {
            filter.appointment_date = dateRange;
        }

        // Has feedback filter
        if (query.has_feedback !== undefined) {
            if (query.has_feedback === 'true' || query.has_feedback === true) {
                filter.feedback = { $exists: true, $ne: null };
            } else if (query.has_feedback === 'false' || query.has_feedback === false) {
                filter.feedback = { $exists: false };
            }
        }

        // Feedback rating filter với validation
        if (query.feedback_rating) {
            const rating = parseInt(query.feedback_rating);
            if (!isNaN(rating) && rating >= 1 && rating <= 5) {
                filter['feedback.rating'] = rating;
            }
        }

        // Search với sanitization
        if (query.search && typeof query.search === 'string') {
            try {
                const searchRegex = this.createSafeRegex(query.search);
            filter.$or = [
                { customer_notes: searchRegex },
                { consultant_notes: searchRegex },
                { 'customer_id.full_name': searchRegex },
                { 'customer_id.email': searchRegex },
                { 'customer_id.phone': searchRegex }
            ];
            } catch (error) {
                console.warn('Dangerous search pattern rejected:', query.search);
                filter._id = { $exists: false };
            }
        }

        return filter;
    }

    /**
         * Build MongoDB filter query cho appointment history
         */
    static buildAppointmentHistoryFilter(query: AppointmentHistoryQuery): any {
        const filter: any = {};

        // Appointment filter với ObjectId validation
        if (query.appointment_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.appointment_id)) {
                    filter.appointment_id = new mongoose.Types.ObjectId(query.appointment_id);
                } else {
            filter.appointment_id = query.appointment_id;
        }
            } catch (error) {
                console.warn('Invalid appointment_id:', query.appointment_id);
            }
        }

        // Action filter với validation
        if (query.action && typeof query.action === 'string') {
            const validActions = ['created', 'updated', 'confirmed', 'cancelled', 'completed', 'rescheduled'];
            if (validActions.includes(query.action)) {
            filter.action = query.action;
            }
        }

        // Performed by user filter với ObjectId validation
        if (query.performed_by_user_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.performed_by_user_id)) {
                    filter.performed_by_user_id = new mongoose.Types.ObjectId(query.performed_by_user_id);
                } else {
            filter.performed_by_user_id = query.performed_by_user_id;
        }
            } catch (error) {
                console.warn('Invalid performed_by_user_id:', query.performed_by_user_id);
            }
        }

        // Performed by role filter với validation
        if (query.performed_by_role && typeof query.performed_by_role === 'string') {
            const validRoles = ['admin', 'staff', 'consultant', 'customer'];
            if (validRoles.includes(query.performed_by_role)) {
            filter.performed_by_role = query.performed_by_role;
            }
        }

        // Date range filter
        const dateRange = this.createDateRange(query.date_from, query.date_to);
        if (dateRange) {
            filter.timestamp = dateRange;
        }

        return filter;
    }

    /**
     * Build MongoDB filter query cho STI Orders với security improvements
     */
    static buildStiOrderFilter(query: any): any {
        const filter: any = {};

        // Customer filter với ObjectId validation
        if (query.customer_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.customer_id)) {
            filter.customer_id = new mongoose.Types.ObjectId(query.customer_id);
        }
            } catch (error) {
                console.warn('Invalid customer_id:', query.customer_id);
            }
        }

        // Order status filter với validation
        if (query.order_status && typeof query.order_status === 'string') {
            const validStatuses = ['pending', 'confirmed', 'processing', 'completed', 'cancelled'];
            if (validStatuses.includes(query.order_status)) {
            filter.order_status = query.order_status;
        }
        }

        // Payment status filter với validation
        if (query.is_paid !== undefined) {
            if (query.is_paid === 'true' || query.is_paid === true) {
                filter.is_paid = true;
            } else if (query.is_paid === 'false' || query.is_paid === false) {
                filter.is_paid = false;
            }
        }

        // Date range filter
        const dateRange = this.createDateRange(query.date_from, query.date_to);
        if (dateRange) {
            filter.order_date = dateRange;
        }

        // Amount range filter với validation
        if (query.min_amount || query.max_amount) {
            filter.total_amount = {};
            
            if (query.min_amount) {
                const minAmount = parseFloat(query.min_amount);
                if (!isNaN(minAmount) && minAmount >= 0) {
                    filter.total_amount.$gte = minAmount;
                }
            }
            
            if (query.max_amount) {
                const maxAmount = parseFloat(query.max_amount);
                if (!isNaN(maxAmount) && maxAmount >= 0) {
                    filter.total_amount.$lte = maxAmount;
                }
            }
            
            // Remove empty filter
            if (Object.keys(filter.total_amount).length === 0) {
                delete filter.total_amount;
            }
        }

        // Consultant filter với ObjectId validation
        if (query.consultant_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.consultant_id)) {
            filter.consultant_id = new mongoose.Types.ObjectId(query.consultant_id);
                }
            } catch (error) {
                console.warn('Invalid consultant_id:', query.consultant_id);
            }
        }

        // Staff filter với ObjectId validation
        if (query.staff_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.staff_id)) {
            filter.staff_id = new mongoose.Types.ObjectId(query.staff_id);
                }
            } catch (error) {
                console.warn('Invalid staff_id:', query.staff_id);
            }
        }

        // STI Package filter với ObjectId validation
        if (query.sti_package_id) {
            try {
                if (mongoose.Types.ObjectId.isValid(query.sti_package_id)) {
            filter['sti_package_item.sti_package_id'] = new mongoose.Types.ObjectId(query.sti_package_id);
                }
            } catch (error) {
                console.warn('Invalid sti_package_id:', query.sti_package_id);
            }
        }

        return filter;
    }

    /**
     * Additional validation methods for STI orders
     */
    static validateStiOrderPagination(query: any): {
        page: number;
        limit: number;
        sort_by: string;
        sort_order: 1 | -1;
    } {
        const page = Math.max(1, parseInt(query.page?.toString() || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit?.toString() || '10') || 10));
        
        // ✅ FIXED: Use actual database field names - MongoDB uses camelCase for timestamps
        const validSortFields = ['order_date', 'total_amount', 'order_status', 'createdAt', 'updatedAt'];
        const sort_by = validSortFields.includes(query.sort_by) ? query.sort_by : 'order_date';
        const sort_order = query.sort_order === 'asc' ? 1 : -1;

        return { page, limit, sort_by, sort_order };
    }

    /**
 * Build MongoDB filter query cho Audit Logs
 */
    static buildAuditLogFilter(query: any): any {
        const filter: any = {};

        // Target type filter
        if (query.target_type) {
            filter.target_type = query.target_type;
        }

        // Target ID filter
        if (query.target_id) {
            filter.target_id = new mongoose.Types.ObjectId(query.target_id);
        }

        // User ID filter
        if (query.user_id) {
            filter.user_id = new mongoose.Types.ObjectId(query.user_id);
        }

        // Action filter
        if (query.action) {
            filter.action = { $regex: query.action.trim(), $options: 'i' };
        }

        // Date range filter
        if (query.date_from || query.date_to) {
            filter.timestamp = {};
            if (query.date_from) {
                filter.timestamp.$gte = new Date(query.date_from);
            }
            if (query.date_to) {
                // Include toàn bộ ngày cuối
                const endDate = new Date(query.date_to);
                endDate.setHours(23, 59, 59, 999);
                filter.timestamp.$lte = endDate;
            }
        }

        return filter;
    }

    /**
     * Validate và normalize pagination parameters cho Audit Log
     */
    static validateAuditLogPagination(query: any): {
        page: number;
        limit: number;
        sort_by: string;
        sort_order: 1 | -1;
    } {
        const page = Math.max(1, parseInt(query.page?.toString() || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit?.toString() || '10') || 10));
        
        // ✅ FIXED: STI Assessment model uses custom timestamp names
        const validSortFields = ['timestamp', 'action', 'table_name', 'record_id', 'created_at', 'updated_at'];
        const sort_by = validSortFields.includes(query.sort_by) ? query.sort_by : 'timestamp';
        const sort_order = query.sort_order === 'asc' ? 1 : -1;

        return { page, limit, sort_by, sort_order };
    }

    /**
     * Enhanced validation for different model types
     */
    static validatePaginationForModel(query: any, modelType: string): {
        page: number;
        limit: number;
        sort_by: string;
        sort_order: 1 | -1;
    } {
        const page = Math.max(1, parseInt(query.page?.toString() || '1') || 1);
        const limit = Math.min(100, Math.max(1, parseInt(query.limit?.toString() || '10') || 10));
        
        // Define valid sort fields per model type
        const modelSortFields: Record<string, string[]> = {
            blog: ['publish_date', 'updated_date', 'title', 'read_count', 'like_count', 'comment_count'],
            appointment: ['appointment_date', 'created_date', 'updated_date', 'status', 'start_time'],
            user: ['registration_date', 'updated_date', 'full_name', 'email', 'role', 'last_login'],
            sti_order: ['order_date', 'total_amount', 'order_status', 'createdAt', 'updatedAt'],
            sti_assessment: ['timestamp', 'action', 'table_name', 'record_id', 'created_at', 'updated_at'],
            audit_log: ['timestamp', 'action', 'table_name', 'record_id'],
            payment: ['createdAt', 'updatedAt', 'amount', 'status', 'payment_method'],
            menstrual_cycle: ['cycle_start_date', 'createdAt', 'updatedAt', 'cycle_length'],
            pill_tracking: ['pill_date', 'createdAt', 'is_taken']
        };

        // Default sort fields per model
        const defaultSortFields: Record<string, string> = {
            blog: 'publish_date',
            appointment: 'appointment_date', 
            user: 'registration_date',
            sti_order: 'order_date',
            sti_assessment: 'created_at',
            audit_log: 'timestamp',
            payment: 'createdAt',
            menstrual_cycle: 'cycle_start_date',
            pill_tracking: 'pill_date'
        };

        const validSortFields = modelSortFields[modelType] || ['createdAt', 'updatedAt'];
        const defaultSort = defaultSortFields[modelType] || 'createdAt';
        
        const sort_by = validSortFields.includes(query.sort_by) ? query.sort_by : defaultSort;
        const sort_order = query.sort_order === 'asc' ? 1 : -1;

        return { page, limit, sort_by, sort_order };
    }

    /**
     * Build MongoDB filter query cho User với security improvements
 */
    static buildUserFilter(query: any): any {
        const filter: any = {};

        // Role filter với validation
        if (query.role && typeof query.role === 'string') {
            const validRoles = ['admin', 'staff', 'consultant', 'customer', 'manager'];
            if (validRoles.includes(query.role)) {
            filter.role = query.role;
            }
        }

        // Status filter
        if (query.status !== undefined) {
            filter.status = query.status === 'true' || query.status === true;
        }

        // Email verified filter
        if (query.email_verified !== undefined) {
            filter.email_verified = query.email_verified === 'true' || query.email_verified === true;
        }

        // Search filter với sanitization (tìm trong email, full_name, phone)
        if (query.search && typeof query.search === 'string') {
            try {
                const searchRegex = this.createSafeRegex(query.search);
            filter.$or = [
                { email: searchRegex },
                { full_name: searchRegex },
                { phone: searchRegex }
            ];
            } catch (error) {
                console.warn('Dangerous search pattern rejected:', query.search);
                filter._id = { $exists: false };
            }
        }

        // Date range filter (registration_date)
        const dateRange = this.createDateRange(query.date_from, query.date_to);
        if (dateRange) {
            filter.registration_date = dateRange;
        }

        return filter;
    }
}