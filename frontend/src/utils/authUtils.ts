/**
  * Authentication utilities for managing tokens
 */
import { User } from '@/types/user';
import { env } from '../config/environment';

const AUTH_TOKEN_KEY = env.AUTH_TOKEN_KEY;
const USER_INFO_KEY = 'user';

// --- Token Management ---

/**
 * Lấy JWT token của ứng dụng
 * @returns JWT token hoặc null
 */
export const getToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Kiểm tra xem user đã đăng nhập hay chưa
 * @returns true nếu có JWT token
 */
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

/**
 * Xóa tất cả token và thông tin người dùng khi logout
 */
export const clearAllAuthData = (): void => {
  const keysToRemove = [AUTH_TOKEN_KEY, USER_INFO_KEY, "google_access_token"];
  keysToRemove.forEach(key => localStorage.removeItem(key));
};

// --- User Management ---

/**
 * Lấy thông tin người dùng từ localStorage
 * @returns User object hoặc null
 */
export const getUser = (): User | null => {
  const userJson = localStorage.getItem(USER_INFO_KEY);
  if (!userJson) return null;
  try {
    return JSON.parse(userJson) as User;
  } catch (e) {
    console.error("Failed to parse user data from localStorage", e);
    return null;
  }
};

// --- Combined Auth Actions ---

/**
 * Xử lý logic khi người dùng đăng nhập thành công
 * @param user User object
 * @param token JWT token
 */
export const login = (user: User, token: string): void => {
  localStorage.setItem(AUTH_TOKEN_KEY, token);
  localStorage.setItem(USER_INFO_KEY, JSON.stringify(user));
};

/**
 * Xử lý logic khi người dùng đăng xuất
 */
export const logout = (): void => {
  clearAllAuthData();
};


/**
 * Lấy Google access token từ localStorage
 * @returns Google access token hoặc null nếu không có
 */
export const getGoogleAccessToken = (): string | null => {
  return localStorage.getItem("google_access_token");
};

/**
 * Kiểm tra xem có Google access token hay không
 * @returns true nếu có Google access token
 */
export const hasGoogleAccessToken = (): boolean => {
  return !!getGoogleAccessToken();
};

/**
 * Lưu Google access token vào localStorage
 * @param token Google access token
 */
export const setGoogleAccessToken = (token: string): void => {
  localStorage.setItem("google_access_token", token);
};

/**
 * Xóa Google access token khỏi localStorage
 */
export const removeGoogleAccessToken = (): void => {
  localStorage.removeItem("google_access_token");
}; 