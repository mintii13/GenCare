import {IUser, User} from '../models/User'
import { UserRepository } from '../repositories/userRepository';
import { ProfileResponse } from '../dto/responses/ProfileResponse';
import { ObjectId } from 'mongoose';
import { ProfileRequest } from '../dto/requests/ProfileRequest';
export class ProfileService{
    public static async updateProfile(userId: ObjectId, profileRequest: ProfileRequest, avatarError: string, file: any): Promise<ProfileResponse>{
        try {
            if (!userId) {
                return{ 
                    success: false, 
                    message: 'Unauthorized' 
                };
            }
            const { full_name, phone, date_of_birth, gender} = profileRequest;

            const updateData: Partial<IUser> = {};
            if (full_name) updateData.full_name = full_name;
            if (phone) updateData.phone = phone;
            if (date_of_birth) updateData.date_of_birth = date_of_birth;
            if (gender) updateData.gender = gender;
            
            if (file) {
                const base64Image = file.buffer.toString('base64');
                const mimeType = file.mimetype;
                updateData.avatar = `data:${mimeType};base64,${base64Image}`;
            }
            const updatedUser = await UserRepository.findByIdAndUpdate(userId, updateData)

            if (!updatedUser) {
                return{
                    success: false,
                    message: 'Cannot find User'
                };
            }
            if (avatarError != null){
                return{
                    success: false,
                    message: avatarError
                }
            }
            return{
                success: true,
                message: 'Update profile successfully',
                user: {
                    avatar: updatedUser.avatar,
                    email: updatedUser.email,
                    full_name: updatedUser.full_name,
                    phone: updatedUser.phone,
                    date_of_birth: updatedUser.date_of_birth,
                    gender: updatedUser.gender
                }
            };
        } catch (error) {
            return{
                success: false,
                message: 'Server error when updating profile',
            };
        }
    }

    public static async getProfile(userId: ObjectId): Promise<ProfileResponse> {
        try {
            const user = await UserRepository.findById(userId.toString());
            if (!user) {
                return{
                    success: false,
                    message: 'Cannot find user info'
                };
            }

            return{
                success: true,
                message: 'Get user profile successfully',
                user: {
                    avatar: user.avatar,
                    email: user.email,
                    full_name: user.full_name,
                    phone: user.phone,
                    date_of_birth: user.date_of_birth,
                    gender: user.gender
                }
            };
        } catch (error) {
            return{
                success: false,
                message: 'Server error when getting profile',
            };
        }
    }

    public static async deleteProfile(userId: ObjectId): Promise<ProfileResponse>{
    try{
        if (!userId) {
            return{ 
                success: false, 
                message: 'Unauthorized' 
            };
        }
        //delete profile by change status of user
        const user = await UserRepository.findByIdAndUpdate(userId, {status: false});
        
        if (!user) {
           return{ 
                success: false, 
                message: 'User not found' 
            };
        }
        return{ 
            success: true, 
            message: 'User profile has been deactivated.' 
        };
    } catch (error) {
        return{ 
            success: false, 
            message: 'Server error while deleting profile.' 
        };
    }
}
}