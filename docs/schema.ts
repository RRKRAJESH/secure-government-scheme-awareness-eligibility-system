import { ObjectId } from "mongodb";

// Admin User

interface adminUserSchema {
  user_id: string;
  password: string; // Encryption format
  is_active: boolean; // by default true
  last_login_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Beneficiary User

interface beneficiaryUserSchema {
  user_id: string;
  password: string; // Encryption format
  is_active: boolean;
  user_profile_updated: boolean; //by default false
  user_profile_id: ObjectId;
  last_login_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Beneficiary Profile

interface personalInfo {
  fullname: string;
  date_of_birth: string;
  father_name: string;
  mother_name: string;
}

interface addressInfo {
  door_no: string;
  address_line1: string;
  address_line2: string;
  taluk: string;
  district: string;
  state: string; // by default tamil nadu
  country: string; // by default India
  postal_code: number;
}

interface educationInfo {
  last_qualification: "10" | "12" | "Bachelors" | "Masters" | "Engineering";
}

interface communicationInfo {
  phone_number: string;
  email_id: string;
  address: addressInfo;
}

interface agroInfo {
  // To Be Announced
}

interface beneficiaryProfileUserSchema {
  beneficiary_user_id: ObjectId;
  personal_info: personalInfo;
  communication_info: communicationInfo;
  education_info: educationInfo;
  beneficiary_type:
    | "CROP_FARMING"
    | "FISHING"
    | "ANIMAL_HUSBANDARY"
    | "HORTICULTURE"
    | "SERI_CULTURE"
    | "API_CULTURE"
    | "FORESTRY";
  agro_details: agroInfo;
  created_at: Date;
  updated_at: Date;
}

// Category Schema

interface categorySchema {
  name: string;
  description: string;
  number_of_schemes: number;
  last_updated_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Schema Schema

interface schemeSchema {
  category_id: ObjectId;
  name: string;
  description: string;
  released_date: Date;
  ministry: string;
  beneficiary_type:
    | "CROP_FARMING"
    | "FISHING"
    | "ANIMAL_HUSBANDARY"
    | "HORTICULTURE"
    | "SERI_CULTURE"
    | "API_CULTURE"
    | "FORESTRY";
  active_status: boolean;
  benefits: string;
  application_mode: "OFFLINE | ONLINE";
  eligibility_id: ObjectId;
  created_at: Date;
  updated_at: Date;
}

// Eligibility Rule

interface ageEligible {
  minium_age: number;
}

interface eligbilitySchema {
  scheme_id: ObjectId;
  age: ageEligible;
  yearly_income: number;
}
