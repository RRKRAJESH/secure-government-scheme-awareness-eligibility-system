import { STORAGE_KEYS } from "../config/constants";

/**
 * Custom hook to manage authentication state and functions
 * Avoids infinite rendering by using localStorage directly
 */
export const useAuth = () => {
  const getToken = () => localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);

  const getRole = () => localStorage.getItem(STORAGE_KEYS.ROLE);
  const getStoredUsername = () => localStorage.getItem(STORAGE_KEYS.USERNAME);

  // Decode JWT token to get user info (username, user_id, role)
  const getTokenPayload = () => {
    const token = getToken();
    if (!token) return null;
    try {
      const payloadPart = token.split(".")[1];
      if (!payloadPart) return null;

      // JWT payload uses base64url; convert it to standard base64 before decoding.
      const base64 = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
      const decoded = atob(padded);
      const json = decodeURIComponent(
        Array.prototype.map
          .call(
            decoded,
            (char) => `%${`00${char.charCodeAt(0).toString(16)}`.slice(-2)}`
          )
          .join("")
      );
      return JSON.parse(json);
    } catch {
      return null;
    }
  };

  const getUsername = () => {
    const payload = getTokenPayload();
    return (
      payload?.username ||
      payload?.user_name ||
      payload?.userName ||
      payload?.name ||
      payload?.sub ||
      getStoredUsername() ||
      null
    );
  };

  const isAuthenticated = () => !!getToken();

  const login = (token, role, username = null) => {
    localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, token);
    localStorage.setItem(STORAGE_KEYS.ROLE, role);
    if (username) {
      localStorage.setItem(STORAGE_KEYS.USERNAME, username);
      return;
    }

    const payload = getTokenPayload();
    const tokenUsername =
      payload?.username ||
      payload?.user_name ||
      payload?.userName ||
      payload?.name ||
      payload?.sub;
    if (tokenUsername) {
      localStorage.setItem(STORAGE_KEYS.USERNAME, tokenUsername);
    }
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
