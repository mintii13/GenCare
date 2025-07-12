import { UserRole } from "../../models/User";
import mongoose from 'mongoose';
export interface UpdateProfileResponse{
    success: boolean;
    message: string;
    user?: {
        avatar: string
        full_name: string;
        phone: string;
        date_of_birth: Date,
        gender: string
    };
    consultant?:{
        specialization?: string;
        qualifications?: string;
        experience_years?: number;
        consultation_rating?: number;
        total_consultations?: number;
    };
}

export interface ProfileResponse{
    success: boolean;
    message: string;
    user?: {
        id: mongoose.Types.ObjectId,
        email: string;
        full_name: string;
        phone: string;
        date_of_birth: Date,
        gender: string,
        role: UserRole,
        status: boolean,
        avatar: string
    };
    consultant?:{
        specialization: string;
        qualifications: string;
        experience_years: number;
        consultation_rating?: number;
        total_consultations: number;
    };
}