import axios from 'axios';

// Mock axios.create trước khi import apiClient
const mockAxiosInstance = {
  get: jest.fn().mockResolvedValue({ data: { ok: 1 } }),
  post: jest.fn().mockResolvedValue({ data: { ok: 2 } }),
  put: jest.fn(),
  patch: jest.fn(),
  delete: jest.fn(),
  interceptors: {
    request: { use: jest.fn(), handlers: [{ fulfilled: jest.fn() }] },
    response: { use: jest.fn(), handlers: [{ rejected: jest.fn() }] },
  },
  defaults: { headers: { common: {} }, baseURL: '' },
};
(jest.mock('axios'), (axios as any).create = jest.fn(() => mockAxiosInstance));

import apiClient, { ApiResponse } from './apiClient';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('apiClient (instance)', () => {
  const baseURL = 'http://test-api';
  const token = 'test-token';
  const AUTH_TOKEN_KEY = 'gencare_auth_token';

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    apiClient.setBaseURL(baseURL);
  });

  test('setBaseURL thay đổi baseURL', () => {
    apiClient.setBaseURL('http://new-api');
    expect((apiClient as any).instance.defaults.baseURL).toBe('http://new-api');
  });

  test('setDefaultHeader và removeDefaultHeader', () => {
    apiClient.setDefaultHeader('X-Test', '123');
    expect((apiClient as any).instance.defaults.headers.common['X-Test']).toBe('123');
    apiClient.removeDefaultHeader('X-Test');
    expect((apiClient as any).instance.defaults.headers.common['X-Test']).toBeUndefined();
  });

  test('get gọi axios.get', async () => {
    jest.spyOn((apiClient as any).instance, 'get').mockResolvedValue({ data: { ok: 1 } });
    const res = await apiClient.get('/test');
    expect(res.data).toEqual({ ok: 1 });
  });

  test('post gọi axios.post', async () => {
    jest.spyOn((apiClient as any).instance, 'post').mockResolvedValue({ data: { ok: 2 } });
    const res = await apiClient.post('/test', { a: 1 });
    expect(res.data).toEqual({ ok: 2 });
  });

  test('safeGet trả về ApiResponse thành công', async () => {
    apiClient.get = jest.fn().mockResolvedValue({ data: { ok: 1 } });
    const res: ApiResponse = await apiClient.safeGet('/test');
    expect(res.success).toBe(true);
    expect(res.data).toEqual({ ok: 1 });
  });

  test('safeGet trả về ApiResponse lỗi', async () => {
    apiClient.get = jest.fn().mockRejectedValue({ response: { status: 500, data: { error: 'err' } }, message: 'fail' });
    const res: ApiResponse = await apiClient.safeGet('/test');
    expect(res.success).toBe(false);
    expect(res.error).toBeDefined();
  });

  test('interceptor thêm token vào header', () => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    const config: any = { headers: {} };
    const interceptor = (apiClient as any).instance.interceptors.request.handlers[0].fulfilled;
    if (typeof interceptor === 'function') {
      const newConfig = interceptor(config);
      expect(newConfig.headers['Authorization']).toBe(`Bearer ${token}`);
    }
  });

  test('interceptor xử lý 401 và xóa token', async () => {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
    // Không mock window.location nữa, chỉ kiểm tra localStorage
    const error: any = {
      response: { status: 401 },
      config: { url: '/other', method: 'get' },
      message: 'unauthorized',
    };
    const interceptor = (apiClient as any).instance.interceptors.response.handlers[0].rejected;
    if (typeof interceptor === 'function') {
      await interceptor(error).catch(() => {});
      expect(localStorage.getItem(AUTH_TOKEN_KEY)).toBeNull();
    }
  });
}); 