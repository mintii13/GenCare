import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { validateLogin, validateRegister } from '../middlewares/validation';
import { UserRepository } from '../repositories/userRepository';
import passport from '../configs/passport';
import redisClient from '../configs/redis';
import { User, IUser } from '../models/User';
import { RegisterRequest } from '../dto/requests/RegisterRequest';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { JWTUtils } from '../utils/jwtUtils';
import { ChangePasswordRequest } from '../dto/requests/ChangePasswordRequest';
import { ChangePasswordResponse } from '../dto/responses/ChangePasswordResponse';
import { validateChangePassword } from '../middlewares/validateChangePassword';
import { GoogleMeetService } from '../services/googleMeetService';
import mongoose from 'mongoose'; // Thêm import này

const router = Router();

// Check email endpoint
router.post('/check-email', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email là bắt buộc'
            });
        }

        const user = await UserRepository.findByEmail(email);
        res.json({
            success: true,
            exists: !!user
        });
    } catch (error) {
        console.error('Check email error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

// Login endpoint - Updated để trả về access token
router.post('/login', validateLogin, async (req: Request, res: Response) => {
    try {
        const loginRequest: LoginRequest = req.body;
        const result = await AuthService.login(loginRequest);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

// Logout endpoint - với JWT thì client chỉ cần xóa token
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
    // Với JWT, logout chỉ cần client xóa token
    // Server có thể log việc logout này nếu cần
    res.json({
        success: true,
        message: 'Đăng xuất thành công'
    });
});

// Thêm scope Calendar API để có quyền tạo Google Meet
router.get(
    '/google/verify',
    passport.authenticate('google', {
        scope: [
            "openid",
            "profile",
            "email",
            "https://www.googleapis.com/auth/calendar",
            "https://www.googleapis.com/auth/calendar.events"
        ]
    })
);

router.get('/google/callback', async (req, res) => {
    try {
        const failedRedirectedUrl = `${process.env.APP_URL || 'http://localhost:5173'}`;
        if (req.query.error === 'access_denied'){
            //if cancel the google, return to home page
            return res.redirect(failedRedirectedUrl);
        }
        return passport.authenticate('google', { failureRedirect: failedRedirectedUrl})(req, res, async() =>{
            try {
                const userWithToken = req.user as any; // User có chứa googleAccessToken

                if (!userWithToken) {
                    return res.redirect(failedRedirectedUrl);
                }

                // Tạo JWT token cho app
                const jwtAccessToken = JWTUtils.generateAccessToken({
                    userId: userWithToken._id.toString(),
                    role: userWithToken.role
                });

                // Redirect với cả JWT token và Google Access Token
                const redirectUrl = `${process.env.FRONTEND_URL ?? 'http://localhost:5173'}/oauth-success?token=${jwtAccessToken}&googleToken=${userWithToken.googleAccessToken}`;
                res.redirect(redirectUrl);
            } catch (error) {
                    res.redirect(failedRedirectedUrl);
            }
        })
    } catch (error){
    }
});

// Endpoint để tạo Google Meet với Google Access Token
router.post('/create-google-meet', authenticateToken, async (req: Request, res: Response) => {
    try {
        const { title, startTime, endTime, attendees, googleAccessToken } = req.body;

        if (!googleAccessToken) {
            return res.status(400).json({
                success: false,
                message: 'Google Access Token is required'
            });
        }

        const meetingDetails = await GoogleMeetService.createMeetingWithAccessToken(
            title,
            new Date(startTime),
            new Date(endTime),
            attendees,
            googleAccessToken
        );

        // Trả về thông tin meeting và JWT token mới
        const newJwtToken = JWTUtils.generateAccessToken({
            userId: req.jwtUser?.userId,
            role: req.jwtUser?.role
        });

        res.json({
            success: true,
            meetingDetails,
            accessToken: newJwtToken // Token mới để lưu vào localStorage
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo Google Meet: ' + error.message
        });
    }
});

// Các endpoints khác giữ nguyên...
router.post('/register', validateRegister, async (req: Request, res: Response) => {
    try {
        const registerRequest: RegisterRequest = req.body;
        const result = await AuthService.register(registerRequest);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

// POST /verifyOTP - Xác thực OTP và insert vào DB nếu đúng
router.post('/verifyOTP', async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and otp are required'
            });
        }

        const result = await AuthService.verifyOTPForRegister(email, otp);
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('OTP verification error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error'
        });
    }
});

router.put('/change-password', authenticateToken, validateChangePassword, async (req: Request, res: Response) => {
    try {
        const userId = req.jwtUser?.userId;
        const {old_password, new_password} = req.body;
        if (!userId) {
            return res.status(400).json({
                success: false,
                message: 'User id is required'
            });
        }
        const result = await AuthService.changePasswordForUsers(userId, old_password, new_password);
        if (result.success){
            res.status(200).json(result);
        }
        else res.status(400).json(result);
        
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
})

// Chỉ cần sửa nhỏ trong route verification và create-google-meet
router.post('/forgot-password/request', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
            });
        }
        const result = await AuthService.forgotPasswordAndSendOTP(email);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

router.post('/forgot-password/verify', async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Email and otp are required'
            });
        }

        const result = await AuthService.verifyOTPForForgotPassword(email, otp);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

router.post('/forgot-password/reset', async (req: Request, res: Response) => {
    try {
        const { email, new_password } = req.body;

        if (!email || !new_password) {
            return res.status(400).json({ 
                success: false, 
                message: 'Email and new password are required' 
            });
        }
        const result = await AuthService.resetPasswordAfterOTP(email, new_password);
        if (result.success){
            res.status(200).json(result);
        }
        else res.status(400).json(result)
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Internal server error' 
        });
    }
});

export default router;