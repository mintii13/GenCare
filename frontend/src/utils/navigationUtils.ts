/**
 * Utility functions for navigation after authentication
 */

export type UserRole = 'admin' | 'staff' | 'consultant' | 'customer';

export const getDashboardPathByRole = (role?: string): string => {
  switch (role) {
    case 'admin':
      return '/admin/overview';
    case 'staff':
      return '/staff/overview';
    case 'consultant':
      return '/consultant/schedule';
    default:
      return '/';
  }
};

export const navigateAfterLogin = (user: { role?: string }, navigate: (path: string) => void): void => {
  const dashboardPath = getDashboardPathByRole(user.role);
  navigate(dashboardPath);
};