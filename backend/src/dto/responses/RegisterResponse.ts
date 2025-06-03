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
    };
}