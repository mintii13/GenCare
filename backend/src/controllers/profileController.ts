import { Router, Request, Response} from 'express';
import {authenticateToken, authorizeRoles} from '../middlewares/jwtMiddleware';
import {upload} from '../configs/avatarUpload';
import { ProfileService } from '../services/profileService';
import { ProfileRequest } from '../dto/requests/ProfileRequest';
import { ProfileResponse, UpdateProfileResponse } from '../dto/responses/ProfileResponse';
import { IUser, User } from '../models/User';
const router = Router();

//get profile API
router.get('/getUserProfile', authenticateToken, async (req, res) => {
  try {
    // req.jwtUser được gán từ middleware authenticateToken
    const userId = (req.user as any)?.userId;
    const role = (req.user as any)?.role;
    const result = await ProfileService.getProfile(userId, role);
    if (result.success){
      res.status(200).json(result);
    }
    else res.status(404).json(result);
    
  } catch (error) {
    console.error('Profile endpoint error:', error);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
});


//update profile API
router.put('/updateUserProfile', authenticateToken, upload.single('avatar'), async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any)?.userId;
        const role = (req.user as any)?.role;
        const profileRequest: ProfileRequest = req.body;

        let avatarError: string;
        if ((req as any).fileValidationError){
            avatarError = (req as any).fileValidationError;
        }
        const result: UpdateProfileResponse = await ProfileService.updateProfile(userId, role, profileRequest, avatarError, req.file);
        if (result.success)
            res.status(200).json(result);
        else res.status(401).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Internal server error when updating profile',
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
            message: 'Internal server error while deleting profile.' 
        });
    }
});

// Update user status API (Admin/Staff only)
router.put('/:userId/status', authenticateToken, authorizeRoles('admin', 'staff'), async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { status } = req.body;

    // Validate status is boolean
    if (typeof status !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Trạng thái không hợp lệ'
      });
    }

    // Find and update user
    const user = await User.findByIdAndUpdate(
      userId,
      { status: status },
      { new: true }
    ).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      message: status ? 'Đã kích hoạt tài khoản' : 'Đã khóa tài khoản',
      data: {
        user: {
          id: user._id,
          email: user.email,
          full_name: user.full_name,
          status: user.status
        }
      }
    });
  } catch (error) {
    console.error('Update user status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống'
    });
  }
});

// Get all users API (Admin only)
router.get('/getAllUsers', authenticateToken, authorizeRoles('admin', 'staff'), async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;
    const status = req.query.status as string;
    const search = req.query.search as string;

    const query: any = {};

    // Add filters if provided
    if (role) {
      query.role = role;
    }
    if (status !== undefined) {
      query.status = status === 'true';
    }
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: 'i' } },
        { full_name: { $regex: search, $options: 'i' } }
      ];
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const total = await User.countDocuments(query);

    // Get users with pagination and filters
    const users = await User.find(query)
      .select('-password') // Exclude password
      .skip(skip)
      .limit(limit)
      .lean();

    // Transform users for response
    const transformedUsers = users.map(user => ({
      id: user._id,
      email: user.email,
      full_name: user.full_name,
      phone: user.phone,
      date_of_birth: user.date_of_birth,
      gender: user.gender,
      role: user.role,
      status: user.status,
      avatar: user.avatar,
      registration_date: user.registration_date,
      updated_date: user.updated_date,
      last_login: user.last_login,
      email_verified: user.email_verified
    }));

    res.json({
      success: true,
      data: {
        users: transformedUsers,
        pagination: {
          total,
          page,
          totalPages: Math.ceil(total / limit),
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get all users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi hệ thống'
    });
  }
});

export default router;