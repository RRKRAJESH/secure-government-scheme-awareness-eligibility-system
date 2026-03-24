from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Union

from app.utils.auth import verify_token
from app.services.users import list_users, delete_user
from app.schemas.common_schema import ErrorResponse

router = APIRouter()


@router.get("/list", response_model=Union[dict, ErrorResponse], status_code=status.HTTP_200_OK)
async def list_users_handler(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=200),
    sort_by: str = Query(None),
    sort_order: str = Query(None),
    token: dict = Depends(verify_token),
):
    try:
        # only admin role allowed to fetch full user list
        role = token.get("role")
        # role may be stored lowercase in the token; compare case-insensitively
        if not role or str(role).upper() != "ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        result = list_users(page=page, limit=limit, sort_by=sort_by, sort_order=sort_order)
        return {"error": False, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/delete", response_model=Union[dict, ErrorResponse], status_code=status.HTTP_200_OK)
async def delete_user_handler(body: dict, token: dict = Depends(verify_token)):
    try:
        role = token.get("role")
        if not role or str(role).upper() != "ADMIN":
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Not authorized")

        user_id = body.get("user_id")
        if not user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id is required")

        result = delete_user(user_id=str(user_id))
        return {"error": False, "data": result}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
