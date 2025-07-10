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
        console.log(result);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Login controller error:', error);
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
                console.error('Google callback error:', error);
                res.redirect(failedRedirectedUrl);
            }
        })
    } catch (error){
        console.error('Google callback error:', error);
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
        console.error('Create Google Meet error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi tạo Google Meet: ' + error.message
        });
    }
});

router.get('/getUserProfile', authenticateToken, async (req, res) => {
    try {
        // req.jwtUser được gán từ middleware authenticateToken
        const userId = req.jwtUser?.userId;
        if (!userId) {
            return res.status(401).json({
                success: false,
                message: "Cannot verify user"
            });
        }

        const user = await User.findById(userId).lean<IUser>();
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "Cannot find user"
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                date_of_birth: user.date_of_birth,
                gender: user.gender,
                role: user.role,
                status: user.status,
                avatar: user.avatar
            }
        });
    } catch (error) {
        console.error('Profile endpoint error:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi hệ thống"
        });
    }
});

// Các endpoints khác giữ nguyên...
router.post('/register', validateRegister, async (req: Request, res: Response) => {
    try {
        const registerRequest: RegisterRequest = req.body;
        const result = await AuthService.register(registerRequest);
        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Register controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

// POST /verifyOTP - Xác thực OTP và insert vào DB nếu đúng
router.post('/verifyOTP', async (req: Request, res: Response) => {
    try {
        console.log('VerifyOTP endpoint called with body:', req.body);
        const { email, otp } = req.body;

        if (!email || !otp) {
            console.log('Missing email or otp in request');
            return res.status(400).json({
                success: false,
                message: 'Email và OTP là bắt buộc'
            });
        }

        const result = await AuthService.verifyOTP(email, otp);
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Verify OTP controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});


// Route cũ đã có sẵn sử dụng PUT method:
// router.put('/changePassword', authenticateToken, validateChangePassword, ...)

// Chỉ cần sửa nhỏ trong route verification và create-google-meet

router.post('/forgot-password', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email là bắt buộc'
            });
        }

        // Tạm thời trả về message, hoặc implement forgot password logic
        res.status(200).json({
            success: true,
            message: 'Forgot password feature will be implemented soon. Please contact support.'
        });
    } catch (error) {
        console.error('Forgot password controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

export default router;