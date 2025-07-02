export interface RegisterResponse {
    success: boolean;
    message: string;
    user_email?: string;
}
export interface VerificationResponse{
    success: boolean;
    message: string;
    user?: {
        id: string;
        email: string;
        full_name: string;
        role: string;
        status: boolean;
        avatar?: string | null;
        phone?: string | null;
        date_of_birth?: Date | null;
        gender?: string | null;
        registration_date?: Date;
        updated_date?: Date;
        last_login?: Date | null;
        email_verified?: boolean;
        googleId?: string | null;
    };
    accessToken?: string; // Thêm access token để tự động đăng nhập
}