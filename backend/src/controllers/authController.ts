import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { validateLogin} from '../middlewares/validation';
import { UserRepository } from '../repositories/userRepository';
import passport from '../configs/passport';
import { User } from '../models/User';
import { isAuthenticated } from '../middlewares/errorHandler';
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

// Login endpoint
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

//hàm này là khi truy cập vào đường dẫn này sẽ tiến hành xác thực vs google
router.get(
  '/google/verify',  passport.authenticate('google', {scope: ["openid", "profile", "email"]})
);

//thực hiện bước đổi code lấy token như đã thiết lập trên google Strategy
router.get('/google/callback', passport.authenticate('google', {failureRedirect: "/"}), (req, res) => {
    console.log('User after login:', req.user); // check xem user có không
    res.redirect('/api/auth/profile');
})                                                                

// router.post('/register', (req, res) => {
//     if (!req.user){
//         return res.status(401).json({error: 'User is null'});
//     }
//     console.log(res.status(200).json(req.user));
//     return res.status(200).json(req.user);
// })

router.get('/profile', (req, res) => {
    res.send(`<h1>Logged in</h1><form action="/api/auth/register" method="post"><button type="submit">Get Profile</button></form>`);
});                 //nếu cần xuất thông tin, ko thì thôi.

router.get('/google/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Error logging out' });
    }
    res.redirect('/');
  });
})

router.post('/register', isAuthenticated, (req, res) => {
  res.status(200).json(req.user);
});

export default router;