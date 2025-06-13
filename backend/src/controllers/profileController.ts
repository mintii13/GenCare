import { Router, Request, Response} from 'express';
import {authenticateToken, authorizeRoles} from '../middlewares/jwtMiddleware';
import {upload} from '../configs/avatarUpload';
import { ProfileService } from '../services/profileService';
import { ProfileRequest } from '../dto/requests/ProfileRequest';
import { ProfileResponse } from '../dto/responses/ProfileResponse';
import { IUser, User } from '../models/User';
const router = Router();

//get profile API
router.get('/getUserProfile', authenticateToken, async (req, res) => {
  try {
    // req.jwtUser được gán từ middleware authenticateToken
    const userId = req.jwtUser?.userId;
    if (!userId) {
      return res.status(401).json({ 
        success: false, 
        message: "Cannot verify user" 
      });
    }

    const user = await User.findById(userId).lean<IUser>();
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: "Cannot find user" 
      });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        full_name: user.full_name,
        phone: user.phone,
        date_of_birth: user.date_of_birth,
        gender: user.gender,
        role: user.role,
        status: user.status,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Profile endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Lỗi hệ thống" 
    });
  }
});


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