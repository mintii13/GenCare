import { Request, Response, NextFunction } from 'express';
import { StiOrderQuery } from '../dto/requests/StiRequest';
import { AuditLogQuery } from '../dto/requests/AuditLogRequest';


// Helper functions
function isValidDate(dateString: string): boolean {
    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(dateString)) return false;

    const date = new Date(dateString);
    return date instanceof Date && !isNaN(date.getTime());
}

function isValidObjectId(id: string): boolean {
    return /^[0-9a-fA-F]{24}$/.test(id);
}

/**
 * Validate pagination query parameters
 */
export const validatePaginationQuery = (req: Request, res: Response, next: NextFunction): void => {
    const page = parseInt(req.query.page as string);
    const limit = parseInt(req.query.limit as string);

    // Validate page
    if (req.query.page && (isNaN(page) || page < 1)) {
        res.status(400).json({
            success: false,
            message: 'Page must be a positive integer starting from 1'
        });
        return;
    }

    // Validate limit
    if (req.query.limit && (isNaN(limit) || limit < 1 || limit > 100)) {
        res.status(400).json({
            success: false,
            message: 'Limit must be between 1 and 100'
        });
        return;
    }

    // Validate sort_order
    if (req.query.sort_order && !['asc', 'desc'].includes(req.query.sort_order as string)) {
        res.status(400).json({
            success: false,
            message: 'Sort order must be either "asc" or "desc"'
        });
        return;
    }

    // Validate date format
    if (req.query.date_from && !isValidDate(req.query.date_from as string)) {
        res.status(400).json({
            success: false,
            message: 'date_from must be in YYYY-MM-DD format'
        });
        return;
    }

    if (req.query.date_to && !isValidDate(req.query.date_to as string)) {
        res.status(400).json({
            success: false,
            message: 'date_to must be in YYYY-MM-DD format'
        });
        return;
    }

    // Validate date range
    if (req.query.date_from && req.query.date_to) {
        const fromDate = new Date(req.query.date_from as string);
        const toDate = new Date(req.query.date_to as string);

        if (fromDate > toDate) {
            res.status(400).json({
                success: false,
                message: 'date_from cannot be after date_to'
            });
            return;
        }
    }

    next();
};

/**
 * Validate blog-specific query parameters
 */
export const validateBlogQuery = (req: Request, res: Response, next: NextFunction): void => {
    // Validate sort_by field for blogs
    const validSortFields = ['publish_date', 'updated_date', 'title'];
    if (req.query.sort_by && !validSortFields.includes(req.query.sort_by as string)) {
        res.status(400).json({
            success: false,
            message: `sort_by must be one of: ${validSortFields.join(', ')}`
        });
        return;
    }

    // Validate status
    if (req.query.status && !['true', 'false'].includes(req.query.status as string)) {
        res.status(400).json({
            success: false,
            message: 'status must be either "true" or "false"'
        });
        return;
    }

    // Validate author_id ObjectId format
    if (req.query.author_id && !isValidObjectId(req.query.author_id as string)) {
        res.status(400).json({
            success: false,
            message: 'author_id must be a valid ObjectId'
        });
        return;
    }

    next();
};

/**
 * Validate blog comment query parameters
 */
export const validateBlogCommentQuery = (req: Request, res: Response, next: NextFunction): void => {
    // Validate sort_by field for blog comments
    const validSortFields = ['comment_date', 'status'];
    if (req.query.sort_by && !validSortFields.includes(req.query.sort_by as string)) {
        res.status(400).json({
            success: false,
            message: `sort_by must be one of: ${validSortFields.join(', ')}`
        });
        return;
    }

    // Validate ObjectId fields
    const objectIdFields = ['blog_id', 'customer_id', 'parent_comment_id'];
    for (const field of objectIdFields) {
        if (req.query[field] &&
            req.query[field] !== 'null' &&
            !isValidObjectId(req.query[field] as string)) {
            res.status(400).json({
                success: false,
                message: `${field} must be a valid ObjectId or "null"`
            });
            return;
        }
    }

    // Validate boolean fields
    const booleanFields = ['status', 'is_anonymous'];
    for (const field of booleanFields) {
        if (req.query[field] && !['true', 'false'].includes(req.query[field] as string)) {
            res.status(400).json({
                success: false,
                message: `${field} must be either "true" or "false"`
            });
            return;
        }
    }

    next();
};

/**
 * Validate appointment query parameters
 */
export const validateAppointmentQuery = (req: Request, res: Response, next: NextFunction): void => {
    // Validate sort_by field for appointments
    const validSortFields = ['appointment_date', 'created_date', 'updated_date', 'status'];
    if (req.query.sort_by && !validSortFields.includes(req.query.sort_by as string)) {
        res.status(400).json({
            success: false,
            message: `sort_by must be one of: ${validSortFields.join(', ')}`
        });
        return;
    }

    // Validate status
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'completed', 'in_progress'];
    if (req.query.status && !validStatuses.includes(req.query.status as string)) {
        res.status(400).json({
            success: false,
            message: `status must be one of: ${validStatuses.join(', ')}`
        });
        return;
    }

    // Validate video_call_status
    const validVideoStatuses = ['not_started', 'in_progress', 'ended'];
    if (req.query.video_call_status && !validVideoStatuses.includes(req.query.video_call_status as string)) {
        res.status(400).json({
            success: false,
            message: `video_call_status must be one of: ${validVideoStatuses.join(', ')}`
        });
        return;
    }

    // Validate ObjectId fields
    const objectIdFields = ['customer_id', 'consultant_id'];
    for (const field of objectIdFields) {
        if (req.query[field] && !isValidObjectId(req.query[field] as string)) {
            res.status(400).json({
                success: false,
                message: `${field} must be a valid ObjectId`
            });
            return;
        }
    }

    // Validate boolean fields
    const booleanFields = ['has_feedback'];
    for (const field of booleanFields) {
        if (req.query[field] && !['true', 'false'].includes(req.query[field] as string)) {
            res.status(400).json({
                success: false,
                message: `${field} must be either "true" or "false"`
            });
            return;
        }
    }

    // Validate feedback_rating
    if (req.query.feedback_rating) {
        const rating = parseInt(req.query.feedback_rating as string);
        if (isNaN(rating) || rating < 1 || rating > 5) {
            res.status(400).json({
                success: false,
                message: 'feedback_rating must be an integer between 1 and 5'
            });
            return;
        }
    }

    const appointmentDateFrom = req.query.appointment_date_from || req.query.start_date;
    const appointmentDateTo = req.query.appointment_date_to || req.query.end_date;

    if (appointmentDateFrom && !isValidDate(appointmentDateFrom as string)) {
        res.status(400).json({
            success: false,
            message: 'appointment_date_from (or start_date) must be in YYYY-MM-DD format'
        });
        return;
    }

    if (appointmentDateTo && !isValidDate(appointmentDateTo as string)) {
        res.status(400).json({
            success: false,
            message: 'appointment_date_to (or end_date) must be in YYYY-MM-DD format'
        });
        return;
    }

    // Validate appointment date range
    if (appointmentDateFrom && appointmentDateTo) {
        const fromDate = new Date(appointmentDateFrom as string);
        const toDate = new Date(appointmentDateTo as string);

        if (fromDate > toDate) {
            res.status(400).json({
                success: false,
                message: 'appointment_date_from cannot be after appointment_date_to'
            });
            return;
        }
    }



    next();
};
/**
 * Validate STI Order pagination parameters
 */
export const validateStiOrderPagination = (req: Request, res: Response, next: NextFunction) => {
    try {
        console.log('🔍 [DEBUG] STI Order Validation - Raw query:', req.query);
        const query = req.query as StiOrderQuery;

        // Validate page parameter
        if (query.page !== undefined) {
            const page = parseInt(query.page.toString());
            if (isNaN(page) || page < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid page parameter. Must be a positive integer.'
                });
            }
        }

        // Validate limit parameter
        if (query.limit !== undefined) {
            const limit = parseInt(query.limit.toString());
            if (isNaN(limit) || limit < 1 || limit > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid limit parameter. Must be between 1 and 100.'
                });
            }
        }

        // Validate sort_order parameter
        if (query.sort_order !== undefined) {
            if (!['asc', 'desc'].includes(query.sort_order.toString())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid sort_order parameter. Must be either "asc" or "desc".'
                });
            }
        }

        // Validate order_status parameter
        if (query.order_status !== undefined) {
            const validStatuses = ['Booked', 'Accepted', 'Processing', 'SpecimenCollected', 'Testing', 'Completed', 'Canceled'];
            if (!validStatuses.includes(query.order_status.toString())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid order_status parameter. Must be one of: ${validStatuses.join(', ')}`
                });
            }
        }

        // Validate payment_status parameter
        if (query.payment_status !== undefined) {
            const validPaymentStatuses = ['Pending', 'Paid', 'Failed'];
            if (!validPaymentStatuses.includes(query.payment_status.toString())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid payment_status parameter. Must be one of: ${validPaymentStatuses.join(', ')}`
                });
            }
        }

        // Validate date parameters
        if (query.date_from !== undefined) {
            const dateFrom = new Date(query.date_from.toString());
            if (isNaN(dateFrom.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date_from parameter. Must be a valid date (YYYY-MM-DD).'
                });
            }
        }

        if (query.date_to !== undefined) {
            const dateTo = new Date(query.date_to.toString());
            if (isNaN(dateTo.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date_to parameter. Must be a valid date (YYYY-MM-DD).'
                });
            }
        }

        // Validate amount parameters
        if (query.min_amount !== undefined) {
            const minAmount = parseFloat(query.min_amount.toString());
            if (isNaN(minAmount) || minAmount < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid min_amount parameter. Must be a non-negative number.'
                });
            }
        }

        if (query.max_amount !== undefined) {
            const maxAmount = parseFloat(query.max_amount.toString());
            if (isNaN(maxAmount) || maxAmount < 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid max_amount parameter. Must be a non-negative number.'
                });
            }
        }

        // Validate date range logic
        if (query.date_from && query.date_to) {
            const dateFrom = new Date(query.date_from.toString());
            const dateTo = new Date(query.date_to.toString());

            if (dateFrom > dateTo) {
                return res.status(400).json({
                    success: false,
                    message: 'date_from cannot be later than date_to.'
                });
            }
        }

        // Validate amount range logic
        if (query.min_amount && query.max_amount) {
            const minAmount = parseFloat(query.min_amount.toString());
            const maxAmount = parseFloat(query.max_amount.toString());

            if (minAmount > maxAmount) {
                return res.status(400).json({
                    success: false,
                    message: 'min_amount cannot be greater than max_amount.'
                });
            }
        }

        console.log('✅ [DEBUG] STI Order Validation passed successfully');
        next();
    } catch (error) {
        console.error('❌ [DEBUG] Error in STI order validation:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during validation.'
        });
    }
};

/**
 * Validate Audit Log pagination parameters
 */
export const validateAuditLogPagination = (req: Request, res: Response, next: NextFunction) => {
    try {
        const query = req.query as AuditLogQuery;

        // Validate page parameter
        if (query.page !== undefined) {
            const page = parseInt(query.page.toString());
            if (isNaN(page) || page < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid page parameter. Must be a positive integer.'
                });
            }
        }

        // Validate limit parameter
        if (query.limit !== undefined) {
            const limit = parseInt(query.limit.toString());
            if (isNaN(limit) || limit < 1 || limit > 100) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid limit parameter. Must be between 1 and 100.'
                });
            }
        }

        // Validate sort_order parameter
        if (query.sort_order !== undefined) {
            if (!['asc', 'desc'].includes(query.sort_order.toString())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid sort_order parameter. Must be either "asc" or "desc".'
                });
            }
        }

        // Validate target_type parameter
        if (query.target_type !== undefined) {
            const validTargetTypes = ['StiOrder', 'StiPackage', 'StiTest'];
            if (!validTargetTypes.includes(query.target_type.toString())) {
                return res.status(400).json({
                    success: false,
                    message: `Invalid target_type parameter. Must be one of: ${validTargetTypes.join(', ')}`
                });
            }
        }

        // Validate date parameters
        if (query.date_from !== undefined) {
            const dateFrom = new Date(query.date_from.toString());
            if (isNaN(dateFrom.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date_from parameter. Must be a valid date (YYYY-MM-DD).'
                });
            }
        }

        if (query.date_to !== undefined) {
            const dateTo = new Date(query.date_to.toString());
            if (isNaN(dateTo.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid date_to parameter. Must be a valid date (YYYY-MM-DD).'
                });
            }
        }

        // Validate date range logic
        if (query.date_from && query.date_to) {
            const dateFrom = new Date(query.date_from.toString());
            const dateTo = new Date(query.date_to.toString());

            if (dateFrom > dateTo) {
                return res.status(400).json({
                    success: false,
                    message: 'date_from cannot be later than date_to.'
                });
            }
        }

        next();
    } catch (error) {
        console.error('Error in audit log validation:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error during validation.'
        });
    }
};



