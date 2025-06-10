import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { validateLogin, validateRegister} from '../middlewares/validation';
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

router.get('/profile', authenticateToken, async (req, res) => {
  try {
    // req.user được gán từ middleware authenticateToken
    // userId có thể là req.user.userId hoặc req.user.id tùy JWT
    const userId = (req.user as any).userId || (req.user as any).id;
    if (!userId) return res.status(401).json({ success: false, message: "Cannot verify user" });

    const user = await User.findById(userId).lean();
    if (!user) return res.status(404).json({ success: false, message: "Cannot find user" });

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        role: user.role,
        status: user.status,
        avatar: user.avatar
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Lỗi hệ thống" });
  }
});
// POST /startRegister - Gửi toàn bộ info + gửi OTP, lưu info tạm vào Redis
router.post('/register', async (req: Request, res: Response) => {
    try{
        const registerRequest: RegisterRequest = req.body;
        const result = await AuthService.register(registerRequest);
        if (result.success){
            res.status(200).json(result);
        }
        else res.status(400).json(result);
    } catch (error) {
        console.error('Start register error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});

// POST /verifyOTP - Xác thực OTP và insert vào DB nếu đúng
router.post('/verifyOTP', async (req: Request, res: Response) => {
    try{
        const { email, otp } = req.body;
        const result = await AuthService.verifyOTP(email, otp);
        if (result.success)
            return res.status(200).json(result);
        return res.status(400).json(result);
    } catch (error) {
        console.error('Verify OTP error:', error);
        return res.status(500).json({ success: false, message: 'Lỗi hệ thống' });
    }
});


router.put('/changePassword', authenticateToken, validateChangePassword, async (req: Request, res: Response): Promise<void> => {
    try {
        const changePasswordRequest: ChangePasswordRequest = req.body;
        const userId = (req.user as any).userId;
        //chỉ nhận vào old_password và new_password
        const {old_password, new_password} = changePasswordRequest;

        // Change password
        const result = await AuthService.changePasswordForUsers(
            userId,
            old_password,
            new_password,
        );

        if (!result.success){
            res.status(400).json(result);
        }
        else res.status(200).json(result);

    } catch (error) {
        console.error('Change password error:', error);
        
        if (error instanceof Error) {
            res.status(400).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'Internal server error' });
        }
    }
});

export default router;
