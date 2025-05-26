export interface LoginResponse {
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