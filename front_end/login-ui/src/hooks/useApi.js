import { useAuth } from "./useAuth";
import { normalizeApiTimestampsToIST } from "../utils/dateFormat";

/**
 * Custom hook for API requests with automatic token handling
 * Reduces code duplication in components
 */
export const useApi = () => {
  const { getToken } = useAuth();

  const apiRequest = async (url, method = "GET", body = null) => {
    const token = getToken();

    const config = {
      method,
      headers: {
        "Content-Type": "application/json",
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    if (body) {
      config.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, config);
      const data = normalizeApiTimestampsToIST(await response.json());

      if (!response.ok) {
        throw new Error(data.detail || data.message || "Something went wrong");
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  return { apiRequest };
};

export default useApi;
