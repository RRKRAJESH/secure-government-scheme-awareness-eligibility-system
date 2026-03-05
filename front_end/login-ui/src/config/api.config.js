// API Configuration
const API_BASE_URL = "http://localhost:4545";

export const API_ENDPOINTS = {
  // ============= AUTH ENDPOINTS =============
  // POST /auth/login
  // Request: { email/phone, password, login_type: "EMAIL" | "PHONE" }
  // Response: { access_token, token_type, user: { id, role } }
  AUTH_LOGIN: `${API_BASE_URL}/api/v1/backend/auth/login`,

  // POST /auth/register
  // Request: { email, password, phone, login_type: "EMAIL" | "PHONE" }
  // Response: { access_token, token_type, message }
  AUTH_REGISTER: `${API_BASE_URL}/api/v1/backend/auth/register`,

  // ============= PROFILE ENDPOINTS =============
  // GET /profile/current-status
  // Headers: Authorization: Bearer {token}
  // Response: { status_info: { basic_info, communication_info, education_info, beneficiary_info } }
  PROFILE_STATUS: `${API_BASE_URL}/api/v1/backend/profile/current-status`,

  // POST /profile/update
  // Headers: Authorization: Bearer {token}
  // Request: { profile_info_type, update_info: {...} }
  // Response: { message, status }
  PROFILE_UPDATE: `${API_BASE_URL}/api/v1/backend/profile/update`,

  // ============= GRIEVANCES ENDPOINTS =============
  // GET /grievances/list
  // Headers: Authorization: Bearer {token}
  // Response: { grievances: [{ id, title, description, posted_at, comments_count }] }
  GRIEVANCES_LIST: `${API_BASE_URL}/api/v1/backend/grievances/list`,

  // POST /grievances/create
  // Headers: Authorization: Bearer {token}
  // Request: { title, description }
  // Response: { id, message }
  GRIEVANCES_CREATE: `${API_BASE_URL}/api/v1/backend/grievances/create`,

  // ============= THOUGHTS ENDPOINTS =============
  // GET /thoughts/list
  // Headers: Authorization: Bearer {token}
  // Response: { thoughts: [{ id, title, description, posted_at, comments_count }] }
  THOUGHTS_LIST: `${API_BASE_URL}/api/v1/backend/thoughts/list`,

  // POST /thoughts/create
  // Headers: Authorization: Bearer {token}
  // Request: { title, description }
  // Response: { id, message }
  THOUGHTS_CREATE: `${API_BASE_URL}/api/v1/backend/thoughts/create`,

  // ============= NOTIFICATIONS ENDPOINTS =============
  // GET /notifications/list
  // Headers: Authorization: Bearer {token}
  // Response: { notifications: [{ id, title, description, posted_at, unread: boolean }] }
  NOTIFICATIONS_LIST: `${API_BASE_URL}/api/v1/backend/notifications/list`,

  // POST /notifications/mark-read
  // Headers: Authorization: Bearer {token}
  // Request: { notification_id } or { notification_ids: [...] }
  // Response: { message, updated_count }
  NOTIFICATIONS_MARK_READ: `${API_BASE_URL}/api/v1/backend/notifications/mark-read`,

  // ============= SCHEMES ENDPOINTS =============
  // GET /schemes/search?query=keyword
  // Headers: Authorization: Bearer {token}
  // Response: { schemes: [{ id, name, description, category, eligibility, benefits }] }
  SCHEMES_SEARCH: `${API_BASE_URL}/api/v1/backend/schemes/search`,

  // GET /schemes/categories
  // Headers: Authorization: Bearer {token}
  // Response: { categories: [{ id, name, description }] }
  SCHEMES_CATEGORIES: `${API_BASE_URL}/api/v1/backend/schemes/categories`,
};

export default API_ENDPOINTS;
