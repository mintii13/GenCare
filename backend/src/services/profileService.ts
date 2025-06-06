import {IUser, User} from '../models/User'
import { Request, Response} from 'express';
import { UserRepository } from '../repositories/userRepository';
import { UpdateProfileResponse } from '../dto/responses/ProfileResponse';

export const getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any)?.userId;
        
        const user = await UserRepository.findById(userId);
        if (!user) {
            res.status(404).json({
                success: false,
                message: 'Cannot find user info'
            });
            return;
        }

        res.json({
            success: true,
            message: 'Get user profile successfully',
            data: {
                avatar: user.avatar,
                email: user.email,
                full_name: user.full_name,
                phone: user.phone,
                date_of_birth: user.date_of_birth,
                gender: user.gender
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error when getting profile',
        });
        throw error;
    }
}

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const userId = (req.user as any)?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        const { full_name, phone, date_of_birth, gender} = req.body;

        const updateData: Partial<IUser> = {};
        if (full_name) updateData.full_name = full_name;
        if (phone) updateData.phone = phone;
        if (date_of_birth) updateData.date_of_birth = date_of_birth;
        if (gender) updateData.gender = gender;
        
        let avatarError = null;
        if ((req as any).fileValidationError){
            avatarError = (req as any).fileValidationError;
        }
        if (req.file) {
            const base64Image = req.file.buffer.toString('base64');
            const mimeType = req.file.mimetype;
            updateData.avatar = `data:${mimeType};base64,${base64Image}`;            
        }
        const updatedUser = await UserRepository.findByIdAndUpdate(userId, updateData)

        if (!updatedUser) {
            res.status(404).json({
                success: false,
                message: 'Cannot find User'
            });
            return;
        }
        const result: UpdateProfileResponse = {       
            success: true,
            message: 'Update profile successfully',
            avatarError,
            user: {
                avatar: updatedUser.avatar,
                email: updatedUser.email,
                full_name: updatedUser.full_name,
                phone: updatedUser.phone,
                date_of_birth: updatedUser.date_of_birth,
                gender: updatedUser.gender
            }
        }
        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error when updating profile',
        });
    }
};

export const deleteProfile = async (req: Request, res: Response): Promise<void> => {
    try{
        const userId = (req.user as any)?.userId;
        if (!userId) {
            res.status(401).json({ success: false, message: 'Unauthorized' });
            return;
        }
        //delete profile by change status of user
        const user = await UserRepository.findByIdAndUpdate(userId, {status: false});
        if (!user) {
            res.status(404).json({ success: false, message: 'User not found' });
            return;
        }
        res.status(200).json({ 
            success: true, 
            message: 'User profile has been deactivated.' 
        });
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Server error while deleting profile.' 
        });
    }
}