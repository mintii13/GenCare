import { Router, Request, Response } from 'express';
import { AuthService, LoginCredentials } from '../service/authService';
import { validateLogin } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Login endpoint
router.post('/login', validateLogin, async (req: Request, res: Response) => {
    try {
        const credentials: LoginCredentials = req.body;
        const result = await AuthService.login(credentials);

        if (result.success) {
            res.status(200).json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Login controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Get user profile endpoint
router.get('/profile', authenticateToken, async (req: Request, res: Response) => {
    try {
        const userId = (req as any).user.user_id;
        const profile = await AuthService.getUserProfile(userId);

        if (profile) {
            res.status(200).json({
                success: true,
                data: profile
            });
        } else {
            res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }
    } catch (error) {
        console.error('Profile controller error:', error);
        res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Logout endpoint (client-side token removal)
router.post('/logout', authenticateToken, (req: Request, res: Response) => {
    res.status(200).json({
        success: true,
        message: 'Logout successful'
    });
});

export default router;