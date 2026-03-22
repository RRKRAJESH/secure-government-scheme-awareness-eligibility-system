from pydantic import BaseModel, Field, AfterValidator, model_validator
from typing import Annotated, List, Dict, Optional
from enum import Enum

from app.utils.custom_schema_validators import validate_phone, validate_email, validate_tn_pincode


class AppBaseModel(BaseModel):
    class Config:
        extra = "allow"


class ProfileUpdateMessage(AppBaseModel):
    message: str = "profile info updated successfully"


class Gender(str, Enum):
    MALE = "Male"
    FEMALE = "Female"
    OTHER = "Other"


class SocialCategories(str, Enum):
    SC = "SC"
    ST = "ST"
    OBC = "OBC"
    MBC = "MBC"
    GENERAL = "GENERAL"
    EWS = "EWS"


class FarmerCategories(str, Enum):
    MARGINAL = "MARGINAL"
    SMALL = "SMALL"
    SEMI_MEDIUM = "SEMI_MEDIUM"
    MEDIUM = "MEDIUM"
    LARGE = "LARGE"


class LandUnit(str, Enum):
    ACRE = "ACRE"
    HECTARE = "HECTARE"


class CropName(str, Enum):
    PADDY = "PADDY"
    WHEAT = "WHEAT"
    MAIZE = "MAIZE"
    SUGARCANE = "SUGARCANE"
    COTTON = "COTTON"
    GROUNDNUT = "GROUNDNUT"
    MILLET = "MILLET"
    PULSES = "PULSES"
    VEGETABLES = "VEGETABLES"
    FRUITS = "FRUITS"
    OTHER = "OTHER"


class FarmType(str, Enum):
    BACKYARD = "BACKYARD"
    COMMERCIAL = "COMMERCIAL"


class WaterBodyAccess(str, Enum):
    OWNED = "OWNED"
    LEASED = "LEASED"
    COMMUNITY = "COMMUNITY"


class ProfileUpdateSuccessMessageSchema(AppBaseModel):
    error: bool = False
    data: ProfileUpdateMessage


# --- Nested sub-models for profile ---

class BasicInfo(BaseModel):
    class Config:
        extra = "allow"
    name: str = Field(min_length=3, description="Full name")
    gender: Gender
    dob: str = Field(description="Date of birth YYYY-MM-DD")
    age: Optional[int] = None
    social_category: SocialCategories
    sub_caste: Optional[str] = None
    physically_challenged: bool = False


class CommunicationInfo(BaseModel):
    class Config:
        extra = "allow"
    phone: Annotated[str, AfterValidator(validate_phone)]
    email: Annotated[Optional[str], AfterValidator(validate_email)] = None


class AddressInfo(BaseModel):
    class Config:
        extra = "allow"
    country: str = Field(default="India")
    state: str = Field(default="TAMIL_NADU")
    district: str = Field(min_length=2)
    pincode: Annotated[int, AfterValidator(validate_tn_pincode)]
    door_no: Optional[str] = None
    address_line_1: str = Field(min_length=3)
    address_line_2: Optional[str] = None


class EconomicInfo(BaseModel):
    class Config:
        extra = "allow"
    annual_income: Optional[int] = None


class SectorFlags(BaseModel):
    class Config:
        extra = "allow"
    AGRICULTURE: bool = False
    DAIRY: bool = False
    POULTRY: bool = False
    FISHERIES: bool = False


# --- Agriculture sub-models ---

class CropSowingDetails(BaseModel):
    class Config:
        extra = "allow"
    cropNamesEnum: Optional[List[CropName]] = None
    cropNamesOther: Optional[List[str]] = None


class AgricultureInfo(BaseModel):
    class Config:
        extra = "allow"
    farmer_category: Optional[FarmerCategories] = None
    hasLand: bool = False
    landArea: Optional[float] = None
    landUnit: Optional[LandUnit] = None
    cropSowingDetails: Optional[CropSowingDetails] = None


# --- Dairy sub-model ---

class DairyInfo(BaseModel):
    class Config:
        extra = "allow"
    cattleCount: Optional[int] = None
    milkProducer: bool = False
    hasShed: bool = False


# --- Poultry sub-model ---

class PoultryInfo(BaseModel):
    class Config:
        extra = "allow"
    birdCount: Optional[int] = None
    farmType: Optional[FarmType] = None
    hasShed: bool = False


# --- Beneficiary Info ---

class BeneficiaryInfo(BaseModel):
    class Config:
        extra = "allow"
    are_you_farmer: bool = False
    sectors: Optional[SectorFlags] = None
    agriculture_info: Optional[AgricultureInfo] = None
    dairy_info: Optional[DairyInfo] = None
    poultry: Optional[PoultryInfo] = None


# --- Fisheries (at profile level) ---

class AquacultureInfo(BaseModel):
    class Config:
        extra = "allow"
    active: bool = False
    pondArea: Optional[float] = None
    unit: Optional[LandUnit] = None


class FisheriesInfo(BaseModel):
    class Config:
        extra = "allow"
    waterBodyAccess: Optional[WaterBodyAccess] = None
    aquaculture: Optional[AquacultureInfo] = None


# --- Profile Data ---

class ProfileData(BaseModel):
    class Config:
        extra = "allow"
    basic_info: BasicInfo
    communication_info: CommunicationInfo
    address_info: AddressInfo
    economic_info: Optional[EconomicInfo] = None
    beneficiary_info: Optional[BeneficiaryInfo] = None
    fisheries: Optional[FisheriesInfo] = None


# --- Registrations ---

class DocExists(BaseModel):
    class Config:
        extra = "allow"
    exists: bool = False


class FpoReg(BaseModel):
    class Config:
        extra = "allow"
    isMember: bool = False
    registrationDocsExist: bool = False


class Registrations(BaseModel):
    class Config:
        extra = "allow"
    farmerId: Optional[DocExists] = None
    livestockRegistration: Optional[DocExists] = None
    fisheriesLicense: Optional[DocExists] = None
    fpo: Optional[FpoReg] = None


# --- Exclusions ---

class Exclusions(BaseModel):
    class Config:
        extra = "allow"
    paidIncomeTaxLastAssessmentYear: Optional[bool] = None
    isInstitutionalLandholder: Optional[bool] = None
    isGovernmentEmployeeExcluded: Optional[bool] = None
    monthlyPensionAmount: Optional[float] = None
    isExcludedProfessionalCategory: Optional[bool] = None


# --- Main update schema ---

class ProfileUpdateSchema(AppBaseModel):
    profile: ProfileData
    registrations: Optional[Registrations] = None
    exclusions: Optional[Exclusions] = None


# Response schema for current profile status (returns full nested data)
class ProfileCurrentStatusSchema(AppBaseModel):
    error: bool = False
    profile_info: Optional[dict] = None
    is_profile_complete: bool = False
