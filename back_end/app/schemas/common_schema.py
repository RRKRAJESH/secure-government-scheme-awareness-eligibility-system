
from pydantic import BaseModel, Field, AfterValidator
from typing import Dict, Optional
from enum import Enum


class ErrorData(BaseModel):
    statusCode: int
    statusText: str
    errorData: Optional[Dict] = None
    errorMessage: str
    
class ErrorResponse(BaseModel):
    error: bool = True
    data: ErrorData