// src/middlewares/userValidation.ts
import { Request, Response, NextFunction } from 'express';

export const validateCreateUser = (req: Request, res: Response, next: NextFunction) => {
    const { email, full_name, role } = req.body;
    const errors: string[] = [];

    // Email validation
    if (!email) {
        errors.push('Email là bắt buộc');
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push('Email không hợp lệ');
    }

    // Full name validation
    if (!full_name) {
        errors.push('Họ và tên là bắt buộc');
    } else if (full_name.trim().length < 2) {
        errors.push('Họ và tên phải có ít nhất 2 ký tự');
    }

    // Role validation
    const validRoles = ['customer', 'consultant', 'staff', 'admin'];
    if (!role) {
        errors.push('Vai trò là bắt buộc');
    } else if (!validRoles.includes(role)) {
        errors.push('Vai trò không hợp lệ');
    }

    // Phone validation (optional)
    if (req.body.phone && !/^[0-9]{10,11}$/.test(req.body.phone)) {
        errors.push('Số điện thoại không hợp lệ (10-11 chữ số)');
    }

    // Gender validation (optional)
    if (req.body.gender && !['male', 'female', 'other'].includes(req.body.gender)) {
        errors.push('Giới tính không hợp lệ');
    }

    // Password validation (optional for admin creating users)
    if (req.body.password && req.body.password.length < 6) {
        errors.push('Mật khẩu phải có ít nhất 6 ký tự');
    }

    // Date of birth validation (optional)
    if (req.body.date_of_birth) {
        const dob = new Date(req.body.date_of_birth);
        const now = new Date();
        const minAge = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
        const maxAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());

        if (isNaN(dob.getTime())) {
            errors.push('Ngày sinh không hợp lệ');
        } else if (dob < minAge || dob > maxAge) {
            errors.push('Tuổi phải từ 13-100');
        }
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors
        });
    }

    next();
};

export const validateUpdateUser = (req: Request, res: Response, next: NextFunction) => {
    const errors: string[] = [];

    // Email validation (if provided)
    if (req.body.email !== undefined) {
        if (!req.body.email) {
            errors.push('Email không được để trống');
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(req.body.email)) {
            errors.push('Email không hợp lệ');
        }
    }

    // Full name validation (if provided)
    if (req.body.full_name !== undefined) {
        if (!req.body.full_name) {
            errors.push('Họ và tên không được để trống');
        } else if (req.body.full_name.trim().length < 2) {
            errors.push('Họ và tên phải có ít nhất 2 ký tự');
        }
    }

    // Role validation (if provided)
    if (req.body.role !== undefined) {
        const validRoles = ['customer', 'consultant', 'staff', 'admin'];
        if (!validRoles.includes(req.body.role)) {
            errors.push('Vai trò không hợp lệ');
        }
    }

    // Phone validation (if provided)
    if (req.body.phone !== undefined && req.body.phone !== null && req.body.phone !== '') {
        if (!/^[0-9]{10,11}$/.test(req.body.phone)) {
            errors.push('Số điện thoại không hợp lệ (10-11 chữ số)');
        }
    }

    // Gender validation (if provided)
    if (req.body.gender !== undefined && req.body.gender !== null && req.body.gender !== '') {
        if (!['male', 'female', 'other'].includes(req.body.gender)) {
            errors.push('Giới tính không hợp lệ');
        }
    }

    // Password validation (if provided)
    if (req.body.password !== undefined && req.body.password !== null && req.body.password !== '') {
        if (req.body.password.length < 6) {
            errors.push('Mật khẩu phải có ít nhất 6 ký tự');
        }
    }

    // Date of birth validation (if provided)
    if (req.body.date_of_birth !== undefined && req.body.date_of_birth !== null && req.body.date_of_birth !== '') {
        const dob = new Date(req.body.date_of_birth);
        const now = new Date();
        const minAge = new Date(now.getFullYear() - 100, now.getMonth(), now.getDate());
        const maxAge = new Date(now.getFullYear() - 13, now.getMonth(), now.getDate());

        if (isNaN(dob.getTime())) {
            errors.push('Ngày sinh không hợp lệ');
        } else if (dob < minAge || dob > maxAge) {
            errors.push('Tuổi phải từ 13-100');
        }
    }

    // Status validation (if provided)
    if (req.body.status !== undefined && typeof req.body.status !== 'boolean') {
        errors.push('Trạng thái phải là boolean');
    }

    // Email verified validation (if provided)
    if (req.body.email_verified !== undefined && typeof req.body.email_verified !== 'boolean') {
        errors.push('Trạng thái xác thực email phải là boolean');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Dữ liệu không hợp lệ',
            errors
        });
    }

    next();
};