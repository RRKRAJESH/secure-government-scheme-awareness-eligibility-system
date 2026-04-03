from fastapi import APIRouter, status, Depends
from typing import Union

from app.services.error import raise_http_error
from app.schemas.update_porfile_schema import (
    ProfileUpdateSuccessMessageSchema,
    ProfileUpdateSchema,
    ProfileCurrentStatusSchema,
)
from app.schemas.common_schema import ErrorResponse
from app.utils.auth import verify_token
from app.services.update_profile import update_profile_info, get_current_profile_info

router = APIRouter()


@router.post(
    "/update",
    response_model=Union[ProfileUpdateSuccessMessageSchema, ErrorResponse],
    status_code=status.HTTP_202_ACCEPTED,
)
async def update_profile_handler(
    payload: ProfileUpdateSchema, token: str = Depends(verify_token)
):
    """Update user profile with nested structure"""
    try:
        input_data = payload.model_dump(exclude_none=True)
        update_profile_info(update_payload=input_data, token=token)

        return {
            "error": False,
            "data": {"message": "profile info updated successfully"},
        }

    except ValueError as e:
        raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message=f"{str(e)}")

    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}",
        )


@router.get(
    "/current-status",
    response_model=Union[ProfileCurrentStatusSchema, ErrorResponse],
    status_code=status.HTTP_200_OK,
)
async def profile_current_status_handler(token: str = Depends(verify_token)):
    """Get current user profile status"""
    try:
        result = get_current_profile_info(token)
        return {
            "error": False,
            "profile_info": result.get("profile_info"),
            "is_profile_complete": result.get("is_profile_complete", False),
        }

    except ValueError as e:
        raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message=f"{str(e)}")

    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}",
        )
