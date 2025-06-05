import { Router, Request, Response } from 'express';
import {authenticateToken, authorizeRoles} from '../middlewares/jwtMiddleware';
import {upload} from '../configs/avatarUpload';
import { updateProfile } from '../services/profileService';
import {User} from '../models/User'
import path from 'path'
const router = Router();
router.put('/updateUserProfile', authenticateToken, upload.single('avatar'), updateProfile);

export default router;