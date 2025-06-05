import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '../utils/jwtUtils';

// Extend Express Request interface để thêm user info
declare global {
    namespace Express {
        interface Request {
            user?: JWTPayload;
        }
    }
}

/**
 * Middleware xác thực JWT token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    console.log('Auth header:', authHeader);
    console.log('Token:', token);

    if (!token) {
        res.status(401).json({
            success: false,
            message: 'Access token là bắt buộc'
        });
        return;
    }

    const decoded = JWTUtils.verifyToken(token);
    console.log('Decoded token:', decoded);

    if (!decoded) {
        res.status(403).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn'
        });
        return;
    }

    req.user = decoded;
    console.log('req.user set to:', req.user);
    next();
};

/**
 * Middleware kiểm tra role
 */
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        console.log('authorizeRoles - req.user:', req.user);
        console.log('authorizeRoles - required roles:', roles);

        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Chưa được xác thực'
            });
            return;
        }

        console.log('authorizeRoles - user role:', req.user.role);

        if (!roles.includes(req.user.role)) {
            res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập'
            });
            return;
        }

        next();
    };
};