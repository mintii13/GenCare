export interface ProfileResponse{
    success: boolean;
    message: string;
    user?: {
        avatar: string
        email: string;
        full_name: string;
        phone: string;
        date_of_birth: Date,
        gender: string
    };
}