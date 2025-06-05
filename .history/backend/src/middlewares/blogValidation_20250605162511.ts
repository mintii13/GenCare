import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';

export const validateObjectId = (paramName: string) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const id = req.params[paramName];

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).json({
                success: false,
                message: `${paramName} is invalid`
            });
        }

        next();
    };
};