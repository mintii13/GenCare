import { renderHook } from '@testing-library/react';
import { useRole } from './useRole';

// Tạo biến mock động cho useAuth
let mockUser: any = { role: 'admin' };
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({ user: mockUser })
}));

describe('useRole', () => {
  afterEach(() => {
    mockUser = { role: 'admin' };
  });

  it('isAdmin true khi user là admin', () => {
    mockUser = { role: 'admin' };
    const { result } = renderHook(() => useRole());
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.isStaff).toBe(false);
    expect(result.current.isConsultant).toBe(false);
    expect(result.current.isCustomer).toBe(false);
    expect(result.current.hasRole('admin')).toBe(true);
    expect(result.current.hasAnyRole(['admin', 'staff'])).toBe(true);
    expect(result.current.currentRole).toBe('admin');
  });

  it('isStaff true khi user là staff', () => {
    mockUser = { role: 'staff' };
    const { result } = renderHook(() => useRole());
    expect(result.current.isStaff).toBe(true);
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.hasRole('staff')).toBe(true);
    expect(result.current.hasAnyRole(['consultant', 'staff'])).toBe(true);
    expect(result.current.currentRole).toBe('staff');
  });

  it('isConsultant true khi user là consultant', () => {
    mockUser = { role: 'consultant' };
    const { result } = renderHook(() => useRole());
    expect(result.current.isConsultant).toBe(true);
    expect(result.current.hasRole('consultant')).toBe(true);
    expect(result.current.currentRole).toBe('consultant');
  });

  it('isCustomer true khi user là customer', () => {
    mockUser = { role: 'customer' };
    const { result } = renderHook(() => useRole());
    expect(result.current.isCustomer).toBe(true);
    expect(result.current.hasRole('customer')).toBe(true);
    expect(result.current.currentRole).toBe('customer');
  });
}); 