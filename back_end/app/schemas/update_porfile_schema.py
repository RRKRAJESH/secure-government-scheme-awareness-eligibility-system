from pydantic import BaseModel, Field, AfterValidator, model_validator
from typing import Annotated, Any
from enum import Enum


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
    midddle_name: Annotated[str, Field(min_length= 3)] | None = None
    last_name: Annotated[str, Field(min_length= 3)]
    date_of_birth: str
    father_name: str = Field(min_length=3)
    mother_name: str = Field(min_length=3)

class ProfileUpdateSchema(AppBaseModel):
    profile_info_type: ProfileInfoType
    update_info: Any

    @model_validator(mode="after")
    def validate_source_info(self):
        mapping = {
            ProfileInfoType.BASIC_INFO: UpdateProfileBasicInfo,
        }

        model_cls = mapping.get(self.profile_info_type)
        if not model_cls:
            raise ValueError("Invalid Profile info type")

        self.update_info = model_cls.model_validate(self.update_info)
        return self