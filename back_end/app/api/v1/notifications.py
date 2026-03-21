from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional

from app.utils.auth import verify_token
from app.services.notifications import (
    get_user_notifications,
    mark_notifications_read,
    mark_all_read,
    create_notification,
)
from app.schemas.notifications_schema import (
    NotificationsListResponse,
    MarkReadSchema,
    MarkReadResponse,
    MarkAllReadResponse,
)
from app.schemas.common_schema import ErrorResponse

router = APIRouter()


@router.get("/list", response_model=Optional[NotificationsListResponse], status_code=status.HTTP_200_OK)
async def list_notifications_handler(page: int = Query(1, ge=1), pageSize: int = Query(20, alias="pageSize", ge=1, le=200), token: dict = Depends(verify_token)):
    try:
        user_id = token.get("user_id")
        data = get_user_notifications(user_id, page=page, page_size=pageSize)
        return {"error": False, "data": data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mark-read", response_model=MarkReadResponse, status_code=status.HTTP_200_OK)
async def mark_read_handler(payload: MarkReadSchema, token: dict = Depends(verify_token)):
    try:
        user_id = token.get("user_id")
        input_data = payload.model_dump()
        ids = input_data.get("notification_ids") or []
        res = mark_notifications_read(user_id, ids)
        return {"error": False, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/mark-all-read", response_model=MarkAllReadResponse, status_code=status.HTTP_200_OK)
async def mark_all_read_handler(token: dict = Depends(verify_token)):
    try:
        user_id = token.get("user_id")
        res = mark_all_read(user_id)
        return {"error": False, "data": res}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
