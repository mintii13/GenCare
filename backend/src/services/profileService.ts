import {IUser} from '../models/User'
import { UserRepository } from '../repositories/userRepository';
import { ProfileResponse, UpdateProfileResponse } from '../dto/responses/ProfileResponse';
import { ProfileRequest } from '../dto/requests/ProfileRequest';
import { ConsultantRepository } from '../repositories/consultantRepository';
import { IConsultant } from '../models/Consultant';
export class ProfileService{
    public static async updateProfile(userId: string, role: string, profileRequest: ProfileRequest, avatarError: string, file: any): Promise<UpdateProfileResponse>{
        try {
            if (!userId) {
                return{ 
                    success: false, 
                    message: 'Unauthorized' 
                };
            }
            const { full_name, phone, date_of_birth, gender } = profileRequest;

            let consultant: any = profileRequest.consultant;
            if (typeof consultant === 'string') {
                try {
                    consultant = JSON.parse(consultant);
                } catch (e) {
                    consultant = undefined;
                }
            }

            const updateData: Partial<IUser> = {};
            if (full_name) updateData.full_name = full_name;
            if (phone) updateData.phone = phone;
            if (date_of_birth) updateData.date_of_birth = date_of_birth;
            if (gender) updateData.gender = gender;
            if (file) {
                const base64Image = file.buffer.toString('base64');
                const mimeType = file.mimetype;
                updateData.avatar = `data:${mimeType};base64,${base64Image}`;
                // updateData.avatar = file
            }
            const updatedUser = await UserRepository.findByIdAndUpdate(userId, updateData);
            const updateConsultant: Partial<IConsultant> = {};

            if (consultant && role == 'consultant') {
                const fields = ['specialization', 'qualifications', 'experience_years', 'consultation_rating', 'total_consultations'] as const;
                for (const field of fields) {
                    if (consultant[field] !== undefined && consultant[field] !== '') {
                        (updateConsultant as any)[field] = consultant[field];
                    }
                }
            }
            
            const hasConsultantData = Object.keys(updateConsultant).length > 0;
            let updatedConsultant = null;
            if (hasConsultantData){
                updatedConsultant = await ConsultantRepository.updateByUserId(userId, updateConsultant);
            }
            if (!updatedUser) {
                return { success: false, message: 'Cannot find User' };
            }

            if (avatarError != null) {
                return { success: false, message: avatarError };
            }

            return {
                success: true,
                message: 'Update profile successfully',
                user: {
                    avatar: updatedUser.avatar,
                    full_name: updatedUser.full_name,
                    phone: updatedUser.phone,
                    date_of_birth: updatedUser.date_of_birth,
                    gender: updatedUser.gender
                },
                ...(hasConsultantData && { consultant: updatedConsultant })
            };
            
        } catch (error) {
            console.error(error);
            return{
                success: false,
                message: 'Server error when updating profile',
            };
        }
    }

    public static async getProfile(userId: string, role: string): Promise<ProfileResponse> {
        try {
            const user = await UserRepository.findById(userId);
            if (!user) {
                return{
                    success: false,
                    message: 'Cannot find user info'
                };
            }
            const profileResponse: ProfileResponse = {
                success: true,
                message: 'Get user profile successfully',
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
            };
            if (role === 'consultant') {
                const consultant = await ConsultantRepository.findByUserId(userId);
                if (consultant) {
                    profileResponse.consultant = {
                        specialization: consultant.specialization,
                        qualifications: consultant.qualifications,
                        experience_years: consultant.experience_years,
                        consultation_rating: consultant.consultation_rating,
                        total_consultations: consultant.total_consultations
                    };
                }
            }
            return profileResponse;
            
        } catch (error) {
            return{
                success: false,
                message: 'Server error when getting profile',
            };
        }
    }

    public static async deleteProfile(userId: string): Promise<ProfileResponse>{
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