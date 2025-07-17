export interface User {
  _id: string;
  id: string;
  email: string;
  full_name: string;
  role: 'customer' | 'staff' | 'admin' |  'consultant';
  status: boolean;
  avatar?: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
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