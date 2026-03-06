import { STORAGE_KEYS } from "../config/constants";

/**
 * Custom hook to manage authentication state and functions
 * Avoids infinite rendering by using localStorage directly
 */
export const useAuth = () => {
  const getToken = () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const getRole = () => localStorage.getItem(STORAGE_KEYS.ROLE);

  // Decode JWT token to get user info (username, user_id, role)
  const getTokenPayload = () => {
    const token = getToken();
    if (!token) return null;
    try {
      const payload = token.split('.')[1];
      return JSON.parse(atob(payload));
    } catch {
      return null;
    }
  };

  const getUsername = () => {
    const payload = getTokenPayload();
    return payload?.username || null;
  };

  const isAuthenticated = () => !!getToken();

  const login = (token, role) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
  };

  const logout = () => {
    localStorage.clear();
  };

  return {
    getToken,
    getRole,
    getUsername,
    getTokenPayload,
    isAuthenticated,
    login,
    logout,
  };
};

export default useAuth;
