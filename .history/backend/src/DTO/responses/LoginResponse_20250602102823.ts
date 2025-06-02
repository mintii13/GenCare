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
    accessToken?: string; // Thêm access token
}

// src/dto/responses/RegisterResponse.ts (Updated)
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
        password?: string;
        full_name: string;
        phone?: string;
        date_of_birth?: Date;
        gender?: string;
        registration_date: Date;
        updated_date: Date;
        last_login?: Date;
        status: boolean;
        email_verified: boolean;
        role: 'customer' | 'consultant' | 'staff' | 'admin';
        googleId?: string;
    };
    accessToken?: string; // Thêm access token cho profile completion
}