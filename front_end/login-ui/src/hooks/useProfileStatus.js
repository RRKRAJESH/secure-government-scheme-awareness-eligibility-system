import { useState, useEffect, useCallback, useRef } from "react";
import useApi from "./useApi";
import API_ENDPOINTS from "../config/api.config";

/**
 * Custom hook to fetch and manage profile status
 * Works with flat profile structure
 */
export const useProfileStatus = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProfileComplete, setIsProfileComplete] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const { apiRequest } = useApi();
  const apiRequestRef = useRef(apiRequest);
  apiRequestRef.current = apiRequest;

  const fetchProfileStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequestRef.current(
        API_ENDPOINTS.PROFILE_STATUS,
        "GET"
      );

      setProfileData(data.profile_info);
      setIsProfileComplete(data.is_profile_complete || false);
    } catch (err) {
      setError(err.message || "Failed to fetch profile status");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch profile status on mount and when refreshKey changes
  useEffect(() => {
    fetchProfileStatus();
  }, [fetchProfileStatus, refreshKey]);

  // Listen for global profile update events so multiple components can refresh
  useEffect(() => {
    const handler = () => {
      fetchProfileStatus();
    };
    window.addEventListener("profileUpdated", handler);
    return () => window.removeEventListener("profileUpdated", handler);
  }, [fetchProfileStatus]);

  // Trigger refetch by incrementing refreshKey
  const refetch = useCallback(() => {
    setRefreshKey((prev) => prev + 1);
  }, []);

  return {
    profileData,
    loading,
    error,
    isProfileComplete,
    refetch,
  };
};

export default useProfileStatus;
