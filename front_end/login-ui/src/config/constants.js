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

export const FARMER_CATEGORIES = [
  "MARGINAL",
  "SMALL",
  "SEMI_MEDIUM",
  "MEDIUM",
  "LARGE",
];

export const SOCIAL_CATEGORIES = ["SC", "ST", "OBC", "MBC", "GENERAL", "EWS"];

export const GENDERS = ["Male", "Female", "Other"];

export const SECTORS = ["AGRICULTURE", "DAIRY", "POULTRY", "FISHERIES"];

export const LAND_UNITS = ["ACRE", "HECTARE"];

export const CROP_NAMES = [
  "PADDY",
  "WHEAT",
  "MAIZE",
  "SUGARCANE",
  "COTTON",
  "GROUNDNUT",
  "MILLET",
  "PULSES",
  "VEGETABLES",
  "FRUITS",
  "OTHER",
];

export const FARM_TYPES = ["BACKYARD", "COMMERCIAL"];

export const WATER_BODY_ACCESS = ["OWNED", "LEASED", "COMMUNITY", "NONE"];

export const STORAGE_KEYS = {
  ACCESS_TOKEN: "access_token",
  ROLE: "role",
  USERNAME: "username",
};

export const ROUTES = {
  LOGIN: "/",
  SIGNUP: "/signup",
  HOME: "/home",
  DASHBOARD: "/dashboard",
  ADMIN: "/admin",
};

export const REGEX_PATTERNS = {
  PHONE: /^[6-9]\d{9}$/,
  EMAIL: /^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$/,
  POSTAL_CODE: /^[0-9]{6}$/,
};
