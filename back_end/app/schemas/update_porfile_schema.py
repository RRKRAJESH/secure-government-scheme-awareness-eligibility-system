from pydantic import BaseModel, Field, AfterValidator, model_validator
from typing import Annotated, Any
from enum import Enum

from app.utils.custom_schema_validators import validate_phone, validate_email, validate_tn_pincode


class AppBaseModel(BaseModel):
    class Config:
        extra = "forbid"

class ProfileUpdateMessage(AppBaseModel):
    message: str = "profile info updated successfully"

class ProfileUpdateSuccessMessageSchema(AppBaseModel):
    error: bool = False
    data: ProfileUpdateMessage

class ProfileInfoType(Enum):
    BASIC_INFO = "BASIC_INFO"
    COMMUNICATION_INFO = "COMMUNICATION_INFO"
    EDUCATION_INFO = "EDUCATION_INFO"

class UpdateProfileBasicInfo(AppBaseModel):
    first_name: str = Field(min_length=3)
    middle_name: Annotated[str, Field(min_length= 3)] | None = None
    last_name: Annotated[str, Field(min_length= 3)]
    date_of_birth: str
    father_name: str = Field(min_length=3)
    mother_name: str = Field(min_length=3)

class UpdateProfileCommunicationInfo(AppBaseModel):
    phone: Annotated[str, AfterValidator(validate_phone)]
    email: Annotated[str, AfterValidator(validate_email)]
    district: str
    state: str
    country: str
    pincode: Annotated[int, AfterValidator(validate_tn_pincode)]

class UpdateProfileEducationInfo(AppBaseModel):
    qualification: Annotated[str, Field(min_length=2)] | None = None
    institution: Annotated[str, Field(min_length= 3)] | None =  None
    year_of_passing: Annotated[int, Field(gt=1970)] | None = None
    percentage: Annotated[float, Field(gt=0.1)] | None = None


class ProfileUpdateSchema(AppBaseModel):
    profile_info_type: ProfileInfoType
    update_info: Any

    @model_validator(mode="after")
    def validate_source_info(self):
        mapping = {
            ProfileInfoType.BASIC_INFO: UpdateProfileBasicInfo,
            ProfileInfoType.COMMUNICATION_INFO: UpdateProfileCommunicationInfo,
            ProfileInfoType.EDUCATION_INFO: UpdateProfileEducationInfo
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

class ProfileCurrentStatusSchema(AppBaseModel):
    error: bool = False
    status_info: ProfileCurrentStatusResponseData
