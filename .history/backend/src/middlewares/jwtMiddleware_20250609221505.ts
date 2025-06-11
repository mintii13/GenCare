import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '../utils/jwtUtils';

// Extend Express Request interface để thêm user info
declare global {
    namespace Express {
        interface Request {
            user?: any; // Use any type to avoid conflicts
        }
    }
}

/**
 * Middleware xác thực JWT token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Access token là bắt buộc'
        });
        return;
    }

    const decoded = JWTUtils.verifyToken(token);

    if (!decoded) {
        res.status(403).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn'
        });
        return;
    }

    // Đảm bảo req.user được gán đúng cách
    req.user = decoded;
    next();
};

/**
 * Middleware kiểm tra role
 */
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = req.user as JWTPayload;

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Chưa được xác thực'
            });
            return;
        }

        if (!roles.includes(user.role)) {
            res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
            return;
        }

        next();
    };
};