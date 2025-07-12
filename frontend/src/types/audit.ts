import { User } from './user';

export interface AuditLog {
  _id: string;
  target_type: string;
  target_id: string;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout';
  user_id: string;
  user_ip?: string;
  timestamp: string;
  details: Record<string, any>;
  user?: User; // Populated from user_id
} 