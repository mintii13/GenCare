/**
 * Authentication utilities for managing tokens
 */

const AUTH_TOKEN_KEY = "gencare_auth_token";

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

/**
 * Lấy JWT token của ứng dụng
 * @returns JWT token hoặc null
 */
export const getAuthToken = (): string | null => {
  return localStorage.getItem(AUTH_TOKEN_KEY);
};

/**
 * Kiểm tra xem user đã đăng nhập hay chưa
 * @returns true nếu có JWT token
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Xóa tất cả token khi logout - optimized for performance
 */
export const clearAllTokens = (): void => {
  // Batch localStorage operations for better performance
  const keysToRemove = [AUTH_TOKEN_KEY, "google_access_token", "user"];
  keysToRemove.forEach(key => localStorage.removeItem(key));
}; 