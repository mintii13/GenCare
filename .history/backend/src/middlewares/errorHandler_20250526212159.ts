import { Request, Response, NextFunction } from 'express';

export const errorHandler = (
    error: Error,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error('Error:', error);

    if (res.headersSent) {
        return next(error);
    }

    res.status(500).json({
        success: false,
        message: 'Lỗi hệ thống',
        ...(process.env.NODE_ENV === 'development' && { error: error.message })
    });
};