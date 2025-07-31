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
  // Customer không redirect, các role khác redirect vào dashboard
  if (user.role === 'customer') {
    // Customer stays on current page, just close modal and show success message
    return;
  }
  
  const dashboardPath = getDashboardPathByRole(user.role);
  navigate(dashboardPath);
};