export interface UpdateProfileResponse{
    success: boolean;
    message: string;
    avatarError?: string;
    user?: {
        avatar: string
        email: string;
        full_name: string;
        phone: string;
        date_of_birth: Date,
        gender: string
    };
}