import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { validateLogin } from '../middlewares/validation';
import { UserRepository } from '../repositories/userRepository';
import passport from '../configs/passport';
import { User } from '../models/User';
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

// Protected route example - chỉ user đã login mới truy cập được
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
        const user = await UserRepository.findByEmail(req.user!.email);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User không tồn tại'
            });
        }

        res.json({
            success: true,
            user: {
                id: user._id.toString(),
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                date_of_birth: user.date_of_birth,
                gender: user.gender,
                role: user.role,
                status: user.status,
                email_verified: user.email_verified
            }
        });
    } catch (error) {
        console.error('Profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});

// Admin only route example
router.get('/admin/users', authenticateToken, authorizeRoles('admin'), async (req: Request, res: Response) => {
    try {
        // Logic lấy danh sách users cho admin
        res.json({
            success: true,
            message: 'Admin access granted',
            users: [] // Danh sách users
        });
    } catch (error) {
        console.error('Admin users error:', error);
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

//gửi data lên frontend đăng ký lên frontend
router.post('/google/register', (req, res) => {
    if (!req.user) {
        return res.status(401).json({ error: 'User is null' });
    }
    console.log(res.status(200).json(req.user));
    return res.status(200).json(req.user);
})

router.get('/google/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return res.status(500).json({ error: 'Error logging out' });
        }
        res.redirect('/');
    });
})

//register by my app
declare module 'express-session' {
    interface SessionData {
        tempUser?: {
            email: string;
            password: string;
        };
    }
}

router.get('/registerForm', (req, res) => {
    res.send(`
        <form method="POST" action="/api/auth/register">
            <input name="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <input name="confirm_password" type="password" placeholder="Confirm password" required />
            <button type="submit">Register</button>
        </form>
    `);
});

export default router;