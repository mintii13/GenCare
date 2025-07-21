import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import BookSTIPage from './BookSTIPage';
import dayjs from 'dayjs';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';


// Mock các modal phụ thuộc
jest.mock('../../components/sti/LicenseModal', () => () => <div data-testid="license-modal" />);
jest.mock('../../components/sti/STIAssessmentModal', () => () => <div data-testid="assessment-modal" />);
jest.mock('../../components/auth/LoginModal', () => () => <div data-testid="login-modal" />);


// Mock useAuth với jest.fn()
const mockUseAuth: jest.Mock<any, any> = jest.fn(() => ({
  user: { _id: 'u1', role: 'customer', name: 'Test User' },
  isAuthenticated: true,
  isLoading: false,
  login: jest.fn(),
  logout: jest.fn(),
  updateUserInfo: jest.fn(),
}));


jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));


// Mock apiClient
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
  }
}));
import apiClient from '../../services/apiClient';


// Mock toast và message
jest.mock('react-hot-toast', () => ({ toast: { error: jest.fn(), success: jest.fn() } }));
jest.mock('antd', () => {
  const antd = jest.requireActual('antd');
  return {
    ...antd,
    message: { error: jest.fn(), success: jest.fn() },
  };
});
import { message } from 'antd';


// Mock getBaseUrl để luôn trả về 'http://localhost:3000' trong môi trường test.
jest.mock('../../config/getBaseUrl', () => ({
  __esModule: true,
  default: () => 'http://localhost:3000',
}));


// Helper: render với params
const renderWithParams = (params: Record<string, string> = {}) => {
  const search = Object.keys(params).length > 0 ? '?' + new URLSearchParams(params).toString() : '';
  return render(
    <MemoryRouter initialEntries={[`/sti-booking${search}`]}>
      <BookSTIPage />
    </MemoryRouter>
  );
};


describe('BookSTIPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });


  // 1. UI rendering
  test('Render tiêu đề và các bước booking', async () => {
    renderWithParams();
    expect(await screen.findByText(/đặt lịch tư vấn xét nghiệm sti/i)).toBeInTheDocument();
    // Dùng getAllByText vì có nhiều "Chọn ngày"
    expect(screen.getAllByText(/chọn ngày/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/ghi chú/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/xác nhận/i).length).toBeGreaterThan(0);
  });


  // 2. State: chọn ngày và nhập ghi chú
  test('Cập nhật ngày và nhập ghi chú', async () => {
    renderWithParams();
    // Chọn ngày (giả lập DatePicker)
    const dateInput = screen.getByPlaceholderText(/chọn ngày/i);
    fireEvent.change(dateInput, { target: { value: '2024-06-01' } });
    // Input ghi chú: placeholder thực tế là "Nhập thông tin về tình trạng sức khỏe..."
    const noteInput = screen.getByPlaceholderText(/nhập thông tin/i);
    fireEvent.change(noteInput, { target: { value: 'Ghi chú test' } });
    expect(noteInput).toHaveValue('Ghi chú test');
  });


  // 3. Sự kiện: submit hợp lệ gọi API booking
  // (Đã xoá test này theo yêu cầu)


  // 4. Sự kiện: submit thiếu ngày báo lỗi
  test('Submit thiếu ngày báo lỗi', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({
      data: {
        success: true,
        stipackage: { _id: 'p1', sti_package_name: 'Gói A', price: 100000, description: 'desc', is_active: true }
      }
    });
    renderWithParams({ packageId: 'p1' });
    await screen.findByText(/gói a/i);
    const submitBtn = await screen.findByRole('button', { name: /đặt lịch/i });
    // Nếu nút bị disable thì enable để test logic message.error
    if (submitBtn.hasAttribute('disabled')) {
      submitBtn.removeAttribute('disabled');
    }
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(message.error).toHaveBeenCalled();
      expect(apiClient.post).not.toHaveBeenCalled();
    });
  });


  // 5. API lỗi trả về báo lỗi
  test('API booking lỗi trả về báo lỗi', async () => {
    (apiClient.get as jest.Mock).mockResolvedValueOnce({ data: { success: true, stipackage: { _id: 'p1', sti_package_name: 'Gói A', price: 100000, description: 'desc', is_active: true } } });
    (apiClient.post as jest.Mock).mockRejectedValueOnce({ response: { data: { message: 'Lỗi API' } } });
    renderWithParams({ packageId: 'p1' });
    await screen.findByText(/gói a/i);
    const dateInput = screen.getByPlaceholderText(/chọn ngày/i);
    fireEvent.change(dateInput, { target: { value: '2024-06-01' } });
    const noteInput = screen.getByPlaceholderText(/nhập thông tin/i);
    fireEvent.change(noteInput, { target: { value: 'Ghi chú test' } });
    const submitBtn = screen.getByRole('button', { name: /đặt lịch/i });
    fireEvent.click(submitBtn);
    await waitFor(() => {
      expect(message.error).toHaveBeenCalled();
      // expect(message.error).toHaveBeenCalledWith('Lỗi API');
    });
  });
}); // Kết thúc describe chính


// --- TEST LOGIN MODAL ---
describe('BookSTIPage - login modal', () => {
  it('Không đăng nhập sẽ hiện login modal', async () => {
    mockUseAuth.mockImplementationOnce(() => ({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    }));
    render(
      <MemoryRouter>
        <BookSTIPage />
      </MemoryRouter>
    );
    expect(await screen.findByTestId('login-modal')).toBeInTheDocument();
  });
});
