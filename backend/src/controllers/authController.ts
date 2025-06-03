import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { validateLogin, validateRegister} from '../middlewares/validation';
import { UserRepository } from '../repositories/userRepository';
import passport from '../configs/passport';
import redisClient from '../configs/redis';
import { User } from '../models/User';
import { RegisterRequest } from '../dto/requests/RegisterRequest';
import { RegisterResponse, VerificationResponse } from '../dto/responses/RegisterResponse';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';

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

//hàm này là khi truy cập vào đường dẫn này sẽ tiến hành xác thực vs google
router.get(
    '/google/verify', passport.authenticate('google', { scope: ["openid", "profile", "email"] })
);

//thực hiện bước đổi code lấy token như đã thiết lập trên google Strategy
router.get('/google/callback', passport.authenticate('google', { failureRedirect: "/" }), (req, res) => {
    console.log('User after login:', req.user); // check xem user có không
})

//send data on frontend
router.post('/google/register', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User is null' });
    }
    console.log(res.status(200).json(req.user));
    return res.status(200).json(req.user);
})

//register by my app

router.post('/register', validateRegister, async (req: Request, res: Response) => {
    try {
        const registerRequest: RegisterRequest = req.body;
        console.log('Request body:', req.body);
        const result = await AuthService.register(registerRequest);
        if (result.success) {
            res.status(200).json(result);
            // res.redirect(`/api/auth/otpForm?email=${registerRequest.email}`);
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

router.get('/otpForm', async (req: Request, res: Response) => {
    try {
        const email = req.query.email as string;
        if (!email) {
            return res.status(400).send("Thiếu email.");
        }
        const otp = await AuthService.sendOTP(email);
        await redisClient.setEx(`otp:${email}`, 300, otp);
        return res.status(200).send("Send OTP thành công");
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

router.post('/verifyOTP', async (req: Request, res: Response) => {
    try {
        const {email, otp} = req.body;
        console.log(email, otp);
        const storedOtp = await redisClient.get(`otp:${email}`);
        console.log(storedOtp, otp);
        if (!storedOtp)
            return res.status(400).json({
                success: false,
                message: 'OTP expired or not found.' 
            }
        );
        if (otp !== storedOtp)
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP' 
            })

        await redisClient.del(`otp:${email}`);
        const user = (await redisClient.get(`user:${email}`));
        await AuthService.insertByMyApp(user.toString());
        await redisClient.del(`user:${email}`);
        const password = (await redisClient.get(`pass:${email}`)).toString();
        if (!password) 
            return res.status(400).json({ success: false, message: "Không tìm thấy mật khẩu." });
        const loginRequest: LoginRequest = {email, password};
        const result = await AuthService.login(loginRequest);
        console.log("Login thành công");
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
export default router;
