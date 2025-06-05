import { Router, Request, Response } from 'express';
import {authenticateToken, authorizeRoles} from '../middlewares/jwtMiddleware';
import {upload} from '../configs/avatar';
import { updateProfile } from '../services/profileService';

const router = Router();
router.put('/updateUserProfile', authenticateToken, upload.single('avatar'), updateProfile);

export default router;