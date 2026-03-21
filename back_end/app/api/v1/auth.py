from fastapi import APIRouter, status, Depends, HTTPException

from app.schemas.auth_schema import RegisterUserSucessResponse, RegisterUserSchema, LoginSuccessResponse, LoginUser
from app.services.error import raise_http_error
from app.services.auth import register_user, login_user

router = APIRouter()

@router.post("/register", response_model= RegisterUserSucessResponse, status_code= status.HTTP_201_CREATED)
async def register_handler(payload: RegisterUserSchema):
    try:
        register_user_info = payload.model_dump()

        result = register_user(register_user_info_payload= register_user_info)
        
        return result

    except HTTPException:
        raise 
    
    except ValueError as e:
        raise_http_error(status_code= status.HTTP_400_BAD_REQUEST, 
                        message= f"{str(e)}"
                        )
    
    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}"
        )

@router.post("/login", response_model=LoginSuccessResponse, status_code= status.HTTP_200_OK)
async def login_handler(payload: LoginUser):
    try:
        login_user_info = payload.model_dump()

        result = login_user(login_user_info= login_user_info)

        return result
    
    except  HTTPException:
        raise

    except ValueError as e:
        raise_http_error(status_code= status.HTTP_400_BAD_REQUEST, 
                        message= f"{str(e)}"
                        )
    
    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}"
        )
