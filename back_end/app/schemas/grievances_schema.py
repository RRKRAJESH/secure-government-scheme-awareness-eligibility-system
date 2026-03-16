from pydantic import BaseModel, Field, constr
from typing import List, Optional
from enum import Enum


class PostType(str, Enum):
    GRIEVANCE = "GRIEVANCE"
    THOUGHT = "THOUGHT"


class CreatePostSchema(BaseModel):
    title: constr(min_length=5, max_length=200)
    description: constr(min_length=10, max_length=2000)
    post_type: Optional[PostType] = PostType.GRIEVANCE


class PostItemSchema(BaseModel):
    id: str = Field(...)
    user_id: Optional[str] = None
    username: Optional[str] = None
    title: str
    description: str
    post_type: Optional[str] = None
    posted_at: Optional[str] = None
    comments_count: int = 0


class PostsData(BaseModel):
    posts: List[PostItemSchema]
    total: int = 0
    page: int = 1
    page_size: int = 20
    total_pages: int = 0


class PostsListResponse(BaseModel):
    error: bool = False
    data: PostsData


class CommentItemSchema(BaseModel):
    _id: str
    user_id: Optional[str] = None
    commented_content: Optional[str] = None
    commented_at: Optional[str] = None
    id: Optional[str] = None


class CreateCommentSchema(BaseModel):
    commented_content: constr(min_length=1, max_length=1000)


class CreateCommentResponseData(BaseModel):
    comment: CommentItemSchema


class CreateCommentResponse(BaseModel):
    error: bool = False
    data: CreateCommentResponseData


class UpdateCommentSchema(BaseModel):
    commented_content: constr(min_length=1, max_length=1000)


class UpdateCommentResponseData(BaseModel):
    comment: CommentItemSchema


class UpdateCommentResponse(BaseModel):
    error: bool = False
    data: UpdateCommentResponseData


class PostDetailData(BaseModel):
    post: PostItemSchema
    comments: List[CommentItemSchema]


class PostDetailResponse(BaseModel):
    error: bool = False
    data: PostDetailData


class CreateResponseData(BaseModel):
    id: str


class CreateResponse(BaseModel):
    error: bool = False
    data: CreateResponseData


class UpdatePostSchema(BaseModel):
    title: Optional[constr(min_length=5, max_length=200)] = None
    description: Optional[constr(min_length=10, max_length=2000)] = None


class UpdateResponseData(BaseModel):
    post: PostItemSchema


class UpdateResponse(BaseModel):
    error: bool = False
    data: UpdateResponseData
