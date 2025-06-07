import { Request, Response, NextFunction } from 'express';
import { JWTUtils, JWTPayload } from '../utils/jwtUtils';

// Extend Express Request interface để thêm user info
declare global {
    namespace Express {
        interface Request {
            User?: JWTPayload;
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
            message: 'Access token là bắt buộc',
            debug: {
                authHeader: authHeader,
                hasToken: !!token
            }
        });
        return;
    }

    const decoded = JWTUtils.verifyToken(token);

    if (!decoded) {
        res.status(403).json({
            success: false,
            message: 'Token không hợp lệ hoặc đã hết hạn',
            debug: {
                token: token?.substring(0, 20) + '...', // Chỉ hiển thị một phần token
                decoded: decoded
            }
        });
        return;
    }

    req.user = decoded;
    next();
};

/**
 * Middleware kiểm tra role
 */
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        if (!req.user) {
            res.status(401).json({
                success: false,
                message: 'Chưa được xác thực',
                debug: {
                    userExists: !!req.user,
                    requiredRoles: roles
                }
            });
            return;
        }

        if (!roles.includes(req.User.role)) {
            res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập',
                debug: {
                    userRole: req.User.role,
                    requiredRoles: roles,
                    hasPermission: roles.includes(req.User.role)
                }
            });
            return;
        }

        next();
    };
};