import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { validateLogin, validateRegister } from '../middlewares/validation';
import { UserRepository } from '../repositories/userRepository';
import passport from '../configs/passport';
import redisClient from '../configs/redis';
import { User, IUser } from '../models/User';
import { RegisterRequest } from '../dto/requests/RegisterRequest';
import { RegisterResponse, VerificationResponse } from '../dto/responses/RegisterResponse';
import { authenticateToken, authorizeRoles } from '../middlewares/jwtMiddleware';
import { JWTUtils } from '../utils/jwtUtils';
const router = Router();

// Check email endpoint
router.post('/check-email', async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required'
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
            message: 'System error'
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
            message: 'System error'
        });
    }
});

// Logout endpoint - với JWT thì client chỉ cần xóa token
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
    // Với JWT, logout chỉ cần client xóa token
    // Server có thể log việc logout này nếu cần
    res.json({
        success: true,
        message: 'Logged out successfully'
    });
});

//hàm này là khi truy cập vào đường dẫn này sẽ tiến hành xác thực vs google
router.get(
    '/google/verify', passport.authenticate('google', { scope: ["openid", "profile", "email"] })
);

//thực hiện bước đổi code lấy token như đã thiết lập trên google Strategy
router.get(
    '/google/callback',
    passport.authenticate('google', { failureRedirect: "/" }),
    async (req, res) => {
        const user = req.user as IUser;
        const accessToken = JWTUtils.generateAccessToken({
            userId: user._id.toString(),
            role: user.role
        });
        redisClient.setEx('accessTokenGoogle', 300, accessToken);
        res.redirect(`http://localhost:5173/oauth-success?token=${accessToken}`);
    }
);

//send data on frontend
router.post('/google/register', async (req, res) => {

    try {
        const user = req.user as IUser;
        if (!user) {
            return res.status(401).json({ error: 'User does not exist' });
        }
        const result = await AuthService.loginGoogle(user);
        // Không cần lấy từ Redis nữa vì AuthService.loginGoogle đã generate token
        console.log(res.json(result));
        return res.status(200).json(result);
    } catch (error) {
        console.error('Login controller error:', error);
        res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
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
            message: 'System error'
        });
    }
});

router.get('/otpForm', async (req: Request, res: Response) => {
    try {
        const email = req.query.email as string;
        if (!email) {
            return res.status(400).send("Email is missing.");
        }
        const otp = await AuthService.sendOTP(email);
        await redisClient.setEx(`otp:${email}`, 300, otp);
        return res.status(200).send("OTP sent successfully");
    } catch (error) {
        console.error('Controller error:', error);
        res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

router.post('/verifyOTP', async (req: Request, res: Response) => {
    try {
        const { email, otp } = req.body;
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
            return res.status(400).json({ success: false, message: "Password not found." });
        const loginRequest: LoginRequest = { email, password };
        const result = await AuthService.login(loginRequest);
        console.log("Login successful");
        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(401).json(result);
        }

    } catch (error) {
        console.error('Login controller error:', error);
        res.status(500).json({
            success: false,
            message: 'System error'
        });
    }
});

export default router;