import { Router, Request, Response} from 'express';
import {authenticateToken, authorizeRoles} from '../middlewares/jwtMiddleware';
import {upload} from '../configs/avatarUpload';
import { ProfileService } from '../services/profileService';
import { ProfileRequest } from '../dto/requests/ProfileRequest';
import { ProfileResponse } from '../dto/responses/ProfileResponse';
const router = Router();

//get profile API
router.get('/getUserProfile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any)?.userId;
        const result = await ProfileService.getProfile(userId);
        if (result.success)
            res.status(200).json(result);
        else{
            res.status(404).json(result);
        }
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error when getting profile',
        });
        throw error;
    }
})


//update profile API
router.put('/updateUserProfile', authenticateToken, upload.single('avatar'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any)?.userId;
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

// delete profile API
router.put('/deleteUserProfile', authenticateToken, async (req: Request, res: Response): Promise<void> => {
    try{
        const userId = (req.user as any)?.userId;
        const result = await ProfileService.deleteProfile(userId);        
        if (result.success){
            res.status(200).json(result);
        }
        else res.status(401).json(result);
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error while deleting profile.' 
        });
    }
});
export default router;