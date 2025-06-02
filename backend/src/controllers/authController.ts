import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { validateLogin, validateRegister} from '../middlewares/validation';
import { UserRepository } from '../repositories/userRepository';
import passport from '../configs/passport';
import redisClient from '../configs/redis';
import { User } from '../models/User';
import { RegisterRequest } from '../dto/requests/RegisterRequest';
import { RegisterResponse } from '../dto/responses/RegisterResponse';

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
})                                                                

//gửi data lên frontend đăng ký lên frontend
router.post('/google/register', (req, res) => {
    if (!req.user){
        return res.status(401).json({error: 'User is null'});
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

router.get('/registerForm', (req, res) => {
    res.send(`
        <form method="POST" action="/api/auth/register">
            <input name="email" placeholder="Email" required />
            <input name="password" type="password" placeholder="Password" required />
            <input name="confirm_password" type="password" placeholder="Confirm password" required />
            <input name="full_name" placeholder="Họ và tên" required /><br><br>
            <input name="phone" placeholder="Số điện thoại" required /><br><br>
            <input name="date_of_birth" type="date" placeholder="Ngày sinh" required /><br><br>
            <select name="gender">
                <option value="">-- Chọn giới tính --</option>
                <option value="male">Nam</option>
                <option value="female">Nữ</option>
                <option value="other">Khác</option>
            </select><br><br>
            <button type="submit">Register</button>
        </form>
    `);
});

router.post('/register', validateRegister, async (req: Request, res: Response) => {
    try {
        const registerRequest: RegisterRequest = req.body;
        console.log('Request body:', req.body);
        const result = await AuthService.register(registerRequest);
        if (result.success) {
            // res.status(200).json(result);
            res.redirect(`/api/auth/otpForm?email=${registerRequest.email}`);
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
        // console.log("Email nhận OTP:", email);

        if (!email) {
            return res.status(400).send("Thiếu email.");
        }

        const otp = await AuthService.sendOTP(email);
        await redisClient.setEx(`otp:${email}`, 300, otp);
        res.send(`
            <form method="POST" action="/api/auth/verifyOTP">
                <label>Nhập mã OTP đã gửi đến email:</label><br><br>
                <input type="hidden" name="email" value="${email}" />
                <input name="otp" maxlength="6" required /><br><br>
                <button type="submit">Xác thực</button>
            </form>
        `);
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
        const storedOtp = await redisClient.get(`otp:${email}`);
        console.log(storedOtp);
        console.log(otp);
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
        const user = await redisClient.get(`user:${email}`);
        await AuthService.insertByMyApp(user.toString());
        console.log('Insert thành công');
        await redisClient.del(`usser:${email}`);
        res.status(200).json({
            success: true, 
            message: 'Email verified successfully'
        })
    } catch (error) {
        console.error('Login controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi hệ thống'
        });
    }
});
export default router;