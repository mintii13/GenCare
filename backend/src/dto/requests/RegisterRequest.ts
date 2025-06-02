export interface RegisterRequest {
    email: string;
    password: string;
    confirm_password: string;
}

export interface ProfileRequest{
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
}


