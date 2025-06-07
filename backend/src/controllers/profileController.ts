import { Router, Request, Response} from 'express';
import {authenticateToken, authorizeRoles} from '../middlewares/jwtMiddleware';
import {upload} from '../configs/avatarUpload';
import { ProfileService } from '../services/profileService';
import { ProfileRequest } from '../dto/requests/ProfileRequest';
import { ProfileResponse } from '../dto/responses/ProfileResponse';
const router = Router();

//update profile API
router.put('/updateUserProfile', authenticateToken, upload.single('avatar'), async (req: Request, res: Response): Promise<ProfileResponse> => {
    try {
        const userId = (req.user as any)?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const profileRequest: ProfileRequest  = req.body;

        let avatarError: string;
        if ((req as any).fileValidationError){
            avatarError = (req as any).fileValidationError;
        }
        const result: ProfileResponse = await ProfileService.updateProfile(userId, profileRequest, avatarError, req.file);
        if (result.success)
            res.status(200).json(result);
        else res.status(401).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error when updating profile',
        });
    }
});
export default router;