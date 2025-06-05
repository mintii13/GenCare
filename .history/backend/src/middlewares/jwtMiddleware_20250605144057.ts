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

// Cách khác để extend Request type
interface AuthenticatedRequest extends Request {
    user: JWTPayload;
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

    // Đảm bảo req.user được gán đúng cách
    (req as any).user = decoded;
    console.log('req.user sau khi gán:', (req as any).user);
    next();
};

/**
 * Middleware kiểm tra role
 */
export const authorizeRoles = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        const user = (req as any).user;
        console.log('authorizeRoles - req.user:', user);
        console.log('authorizeRoles - required roles:', roles);

        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Chưa được xác thực',
                debug: {
                    userExists: !!user,
                    requiredRoles: roles
                }
            });
            return;
        }

        console.log('authorizeRoles - user role:', user.role);

        if (!roles.includes(user.role)) {
            res.status(403).json({
                success: false,
                message: 'Không có quyền truy cập',
                debug: {
                    userRole: user.role,
                    requiredRoles: roles,
                    hasPermission: roles.includes(user.role)
                }
            });
            return;
        }

        next();
    };
};