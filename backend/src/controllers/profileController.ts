import { Router } from 'express';
import {authenticateToken, authorizeRoles} from '../middlewares/jwtMiddleware';
import {upload} from '../configs/avatarUpload';
import { updateProfile } from '../services/profileService';
const router = Router();

//update profile API
router.put('/updateUserProfile', authenticateToken, upload.single('avatar'), updateProfile);

export default router;