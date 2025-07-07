import { Request, Response, NextFunction } from 'express';

/**
 * Validate appointment history query parameters
 */
export const validateAppointmentHistoryQuery = (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate action if provided
    if (req.query.action) {
        const validActions = ['created', 'confirmed', 'rescheduled', 'cancelled', 'completed', 'updated', 'started'];
        if (!validActions.includes(req.query.action as string)) {
            errors.push(`Invalid action. Must be one of: ${validActions.join(', ')}`);
        }
    }

    // Validate performed_by_role if provided
    if (req.query.performed_by_role) {
        const validRoles = ['customer', 'consultant', 'staff', 'admin'];
        if (!validRoles.includes(req.query.performed_by_role as string)) {
            errors.push(`Invalid performed_by_role. Must be one of: ${validRoles.join(', ')}`);
        }
    }

    // Validate appointment_id if provided (should be valid MongoDB ObjectId)
    if (req.query.appointment_id) {
        const appointmentId = req.query.appointment_id as string;
        if (!/^[0-9a-fA-F]{24}$/.test(appointmentId)) {
            errors.push('Invalid appointment_id format');
        }
    }

    // Validate performed_by_user_id if provided (should be valid MongoDB ObjectId)
    if (req.query.performed_by_user_id) {
        const userId = req.query.performed_by_user_id as string;
        if (!/^[0-9a-fA-F]{24}$/.test(userId)) {
            errors.push('Invalid performed_by_user_id format');
        }
    }

    // Validate date_from if provided
    if (req.query.date_from) {
        const dateFrom = new Date(req.query.date_from as string);
        if (isNaN(dateFrom.getTime())) {
            errors.push('Invalid date_from format. Use YYYY-MM-DD');
        }
    }

    // Validate date_to if provided
    if (req.query.date_to) {
        const dateTo = new Date(req.query.date_to as string);
        if (isNaN(dateTo.getTime())) {
            errors.push('Invalid date_to format. Use YYYY-MM-DD');
        }
    }

    // Validate date range
    if (req.query.date_from && req.query.date_to) {
        const dateFrom = new Date(req.query.date_from as string);
        const dateTo = new Date(req.query.date_to as string);
        if (dateFrom > dateTo) {
            errors.push('date_from cannot be later than date_to');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid query parameters',
            errors
        });
    }

    next();
};

/**
 * Validate cleanup history request
 */
export const validateCleanupHistory = (req: Request, res: Response, next: NextFunction) => {
    const { before_date } = req.body;
    const errors: string[] = [];

    // Check if before_date is provided
    if (!before_date) {
        errors.push('before_date is required');
    } else {
        // Validate date format
        const date = new Date(before_date);
        if (isNaN(date.getTime())) {
            errors.push('Invalid before_date format. Use YYYY-MM-DD');
        } else {
            // Check if date is not in the future
            const now = new Date();
            if (date > now) {
                errors.push('before_date cannot be in the future');
            }

            // Check if date is not too recent (e.g., at least 30 days old)
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            if (date > thirtyDaysAgo) {
                errors.push('before_date must be at least 30 days old for safety');
            }
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid cleanup request',
            errors
        });
    }

    next();
};

/**
 * Validate stats query parameters
 */
export const validateStatsQuery = (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Validate start_date if provided
    if (req.query.start_date) {
        const startDate = new Date(req.query.start_date as string);
        if (isNaN(startDate.getTime())) {
            errors.push('Invalid start_date format. Use YYYY-MM-DD');
        }
    }

    // Validate end_date if provided
    if (req.query.end_date) {
        const endDate = new Date(req.query.end_date as string);
        if (isNaN(endDate.getTime())) {
            errors.push('Invalid end_date format. Use YYYY-MM-DD');
        }
    }

    // Validate date range
    if (req.query.start_date && req.query.end_date) {
        const startDate = new Date(req.query.start_date as string);
        const endDate = new Date(req.query.end_date as string);
        if (startDate > endDate) {
            errors.push('start_date cannot be later than end_date');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Invalid stats query parameters',
            errors
        });
    }

    next();
};