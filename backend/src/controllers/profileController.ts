import { Router } from 'express';
import {authenticateToken, authorizeRoles} from '../middlewares/jwtMiddleware';
import {upload} from '../configs/avatarUpload';
import { deleteProfile, getProfile, updateProfile } from '../services/profileService';
const router = Router();

//get profile API
router.get('/getUserProfile', authenticateToken, getProfile)

//update profile API
router.put('/updateUserProfile', authenticateToken, upload.single('avatar'), updateProfile);

// delete profile API
router.put('/deleteUserProfile', authenticateToken, deleteProfile);

export default router;