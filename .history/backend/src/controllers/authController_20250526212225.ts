import { Router, Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { LoginRequest } from '../dto/requests/LoginRequest';
import { validateLogin } from '../middlewares/validation';

const router = Router();

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

export default router;