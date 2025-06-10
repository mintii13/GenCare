import { Request, Response, NextFunction } from "express";
import Joi from 'joi';

//kiểm tra new_password phải khác old_password
const schema = Joi.object({
    old_password: Joi.string().required(),
    new_password: Joi.string().required().invalid(Joi.ref('old_password')).messages({
        'any.invalid': 'new_password must be different from old_password'
    })
});

export const validateChangePassword = (req: Request, res: Response, next: NextFunction) => {
    const { error } = schema.validate(req.body, { abortEarly: false });

    if (error) {
        const details = error.details.map((err) => err.message);
        return res.status(400).json({
            error: 'Validation failed',
            details
        });
    }

    next();
};