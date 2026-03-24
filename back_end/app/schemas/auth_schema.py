from pydantic import BaseModel, Field, AfterValidator
from typing import Annotated
from enum import Enum

class UserRoles(str, Enum):
    ADMIN = "ADMIN"
    USER = "USER"

class RegisterUserSchema(BaseModel):
    username: str = Field(min_length= 3)
    password: str = Field(min_length=3)
    role: UserRoles

class LoginUser(BaseModel):
    username: str = Field(min_length=3)
    password: str = Field(min_length=3)

class LoginSuccessResponseData(BaseModel):
    access_token: str

class LoginSuccessResponse(BaseModel):
    error: bool = False
    data: LoginSuccessResponseData 

class RegisterUserSuccessResponseData(BaseModel):
    message: str
    acknowledgment: bool = True

class RegisterUserSucessResponse(BaseModel):
    error: bool = False
    data: RegisterUserSuccessResponseData
