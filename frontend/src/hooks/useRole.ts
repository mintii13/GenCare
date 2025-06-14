import { useAuth } from '../contexts/AuthContext';

export type UserRole = 'admin' | 'staff' | 'consultant' | 'customer';

interface UseRoleReturn {
  isAdmin: boolean;
  isStaff: boolean;
  isConsultant: boolean;
  isCustomer: boolean;
  hasRole: (role: UserRole) => boolean;
  hasAnyRole: (roles: UserRole[]) => boolean;
  currentRole: UserRole | undefined;
}

export const useRole = (): UseRoleReturn => {
  const { user } = useAuth();
  
  const isAdmin = user?.role === 'admin';
  const isStaff = user?.role === 'staff';
  const isConsultant = user?.role === 'consultant';
  const isCustomer = user?.role === 'customer';
  
  const hasRole = (role: UserRole): boolean => user?.role === role;
  
  const hasAnyRole = (roles: UserRole[]): boolean => {
    return roles.some(role => user?.role === role);
  };
  
  return {
    isAdmin,
    isStaff,
    isConsultant,
    isCustomer,
    hasRole,
    hasAnyRole,
    currentRole: user?.role as UserRole | undefined
  };
}; 