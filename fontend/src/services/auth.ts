import api from './api';

interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export const authService = {
  // Gọi API đăng nhập
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  // Gọi API đăng ký
  register: async (email: string, password: string, name: string): Promise<LoginResponse> => {
    const response = await api.post<LoginResponse>('/auth/register', {
      email,
      password,
      name,
    });
    return response.data;
  },

  // Gọi API đăng xuất
  logout: async (): Promise<void> => {
    await api.post('/auth/logout');
    localStorage.removeItem('token');
  },

  // Lấy thông tin user hiện tại
  getCurrentUser: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
}; 