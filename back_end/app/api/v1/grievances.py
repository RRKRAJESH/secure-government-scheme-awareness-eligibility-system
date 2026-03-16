from fastapi import APIRouter, Depends, HTTPException, status, Query
from typing import Optional, Union

from app.utils.auth import verify_token
from app.services.grievances import (
    get_user_posts,
    create_post,
    get_post_with_comments,
    create_comment,
    update_post,
)
from app.schemas.grievances_schema import (
    CreatePostSchema,
    PostsListResponse,
    PostDetailResponse,
    CreateResponse,
    PostType,
    UpdatePostSchema,
    UpdateResponse,
)
from app.schemas.grievances_schema import CreateCommentSchema, CreateCommentResponse
from app.schemas.common_schema import ErrorResponse

router = APIRouter()


@router.get("/list", response_model=Union[PostsListResponse, ErrorResponse], status_code=status.HTTP_200_OK)
async def list_grievances_handler(
    postType: Optional[PostType] = Query(None, alias="postType"),
    page: int = Query(1, ge=1),
    pageSize: int = Query(20, alias="pageSize", ge=1, le=100),
    token: dict = Depends(verify_token),
):
    try:
        user_id = token.get("user_id")
        posts_data = get_user_posts(user_id, post_type=postType.value if postType else None, page=page, page_size=pageSize)
        return {"error": False, "data": posts_data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/create", response_model=Union[CreateResponse, ErrorResponse], status_code=status.HTTP_201_CREATED)
async def create_grievance_handler(payload: CreatePostSchema, token: dict = Depends(verify_token)):
    try:
        user_id = token.get("user_id")
        input_data = payload.model_dump()
        res = create_post(user_id, input_data["title"], input_data["description"], input_data.get("post_type"))
        return {"error": False, "data": res}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/detail/{post_id}", response_model=Union[PostDetailResponse, ErrorResponse], status_code=status.HTTP_200_OK)
async def grievance_detail_handler(post_id: str, token: dict = Depends(verify_token)):
    try:
        res = get_post_with_comments(post_id)
        return {"error": False, "data": res}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{post_id}/comment", response_model=Union[CreateCommentResponse, ErrorResponse], status_code=status.HTTP_201_CREATED)
async def create_comment_handler(post_id: str, payload: CreateCommentSchema, token: dict = Depends(verify_token)):
    try:
        user_id = token.get("user_id")
        username = token.get("username")
        input_data = payload.model_dump()
        comment = create_comment(user_id=user_id, username=username, post_id=post_id, content=input_data.get("commented_content"))
        return {"error": False, "data": {"comment": comment}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@router.put("/{post_id}/update", response_model=Union[UpdateResponse, ErrorResponse], status_code=status.HTTP_200_OK)
async def update_post_handler(post_id: str, payload: UpdatePostSchema, token: dict = Depends(verify_token)):
    try:
        user_id = token.get("user_id")
        input_data = payload.model_dump()
        title = input_data.get("title")
        description = input_data.get("description")
        updated = update_post(user_id=user_id, post_id=post_id, title=title, description=description)
        return {"error": False, "data": {"post": updated}}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
