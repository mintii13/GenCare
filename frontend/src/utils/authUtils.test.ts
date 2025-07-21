import {
  getGoogleAccessToken,
  hasGoogleAccessToken,
  setGoogleAccessToken,
  removeGoogleAccessToken,
  getAuthToken,
  isAuthenticated,
  clearAllTokens
} from './authUtils';

describe('authUtils', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  test('getGoogleAccessToken returns null if not set', () => {
    expect(getGoogleAccessToken()).toBeNull();
  });

  test('setGoogleAccessToken and getGoogleAccessToken', () => {
    setGoogleAccessToken('token123');
    expect(getGoogleAccessToken()).toBe('token123');
  });

  test('hasGoogleAccessToken returns true if token exists', () => {
    setGoogleAccessToken('token123');
    expect(hasGoogleAccessToken()).toBe(true);
  });

  test('hasGoogleAccessToken returns false if token does not exist', () => {
    expect(hasGoogleAccessToken()).toBe(false);
  });

  test('removeGoogleAccessToken removes token', () => {
    setGoogleAccessToken('token123');
    removeGoogleAccessToken();
    expect(getGoogleAccessToken()).toBeNull();
  });

  test('getAuthToken returns null if not set', () => {
    expect(getAuthToken()).toBeNull();
  });

  test('getAuthToken returns token if set', () => {
    localStorage.setItem('gencare_auth_token', 'jwt123');
    expect(getAuthToken()).toBe('jwt123');
  });

  test('isAuthenticated returns true if JWT exists', () => {
    localStorage.setItem('gencare_auth_token', 'jwt123');
    expect(isAuthenticated()).toBe(true);
  });

  test('isAuthenticated returns false if JWT does not exist', () => {
    expect(isAuthenticated()).toBe(false);
  });

  test('clearAllTokens removes all related tokens', () => {
    localStorage.setItem('gencare_auth_token', 'jwt123');
    localStorage.setItem('google_access_token', 'token123');
    localStorage.setItem('user', 'user1');
    clearAllTokens();
    expect(localStorage.getItem('gencare_auth_token')).toBeNull();
    expect(localStorage.getItem('google_access_token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
}); 