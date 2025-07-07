import { Request, Response, NextFunction } from 'express';

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



