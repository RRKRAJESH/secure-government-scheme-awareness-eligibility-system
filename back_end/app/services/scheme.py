from fastapi import status, HTTPException
from bson import ObjectId
from typing import Optional
import math

from app.services.error import raise_http_error
from app.configs.config import settings
from app.db.mongo import get_collection
from app.utils.mongo_helpers import serialize_enums
from app.utils.date_time import serialize_datetime_utc


def get_schemes_collection():
    return get_collection(
        db_name=settings.PRODUCTION_DATABASE_NAME,
        collection_name=settings.SCHEMES_COLLECTION_NAME
    )


def get_all_schemes(page: int = 1, limit: int = 10, status_filter: str = "ACTIVE"):
    """Get all schemes with pagination"""
    try:
        schemes_collection = get_schemes_collection()

        # Build query
        query = {"status": status_filter} if status_filter else {}

        # Get total count
        total_count = schemes_collection.count_documents(query)
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

        # Pagination
        skip = (page - 1) * limit

        # Fetch schemes (lightweight projection)
        schemes_cursor = schemes_collection.find(
            query,
            {
                "_id": 1,
                "schemeName": 1,
                "schemeCode": 1,
                "schemeType": 1,
                "sector": 1,
                "governmentLevel": 1,
                "description": 1,
                "status": 1,
                "directUse": 1,
                "benefits": 1,
                "createdAt": 1,
            }
        ).skip(skip).limit(limit).sort("schemeName", 1)

        schemes = []
        for scheme in schemes_cursor:
            scheme["_id"] = str(scheme["_id"])
            # Convert createdAt datetime to ISO string for JSON serialization
            if scheme.get("createdAt"):
                scheme["createdAt"] = serialize_datetime_utc(scheme["createdAt"])

            # Derive benefitType from nested benefits if present
            benefit = None
            if scheme.get("benefitType"):
                benefit = scheme.get("benefitType")
            elif scheme.get("benefits") and isinstance(scheme.get("benefits"), dict):
                benefit = scheme["benefits"].get("benefitType")

            if benefit:
                scheme["benefitType"] = benefit
            else:
                scheme.setdefault("benefitType", None)

            # Remove nested benefits to keep list payload small
            if "benefits" in scheme:
                try:
                    del scheme["benefits"]
                except Exception:
                    pass

            schemes.append(scheme)

        return {
            "schemes": schemes,
            "pagination": {
                "currentPage": page,
                "totalPages": total_pages,
                "totalCount": total_count,
                "hasNext": page < total_pages,
                "hasPrevious": page > 1
            }
        }

    except HTTPException:
        raise

    except Exception as e:
        error_msg = f"Error occurred while processing get_all_schemes() :: {str(e)}"
        raise Exception(error_msg)


def get_scheme_by_id(scheme_id: str):
    """Get scheme details by ID with sub-schemes if umbrella"""
    try:
        schemes_collection = get_schemes_collection()

        # Validate ObjectId
        if not ObjectId.is_valid(scheme_id):
            raise_http_error(
                status_code=status.HTTP_400_BAD_REQUEST,
                message="Invalid scheme ID format"
            )

        # Find scheme
        scheme = schemes_collection.find_one({"_id": ObjectId(scheme_id)})

        if not scheme:
            raise_http_error(
                status_code=status.HTTP_404_NOT_FOUND,
                message="Scheme not found"
            )

        scheme["_id"] = str(scheme["_id"])
        
        # Convert parentSchemeId if present
        if scheme.get("parentSchemeId"):
            scheme["parentSchemeId"] = str(scheme["parentSchemeId"])

        # Normalize and convert date fields to strings if present
        # Support both old and new field names from Mongo documents
        if scheme.get("launchDate"):
            scheme["launchDate"] = str(scheme["launchDate"])

        # Normalize created/updated timestamps to ISO strings if present
        if scheme.get("createdAt"):
            scheme["createdAt"] = serialize_datetime_utc(scheme["createdAt"])

        if scheme.get("updatedAt"):
            scheme["updatedAt"] = serialize_datetime_utc(scheme["updatedAt"])

        # If umbrella scheme, fetch sub-schemes
        sub_schemes = []
        if scheme.get("schemeType") == "UMBRELLA":
            sub_schemes_cursor = schemes_collection.find(
                {"parentSchemeId": ObjectId(scheme_id)},
                {
                    "_id": 1,
                    "schemeName": 1,
                    "schemeCode": 1,
                    "description": 1,
                    "status": 1
                }
            )
            for sub in sub_schemes_cursor:
                sub["_id"] = str(sub["_id"])
                sub_schemes.append(sub)

        return {
            "scheme": scheme,
            "subSchemes": sub_schemes
        }
    
    except HTTPException:
        raise

    except Exception as e:
        error_msg = f"Error occurred while processing get_scheme_by_id() :: {str(e)}"
        raise Exception(error_msg)


def mark_scheme_deleted(scheme_id: str):
    """Mark a scheme document as deleted by setting `isDeleted` to True and updating status."""
    try:
        schemes_collection = get_schemes_collection()

        # Validate ObjectId
        if not ObjectId.is_valid(scheme_id):
            raise_http_error(
                status_code=status.HTTP_400_BAD_REQUEST,
                message="Invalid scheme ID format"
            )

        result = schemes_collection.update_one(
            {"_id": ObjectId(scheme_id)},
            {"$set": {"isDeleted": True, "status": "DELETED"}}
        )

        if result.matched_count == 0:
            raise_http_error(
                status_code=status.HTTP_404_NOT_FOUND,
                message="Scheme not found"
            )

        return {"message": "Scheme marked deleted"}

    except HTTPException:
        raise

    except Exception as e:
        error_msg = f"Error occurred while processing mark_scheme_deleted() :: {str(e)}"
        raise Exception(error_msg)


def search_schemes(filters: dict):
    """Search schemes with multiple filters"""
    try:
        schemes_collection = get_schemes_collection()

        # Build query
        query = {}
        applied_filters = {}

        # Status filter (default: ACTIVE)
        status_filter = filters.get("status", "ACTIVE")
        if status_filter:
            query["status"] = status_filter
            applied_filters["status"] = status_filter

        # Keyword search (name, code, description)
        keyword = filters.get("keyword")
        if keyword:
            query["$or"] = [
                {"schemeName": {"$regex": keyword, "$options": "i"}},
                {"schemeCode": {"$regex": keyword, "$options": "i"}},
                {"description.short": {"$regex": keyword, "$options": "i"}},
                {"description.detailed": {"$regex": keyword, "$options": "i"}}
            ]
            applied_filters["keyword"] = keyword

        # Sector filter
        sector = filters.get("sector")
        if sector:
            query["sector"] = sector
            applied_filters["sector"] = sector

        # Government level filter
        government_level = filters.get("governmentLevel")
        if government_level:
            query["governmentLevel"] = government_level
            applied_filters["governmentLevel"] = government_level

        # Scheme type filter
        scheme_type = filters.get("schemeType")
        if scheme_type:
            query["schemeType"] = scheme_type
            applied_filters["schemeType"] = scheme_type

        # Only direct use schemes (applicable schemes)
        direct_use = filters.get("directUse")
        if direct_use is not None:
            query["directUse"] = direct_use
            applied_filters["directUse"] = direct_use

        # Benefit type filter (matches nested benefits.benefitType or top-level benefitType)
        benefit_type = filters.get("benefitType")
        if benefit_type:
            query.setdefault("$and", []).append({
                "$or": [
                    {"benefits.benefitType": benefit_type},
                    {"benefitType": benefit_type}
                ]
            })
            applied_filters["benefitType"] = benefit_type

        # State filter
        state = filters.get("state")
        if state:
            query["$or"] = query.get("$or", [])
            query["$and"] = [
                {"$or": [
                    {"eligibility.statesAllowed": {"$size": 0}},
                    {"eligibility.statesAllowed": {"$in": [state]}},
                    {"eligibility": None}
                ]}
            ]
            applied_filters["state"] = state

        # Age eligibility filter
        min_age = filters.get("minAge")
        if min_age:
            query["$or"] = query.get("$or", [])
            query.setdefault("$and", []).append({
                "$or": [
                    {"eligibility.minAge": {"$lte": min_age}},
                    {"eligibility.minAge": None},
                    {"eligibility": None}
                ]
            })
            applied_filters["minAge"] = min_age

        max_age = filters.get("maxAge")
        if max_age:
            query.setdefault("$and", []).append({
                "$or": [
                    {"eligibility.maxAge": {"$gte": max_age}},
                    {"eligibility.maxAge": None},
                    {"eligibility": None}
                ]
            })
            applied_filters["maxAge"] = max_age

        # Land holding filter
        land_holding = filters.get("landHolding")
        if land_holding is not None:
            query.setdefault("$and", []).append({
                "$or": [
                    {
                        "$and": [
                            {"$or": [{"eligibility.landHolding.min": {"$lte": land_holding}}, {"eligibility.landHolding.min": None}]},
                            {"$or": [{"eligibility.landHolding.max": {"$gte": land_holding}}, {"eligibility.landHolding.max": None}]}
                        ]
                    },
                    {"eligibility": None}
                ]
            })
            applied_filters["landHolding"] = land_holding

        # Income limit filter
        income_limit = filters.get("incomeLimit")
        if income_limit is not None:
            query.setdefault("$and", []).append({
                "$or": [
                    {"eligibility.incomeLimit": {"$gte": income_limit}},
                    {"eligibility.incomeLimit": None},
                    {"eligibility": None}
                ]
            })
            applied_filters["incomeLimit"] = income_limit

        # Caste category filter
        caste_category = filters.get("casteCategory")
        if caste_category:
            query.setdefault("$and", []).append({
                "$or": [
                    {"eligibility.casteCategory": {"$in": [caste_category, "ANY"]}},
                    {"eligibility": None}
                ]
            })
            applied_filters["casteCategory"] = caste_category

        # Pagination
        page = filters.get("page", 1)
        limit = filters.get("limit", 10)
        skip = (page - 1) * limit

        # Get total count
        total_count = schemes_collection.count_documents(query)
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

        # Fetch schemes
        schemes_cursor = schemes_collection.find(
            query,
            {
                "_id": 1,
                "schemeName": 1,
                "schemeCode": 1,
                "schemeType": 1,
                "sector": 1,
                "governmentLevel": 1,
                "description": 1,
                "status": 1,
                "directUse": 1,
                "benefits": 1,
                "createdAt": 1,
            }
        ).skip(skip).limit(limit).sort("schemeName", 1)

        schemes = []
        for scheme in schemes_cursor:
            scheme["_id"] = str(scheme["_id"])
            # Convert createdAt datetime to ISO string for JSON serialization
            if scheme.get("createdAt"):
                scheme["createdAt"] = serialize_datetime_utc(scheme["createdAt"])

            # Derive benefitType from nested benefits if present
            benefit = None
            if scheme.get("benefitType"):
                benefit = scheme.get("benefitType")
            elif scheme.get("benefits") and isinstance(scheme.get("benefits"), dict):
                benefit = scheme["benefits"].get("benefitType")

            if benefit:
                scheme["benefitType"] = benefit
            else:
                scheme.setdefault("benefitType", None)

            # Remove nested benefits to keep list payload small
            if "benefits" in scheme:
                try:
                    del scheme["benefits"]
                except Exception:
                    pass

            schemes.append(scheme)

        return {
            "schemes": schemes,
            "pagination": {
                "currentPage": page,
                "totalPages": total_pages,
                "totalCount": total_count,
                "hasNext": page < total_pages,
                "hasPrevious": page > 1
            },
            "appliedFilters": applied_filters
        }

    except HTTPException:
        raise

    except Exception as e:
        error_msg = f"Error occurred while processing search_schemes() :: {str(e)}"
        raise Exception(error_msg)


def get_scheme_by_code(scheme_code: str):
    """Get scheme by scheme code"""
    try:
        schemes_collection = get_schemes_collection()

        scheme = schemes_collection.find_one({"schemeCode": scheme_code.upper()})

        if not scheme:
            raise_http_error(
                status_code=status.HTTP_404_NOT_FOUND,
                message=f"Scheme with code '{scheme_code}' not found"
            )

        scheme["_id"] = str(scheme["_id"])
        
        if scheme.get("parentSchemeId"):
            scheme["parentSchemeId"] = str(scheme["parentSchemeId"])

        # Normalize and convert date fields to strings if present
        if scheme.get("launchDate"):
            scheme["launchDate"] = str(scheme["launchDate"])

        # Remove internal timestamp fields if present (support multiple names)
        if scheme.get("createdAt"):
            del scheme["createdAt"]
        if scheme.get("updatedAt"):
            del scheme["updatedAt"]

        return {"scheme": scheme, "subSchemes": []}

    except HTTPException:
        raise

    except Exception as e:
        error_msg = f"Error occurred while processing get_scheme_by_code() :: {str(e)}"
        raise Exception(error_msg)


def get_eligible_schemes_for_user(user_profile: dict):
    """Get schemes eligible for user based on their profile"""
    try:
        schemes_collection = get_schemes_collection()

        beneficiary_info = user_profile.get("beneficiary_info") or {}
        basic_info = user_profile.get("basic_info") or {}

        # Build eligibility query
        query = {
            "status": "ACTIVE",
            "directUse": True
        }

        conditions = []

        # Age check
        # TODO: Calculate age from DOB if needed

        # Land holding check
        land_holding = beneficiary_info.get("land_holding")
        if land_holding:
            conditions.append({
                "$or": [
                    {
                        "$and": [
                            {"$or": [{"eligibility.landHolding.min": {"$lte": land_holding}}, {"eligibility.landHolding.min": None}]},
                            {"$or": [{"eligibility.landHolding.max": {"$gte": land_holding}}, {"eligibility.landHolding.max": None}]}
                        ]
                    },
                    {"eligibility": None}
                ]
            })

        # Income check
        annual_income = beneficiary_info.get("annual_income")
        if annual_income:
            conditions.append({
                "$or": [
                    {"eligibility.incomeLimit": {"$gte": annual_income}},
                    {"eligibility.incomeLimit": None},
                    {"eligibility": None}
                ]
            })

        # Caste category check
        social_category = beneficiary_info.get("social_category")
        if social_category:
            conditions.append({
                "$or": [
                    {"eligibility.casteCategory": {"$in": [social_category, "ANY"]}},
                    {"eligibility": None}
                ]
            })

        if conditions:
            query["$and"] = conditions

        # Fetch eligible schemes
        schemes_cursor = schemes_collection.find(
            query,
            {
                "_id": 1,
                "schemeName": 1,
                "schemeCode": 1,
                "schemeType": 1,
                "sector": 1,
                "governmentLevel": 1,
                "description": 1,
                "status": 1,
                "directUse": 1
            }
        ).sort("schemeName", 1)

        schemes = []
        for scheme in schemes_cursor:
            scheme["_id"] = str(scheme["_id"])
            schemes.append(scheme)

        return {
            "schemes": schemes,
            "totalCount": len(schemes)
        }

    except HTTPException:
        raise

    except Exception as e:
        error_msg = f"Error occurred while processing get_eligible_schemes_for_user() :: {str(e)}"
        raise Exception(error_msg)
