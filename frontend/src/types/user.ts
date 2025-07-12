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