export interface RegisterResponse {
    success: boolean;
    message: string;
    user?: {
        email: string;
        password: string;
    };
}

export interface ProfileResponse {
    success: boolean;
    message: string;
    user?: {
        email: string;
        password: string;
        full_name: string;
        phone?: string | null;
        date_of_birth?: Date | null;
        gender?: string | null;
        registration_date: Date;
        updated_date: Date;
        last_login?: Date | null;
        status: string;
        email_verified: boolean;
    };
}