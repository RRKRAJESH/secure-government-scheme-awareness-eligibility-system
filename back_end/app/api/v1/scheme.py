from fastapi import APIRouter, status, Depends, HTTPException, Query
from typing import Union, Optional

from app.services.error import raise_http_error
from app.schemas.scheme_schema import (
    SchemeListResponse,
    AgricultureSector,
    SchemeDetailResponse,
    SchemeSearchResponse,
    GovernmentLevel,
    SchemeType,
    SchemeStatus,
    SchemeCreateSchema,
)
from app.schemas.common_schema import ErrorResponse
from app.utils.auth import verify_token
from app.services.scheme import (
    get_all_schemes,
    get_scheme_by_id,
    search_schemes,
    get_scheme_by_code,
    mark_scheme_deleted,
    get_eligible_schemes_for_user,
    create_scheme,
)
from app.services.update_profile import is_profile_complete

router = APIRouter()


@router.post(
    "/create",
    response_model=Union[dict, ErrorResponse],
    status_code=status.HTTP_201_CREATED,
)
async def create_scheme_handler(
    payload: SchemeCreateSchema,
    token: dict = Depends(verify_token),
):
    """Create a new scheme and notify users."""
    try:
        result = create_scheme(payload.model_dump(), token)
        return {"error": False, "data": result}

    except HTTPException:
        raise

    except ValueError as e:
        raise_http_error(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=f"{str(e)}",
        )

    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}",
        )


@router.get(
    "/list",
    response_model=Union[SchemeListResponse, ErrorResponse],
    status_code=status.HTTP_200_OK,
)
async def list_schemes_handler(
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    status_filter: Optional[SchemeStatus] = Query(
        SchemeStatus.ACTIVE, alias="status", description="Filter by status"
    ),
    token: str = Depends(verify_token),
):
    """Get all schemes with pagination"""
    try:
        status_value = status_filter.value if status_filter else None
        result = get_all_schemes(page=page, limit=limit, status_filter=status_value)

        return {"error": False, "data": result}

    except HTTPException:
        raise

    except ValueError as e:
        raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message=f"{str(e)}")

    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}",
        )


@router.get(
    "/search",
    response_model=Union[SchemeSearchResponse, ErrorResponse],
    status_code=status.HTTP_200_OK,
)
async def search_schemes_handler(
    keyword: Optional[str] = Query(None, description="Search keyword"),
    sector: Optional[AgricultureSector] = Query(None, description="Filter by sector"),
    governmentLevel: Optional[GovernmentLevel] = Query(
        None, description="Filter by government level"
    ),
    schemeType: Optional[SchemeType] = Query(None, description="Filter by scheme type"),
    status_filter: Optional[SchemeStatus] = Query(
        SchemeStatus.ACTIVE, alias="status", description="Filter by status"
    ),
    benefitType: Optional[str] = Query(None, description="Filter by benefit type"),
    directUse: Optional[bool] = Query(
        None, description="Filter by directly applicable schemes"
    ),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(10, ge=1, le=50, description="Items per page"),
    token: str = Depends(verify_token),
):
    """Search schemes with filters"""
    try:
        filters = {
            "keyword": keyword,
            "sector": sector.value if sector else None,
            "governmentLevel": governmentLevel.value if governmentLevel else None,
            "schemeType": schemeType.value if schemeType else None,
            "benefitType": benefitType,
            "status": status_filter.value if status_filter else None,
            "directUse": directUse,
            "page": page,
            "limit": limit,
        }

        # Remove None values
        filters = {k: v for k, v in filters.items() if v is not None}

        result = search_schemes(filters)

        return {"error": False, "data": result}

    except HTTPException:
        raise

    except ValueError as e:
        raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message=f"{str(e)}")

    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}",
        )


@router.get(
    "/detail/{scheme_id}",
    response_model=Union[SchemeDetailResponse, ErrorResponse],
    status_code=status.HTTP_200_OK,
)
async def get_scheme_detail_handler(scheme_id: str, token: str = Depends(verify_token)):
    """Get scheme details by ID"""
    try:
        result = get_scheme_by_id(scheme_id)

        return {"error": False, "data": result}

    except HTTPException:
        raise

    except ValueError as e:
        raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message=f"{str(e)}")

    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}",
        )


@router.put(
    "/{scheme_id}/mark-deleted",
    response_model=Union[dict, ErrorResponse],
    status_code=status.HTTP_200_OK,
)
async def mark_scheme_deleted_handler(
    scheme_id: str, token: str = Depends(verify_token)
):
    """Mark a scheme as deleted (soft delete)."""
    try:
        result = mark_scheme_deleted(scheme_id)

        return {"error": False, "data": result}

    except HTTPException:
        raise

    except ValueError as e:
        raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message=f"{str(e)}")

    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}",
        )


@router.get(
    "/code/{scheme_code}",
    response_model=Union[SchemeDetailResponse, ErrorResponse],
    status_code=status.HTTP_200_OK,
)
async def get_scheme_by_code_handler(
    scheme_code: str, token: str = Depends(verify_token)
):
    """Get scheme details by scheme code"""
    try:
        result = get_scheme_by_code(scheme_code)

        return {"error": False, "data": result}

    except HTTPException:
        raise

    except ValueError as e:
        raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message=f"{str(e)}")

    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}",
        )


@router.get(
    "/eligible",
    response_model=Union[SchemeListResponse, ErrorResponse],
    status_code=status.HTTP_200_OK,
)
async def get_eligible_schemes_handler(token: dict = Depends(verify_token)):
    """Get schemes eligible for current user based on their profile"""
    try:
        from app.db.mongo import get_collection
        from app.configs.config import settings
        from bson import ObjectId

        user_id = token.get("user_id")

        # Get user profile
        user_profile_collection = get_collection(
            db_name=settings.PRODUCTION_DATABASE_NAME,
            collection_name=settings.USERS_PROFILE_COLLECTION_NAME,
        )

        user_profile = user_profile_collection.find_one({"user_id": ObjectId(user_id)})

        if not user_profile or not is_profile_complete(user_profile):
            raise_http_error(
                status_code=status.HTTP_409_CONFLICT,
                message="Please complete your profile before checking scheme eligibility.",
                error_data={"reason": "PROFILE_INCOMPLETE", "open_tab": "profile"},
            )

        beneficiary_info = (user_profile.get("profile") or {}).get(
            "beneficiary_info"
        ) or {}
        if not bool(beneficiary_info.get("are_you_farmer", False)):
            raise_http_error(
                status_code=status.HTTP_409_CONFLICT,
                message="You are not a farmer. Please update your profile to indicate that you are a farmer before checking scheme eligibility.",
                error_data={"reason": "NOT_A_FARMER", "open_tab": "profile"},
            )

        result = get_eligible_schemes_for_user(user_profile)

        return {
            "error": False,
            "data": {
                "schemes": result["schemes"],
                "pagination": {
                    "currentPage": 1,
                    "totalPages": 1,
                    "totalCount": result["totalCount"],
                    "hasNext": False,
                    "hasPrevious": False,
                },
            },
        }

    except HTTPException:
        raise

    except ValueError as e:
        raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message=f"{str(e)}")

    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}",
        )


@router.get("/suggestions", status_code=status.HTTP_200_OK)
async def get_scheme_suggestions_handler(
    keyword: str = Query(..., min_length=1, description="Search keyword"),
    limit: int = Query(10, ge=1, le=20, description="Max suggestions"),
    token: str = Depends(verify_token),
):
    """Get scheme name suggestions for autocomplete"""
    try:
        from app.db.mongo import get_collection
        from app.configs.config import settings
        import re

        schemes_collection = get_collection(
            db_name=settings.PRODUCTION_DATABASE_NAME,
            collection_name=settings.SCHEMES_COLLECTION_NAME,
        )

        # Search by scheme name with regex (case-insensitive)
        regex_pattern = re.compile(keyword, re.IGNORECASE)

        suggestions = schemes_collection.find(
            {
                "$or": [
                    {"schemeName": {"$regex": regex_pattern}},
                    {"schemeCode": {"$regex": regex_pattern}},
                ],
                "status": "ACTIVE",
            },
            {"schemeName": 1, "schemeCode": 1, "schemeType": 1},
        ).limit(limit)

        result = []
        for scheme in suggestions:
            result.append(
                {
                    "id": str(scheme["_id"]),
                    "name": scheme["schemeName"],
                    "code": scheme.get("schemeCode", ""),
                    "type": scheme.get("schemeType", ""),
                }
            )

        return {"error": False, "data": {"suggestions": result}}

    except Exception as e:
        raise_http_error(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            message=f"An unexpected error occurred: {str(e)}",
        )
