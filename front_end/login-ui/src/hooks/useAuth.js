import { STORAGE_KEYS } from "../config/constants";

/**
 * Custom hook to manage authentication state and functions
 * Avoids infinite rendering by using localStorage directly
 */
export const useAuth = () => {
  const getToken = () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const getRole = () => localStorage.getItem(STORAGE_KEYS.ROLE);

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
    isAuthenticated,
    login,
    logout,
  };
};

export default useAuth;
