import { PaginationQuery } from './PaginationRequest';

export interface UserQuery extends PaginationQuery {
    search?: string;
    role?: 'customer' | 'consultant' | 'staff' | 'admin';
    status?: boolean;
    email_verified?: boolean;
    date_from?: string;
    date_to?: string;
}

export interface CreateUserRequest {
    email: string;
    password?: string;
    full_name: string;
    phone?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    role: 'customer' | 'consultant' | 'staff' | 'admin';
    status?: boolean;
    email_verified?: boolean;
    avatar?: string;
}

export interface UpdateUserRequest {
    email?: string;
    password?: string;
    full_name?: string;
    phone?: string;
    date_of_birth?: string;
    gender?: 'male' | 'female' | 'other';
    role?: 'customer' | 'consultant' | 'staff' | 'admin';
    status?: boolean;
    email_verified?: boolean;
    avatar?: string;
}