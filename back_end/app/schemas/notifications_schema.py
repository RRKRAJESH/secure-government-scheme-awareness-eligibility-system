from pydantic import BaseModel, Field, constr
from typing import List, Optional, Any


class NotifierSchema(BaseModel):
    kind: str
    id: Optional[str] = None
    name: Optional[str] = None


class ReferenceSchema(BaseModel):
    kind: str
    id: str
    url: Optional[str] = None


class NotificationItemSchema(BaseModel):
    id: str = Field(...)
    notification_type: str
    is_seen: bool
    created_at: Optional[str] = None
    reference: Optional[ReferenceSchema] = None
    notifier: Optional[NotifierSchema] = None
    message: Optional[str] = None
    meta: Optional[Any] = None


class NotificationsData(BaseModel):
    notifications: List[NotificationItemSchema]
    total: int = 0
    page: int = 1
    page_size: int = 20
    total_pages: int = 0


class NotificationsListResponse(BaseModel):
    error: bool = False
    data: NotificationsData


class MarkReadSchema(BaseModel):
    notification_ids: List[str]


class MarkReadResponseData(BaseModel):
    updated: int


class MarkReadResponse(BaseModel):
    error: bool = False
    data: MarkReadResponseData


class MarkAllReadResponse(BaseModel):
    error: bool = False
    data: MarkReadResponseData
