import { useState, useEffect, useCallback } from "react";
import { useApi } from "./useApi";
import API_ENDPOINTS from "../config/api.config";

/**
 * Custom hook to fetch and manage profile status
 * Prevents infinite rendering by properly handling dependencies
 */
export const useProfileStatus = () => {
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isProfileComplete, setIsProfileComplete] = useState(false);

  const { apiRequest } = useApi();

  const fetchProfileStatus = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiRequest(API_ENDPOINTS.PROFILE_STATUS, "GET");

      setProfileData(data);

      // Calculate completion percentage
      let completedSections = 0;
      const totalSections = 3;

      if (data.status_info?.basic_info) completedSections++;
      if (data.status_info?.communication_info) completedSections++;
      if (data.status_info?.education_info) completedSections++;

      const percent = Math.round((completedSections / totalSections) * 100);
      setProfileCompletion(percent);

      // Check if all sections are complete
      const allComplete =
        data.status_info?.basic_info &&
        data.status_info?.communication_info &&
        data.status_info?.education_info &&
        data.status_info?.beneficiary_info;

      setIsProfileComplete(!!allComplete);
    } catch (err) {
      setError(err.message || "Failed to fetch profile status");
      console.error("Profile fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [apiRequest]);

  // Fetch profile status on mount only
  useEffect(() => {
    fetchProfileStatus();
  }, []);

  return {
    profileData,
    loading,
    error,
    profileCompletion,
    isProfileComplete,
    refetch: fetchProfileStatus,
  };
};

export default useProfileStatus;
