from pydantic import BaseModel, Field, AfterValidator, model_validator
from typing import Annotated, List
from enum import Enum

from app.utils.custom_schema_validators import validate_phone, validate_email, validate_tn_pincode


class AppBaseModel(BaseModel):
    class Config:
        extra = "forbid"


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
    OC = "OC"


class FarmerCategories(str, Enum):
    MARGINAL = "MARGINAL"
    SMALL = "SMALL"
    MEDIUM = "MEDIUM"
    LARGE = "LARGE"


class AgricultureTypes(str, Enum):
    CROP = "CROP"
    HORTICULTURE = "HORTICULTURE"
    ORGANIC = "ORGANIC"
    IRRIGATION = "IRRIGATION"
    FISHERIES = "FISHERIES"
    POULTRY = "POULTRY"
    DAIRY = "DAIRY"


class ProfileUpdateSuccessMessageSchema(AppBaseModel):
    error: bool = False
    data: ProfileUpdateMessage


# Flat profile update schema
class ProfileUpdateSchema(AppBaseModel):
    # Personal Info
    name: str = Field(min_length=3, description="Full name of the user")
    dob: str = Field(description="Date of birth in YYYY-MM-DD format")
    gender: Gender
    
    # Contact Info
    phone: Annotated[str, AfterValidator(validate_phone)]
    email: Annotated[str, AfterValidator(validate_email)] | None = None
    
    # Address Info
    door_no: str = Field(min_length=3)
    address_line_1: str = Field(min_length=3)
    address_line_2: str | None = None
    district: str = Field(min_length=2)
    state: str = Field(default="Tamil Nadu")
    country: str = Field(default="India")
    pincode: Annotated[int, AfterValidator(validate_tn_pincode)]
    
    # Additional Info
    physically_challenged: bool = False
    social_category: SocialCategories
    sub_caste: str | None = None
    annual_income: Annotated[int, Field(gt=12000)] | None = None
    
    # Farmer Info
    are_you_farmer: bool = False
    farmer_category: FarmerCategories | None = None
    agriculture_types: List[AgricultureTypes] = Field(default_factory=list)
    land_holding: Annotated[float, Field(gt=0)] | None = None

    @model_validator(mode="after")
    def validate_farmer_fields(self):
        if not self.are_you_farmer:
            return self

        required_fields = {
            "farmer_category": self.farmer_category,
            "land_holding": self.land_holding,
        }

        missing = [field for field, value in required_fields.items() if value is None]

        if missing:
            raise ValueError(
                f"Missing required fields when are_you_farmer=True: {', '.join(missing)}"
            )

        if not self.agriculture_types:
            raise ValueError("agriculture_types is required when are_you_farmer=True")

        return self


# Response schema for current profile status
class ProfileCurrentStatusResponseData(AppBaseModel):
    name: str | None = None
    dob: str | None = None
    gender: str | None = None
    phone: str | None = None
    email: str | None = None
    door_no: str | None = None
    address_line_1: str | None = None
    address_line_2: str | None = None
    district: str | None = None
    state: str | None = None
    country: str | None = None
    pincode: int | None = None
    physically_challenged: bool | None = None
    social_category: str | None = None
    sub_caste: str | None = None
    annual_income: int | None = None
    are_you_farmer: bool | None = None
    farmer_category: str | None = None
    agriculture_types: List[str] | None = None
    land_holding: float | None = None


class ProfileCurrentStatusSchema(AppBaseModel):
    error: bool = False
    profile_info: ProfileCurrentStatusResponseData | dict | None = None
    is_profile_complete: bool = False
