import { Request, Response, NextFunction } from 'express';
import { IUser } from '../models/User';

export const authorizeRoles = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const user = req.user as IUser;

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Unauthorized - User not authenticated'
            });
        }

        if (!roles.includes(user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Forbidden - User does not have required role'
            });
        }

        next();
    };
}; 