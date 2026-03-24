import { useAuth } from "./useAuth";
import { normalizeApiTimestampsToIST } from "../utils/dateFormat";

const extractErrorDetails = (payload) => {
  const detail = payload?.detail;
  const errorData = detail?.data || payload?.data || {};

  return {
    message:
      errorData.errorMessage ||
      detail?.errorMessage ||
      payload?.message ||
      detail ||
      "Something went wrong",
    statusCode: errorData.statusCode || payload?.statusCode || null,
    reason: errorData.errorData?.reason || payload?.reason || null,
    errorData: errorData.errorData || payload?.errorData || {},
  };
};

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
        const details = extractErrorDetails(data);
        const apiError = new Error(details.message);
        apiError.statusCode = details.statusCode;
        apiError.reason = details.reason;
        apiError.errorData = details.errorData;
        throw apiError;
      }

      return data;
    } catch (error) {
      throw error;
    }
  };

  return { apiRequest };
};

export default useApi;
