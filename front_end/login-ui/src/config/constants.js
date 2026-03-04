// Application Constants

export const ROLES = {
  USER: "USER",
  ADMIN: "ADMIN",
};

export const ROLE_COLORS = {
  [ROLES.ADMIN]: "#fa8c16",
  [ROLES.USER]: "#52c41a",
};

export const DISTRICTS = [
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanniyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupattur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
];

export const QUALIFICATIONS = ["SSLC", "HSC", "DIPLOMA", "UG", "PG"];

export const FARMER_CATEGORIES = ["MARGINAL", "SMALL", "MEDIUM", "LARGE"];

export const SOCIAL_CATEGORIES = ["SC", "ST", "OBC", "GENERAL", "EWS"];

export const AGRICULTURE_TYPES = [
  "CROP",
  "HORTICULTURE",
  "ORGANIC",
  "IRRIGATION",
  "FISHERIES",
  "POULTRY",
  "DAIRY",
];

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  ROLE: "role",
};

export const ROUTES = {
  LOGIN: "/",
  SIGNUP: "/signup",
  HOME: "/home",
  DASHBOARD: "/dashboard",
  UPDATE_PROFILE: "/update-profile",
  ADMIN: "/admin",
};

export const REGEX_PATTERNS = {
  PHONE: /^[6-9]\d{9}$/,
  EMAIL: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$/,
  POSTAL_CODE: /^[0-9]{6}$/,
};

export const PROFILE_SECTIONS = {
  BASIC_INFO: "BASIC_INFO",
  COMMUNICATION_INFO: "COMMUNICATION_INFO",
  EDUCATION_INFO: "EDUCATION_INFO",
  BENEFICIARY_INFO: "BENEFICIARY_INFO",
};
