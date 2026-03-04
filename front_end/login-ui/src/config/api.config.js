// API Configuration
const API_BASE_URL = "http://localhost:4545";

export const API_ENDPOINTS = {
  // Auth endpoints
  AUTH_LOGIN: `${API_BASE_URL}/api/v1/backend/auth/login`,
  AUTH_REGISTER: `${API_BASE_URL}/api/v1/backend/auth/register`,

  // Profile endpoints
  PROFILE_STATUS: `${API_BASE_URL}/api/v1/backend/profile/current-status`,
  PROFILE_UPDATE: `${API_BASE_URL}/api/v1/backend/profile/update`,

  // Grievances and Thoughts endpoints
  GRIEVANCES_LIST: `${API_BASE_URL}/api/v1/backend/grievances/list`,
  GRIEVANCES_CREATE: `${API_BASE_URL}/api/v1/backend/grievances/create`,
  THOUGHTS_LIST: `${API_BASE_URL}/api/v1/backend/thoughts/list`,
  THOUGHTS_CREATE: `${API_BASE_URL}/api/v1/backend/thoughts/create`,
};

export default API_ENDPOINTS;
