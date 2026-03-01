from pydantic import BaseModel, Field, AfterValidator, model_validator
from typing import Annotated, Any, List
from enum import Enum

from app.utils.custom_schema_validators import validate_phone, validate_email, validate_tn_pincode


class AppBaseModel(BaseModel):
    class Config:
        extra = "forbid"

class ProfileUpdateMessage(AppBaseModel):
    message: str = "profile info updated successfully"

class FarmerCategories(Enum):
    MARGINAL = "MARGINAL"
    SMALL = "SMALL"
    MEDIUM = "MEDIUM"
    LARGE = "LARGE"
    
class SocialCategories(Enum):
    SC = "SC"
    ST = "ST"
    OBC = "OBC"
    GENERAL = "GENERAL"
    EWS = "EWS"

class AgricultureTypes(Enum):
    CROP = "CROP"
    HORTICULTURE = "HORTICULTURE"
    ORGANIC = "ORGANIC"
    IRRIGATION = "IRRIGATION"
    FISHERIES = "FISHERIES"
    POULTRY = "POULTRY"
    DAIRY = "DAIRY"

class BankDetails(AppBaseModel):
    has_bank_account: bool = False
    has_kcc: bool = False

class IdentityDetails(AppBaseModel):
    has_aadhaar: bool = False

class ProfileUpdateSuccessMessageSchema(AppBaseModel):
    error: bool = False
    data: ProfileUpdateMessage

class ProfileInfoType(Enum):
    BASIC_INFO = "BASIC_INFO"
    COMMUNICATION_INFO = "COMMUNICATION_INFO"
    EDUCATION_INFO = "EDUCATION_INFO"
    BENEFICIARY_INFO = "BENEFICIARY_INFO"

class UpdateProfileBasicInfo(AppBaseModel):
    first_name: str = Field(min_length=3)
    middle_name: Annotated[str, Field(min_length= 3)] | None = None
    last_name: Annotated[str, Field(min_length= 3)]
    date_of_birth: str
    father_name: str = Field(min_length=3)
    mother_name: str = Field(min_length=3)

class UpdateProfileCommunicationInfo(AppBaseModel):
    phone: Annotated[str, AfterValidator(validate_phone)]
    email: Annotated[str, AfterValidator(validate_email)] | None = None
    district: str
    state: str
    country: str
    pincode: Annotated[int, AfterValidator(validate_tn_pincode)]

class UpdateProfileEducationInfo(AppBaseModel):
    has_qualified: bool = False
    qualification: Annotated[str, Field(min_length=2)] | None = None
    institution: Annotated[str, Field(min_length= 3)] | None = None
    year_of_passing: Annotated[int, Field(gt=1970)] | None = None
    percentage: Annotated[float, Field(gt=0.1)] | None = None

    @model_validator(mode="after")
    def validate_education_info(self):
        print("is qualified", self.has_qualified)
        if not self.has_qualified:
            return self

        required_fields = {
            "qualification": self.qualification,
            "institution": self.institution,
            "year_of_passing": self.year_of_passing,
            "percentage": self.percentage
        }

        missing = [field for field, value in required_fields.items() if value is None]

        if missing:
            raise ValueError(
                f"Missing required fields when has_qualified=True: {', '.join(missing)}"
            )

        return self


class UpdateBeneficiaryInfo(AppBaseModel):
    is_farmer: bool = False
    farmer_category: FarmerCategories | None = None
    land_holding: Annotated[int, Field(gt=0)] | None = None
    annual_income: Annotated[int, Field(gt=10000)] | None = None
    social_category: SocialCategories | None = None
    agriculture_type: List[AgricultureTypes] = Field(default_factory= list)
    primary_activity: AgricultureTypes | None = None
    banking_details: BankDetails | None = None
    identity_details: IdentityDetails | None = None

    @model_validator(mode="after")
    def validate_farmer_fields(self):
        if not self.is_farmer:
            return self

        required_fields = {
            "farmer_category": self.farmer_category,
            "social_category": self.social_category,    
            "agriculture_type": self.agriculture_type,
            "primary_activity": self.primary_activity,
            "banking_details": self.banking_details,
            "identity_details": self.identity_details,
        }

        missing = [field for field, value in required_fields.items() if value is None]

        if missing:
            raise ValueError(
                f"Missing required fields when is_farmer=True: {', '.join(missing)}"
            )

        return self


class ProfileUpdateSchema(AppBaseModel):
    profile_info_type: ProfileInfoType
    update_info: Any

    @model_validator(mode="after")
    def validate_source_info(self):
        mapping = {
            ProfileInfoType.BASIC_INFO: UpdateProfileBasicInfo,
            ProfileInfoType.COMMUNICATION_INFO: UpdateProfileCommunicationInfo,
            ProfileInfoType.EDUCATION_INFO: UpdateProfileEducationInfo,
            ProfileInfoType.BENEFICIARY_INFO: UpdateBeneficiaryInfo
        }

        model_cls = mapping.get(self.profile_info_type)
        if not model_cls:
            raise ValueError("Invalid Profile info type")

        self.update_info = model_cls.model_validate(self.update_info)
        return self

class ProfileCurrentStatusResponseData(AppBaseModel):
    basic_info: dict | None
    communication_info: dict | None
    education_info: dict | None
    beneficiary_info: dict | None

class ProfileCurrentStatusSchema(AppBaseModel):
    error: bool = False
    status_info: ProfileCurrentStatusResponseData
