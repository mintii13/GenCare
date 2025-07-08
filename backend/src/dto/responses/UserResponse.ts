import { PaginationInfo } from './PaginationResponse';

export interface UserData {
    id?: string;
    email: string;
    full_name: string;
    phone?: string;
    date_of_birth?: Date;
    gender?: string;
    role: string;
    status: boolean;
    email_verified?: boolean;
    avatar?: string;
    registration_date?: Date;
    updated_date?: Date;
    last_login?: Date;
}

export interface UserResponse {
    success: boolean;
    message: string;
    data?: {
        user: UserData;
    };
    timestamp?: string;
}

export interface UsersResponse {
    success: boolean;
    message: string;
    data?: {
        users: UserData[];
        pagination: PaginationInfo;
        filters_applied: any;
    };
    timestamp?: string;
}

export interface UserStatistics {
    overview: {
        total_users: number;
        active_users: number;
        inactive_users: number;
        verified_users: number;
        unverified_users: number;
    };
    by_role: {
        customer: number;
        consultant: number;
        staff: number;
        admin: number;
    };
    recent_registrations: number;
}

export interface UserStatisticsResponse {
    success: boolean;
    message: string;
    data?: {
        statistics: UserStatistics;
    };
    timestamp?: string;
}