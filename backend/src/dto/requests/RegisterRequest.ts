export interface RegisterRequest {
    email: string;
    password: string;
    confirm_password: string;
    full_name: string;
    phone?: string;
    date_of_birth?: Date;
    gender?: string;
}