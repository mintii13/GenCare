import { BaseEntity, UserRole } from './common';

export interface User extends BaseEntity {
  email: string;
  full_name: string;
  role: UserRole;
  status: boolean;
  avatar?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  email_verified?: boolean;
  registration_date?: string;
  last_login?: string;
  googleId?: string;
}

export interface Consultant extends User {
  consultant_id: string;
  specialization: string;
  experience_years: number;
} 

export interface Staff extends User {
  staff_id: string;
  position: string;
  department: string;
}

export interface Admin extends User {
  admin_id: string;
  role: 'admin';
}

export interface Customer extends User {
  customer_id: string;
  role: 'customer';
}