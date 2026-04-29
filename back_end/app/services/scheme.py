from fastapi import status, HTTPException
from bson import ObjectId
from typing import Optional
import math
from datetime import datetime

from app.services.error import raise_http_error
from app.configs.config import settings
from app.db.mongo import get_collection
from app.utils.mongo_helpers import serialize_enums
from app.utils.date_time import serialize_datetime_utc, current_time_utc
from app.services.notifications import create_bulk_notifications


def get_schemes_collection():
    return get_collection(
        db_name=settings.PRODUCTION_DATABASE_NAME,
        collection_name=settings.SCHEMES_COLLECTION_NAME,
    )


def get_users_collection():
    return get_collection(
        db_name=settings.PRODUCTION_DATABASE_NAME,
        collection_name=settings.USERS_COLLECTION_NAME,
    )


def _parse_optional_datetime(date_value: Optional[str], field_name: str):
    if not date_value:
        return None

    if isinstance(date_value, datetime):
        return date_value

    if not isinstance(date_value, str):
        raise_http_error(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=f"{field_name} must be a valid ISO date string",
        )

    try:
        normalized = date_value.strip().replace("Z", "+00:00")
        return datetime.fromisoformat(normalized)
    except ValueError:
        raise_http_error(
            status_code=status.HTTP_400_BAD_REQUEST,
            message=f"{field_name} must be a valid ISO date string",
        )


def create_scheme(scheme_payload: dict, token: dict):
    """Create a new scheme document and notify all non-admin users."""
    try:
        role = str(token.get("role") or "").lower()
        if role != "admin":
            raise_http_error(
                status_code=status.HTTP_403_FORBIDDEN,
                message="Only admins can create schemes",
            )

        schemes_collection = get_schemes_collection()
        users_collection = get_users_collection()

        payload = serialize_enums(scheme_payload)
        scheme_name = (payload.get("schemeName") or "").strip()
        scheme_code = (payload.get("schemeCode") or "").strip().upper()

        if not scheme_name or not scheme_code:
            raise_http_error(
                status_code=status.HTTP_400_BAD_REQUEST,
                message="Scheme name and scheme code are required",
            )

        existing = schemes_collection.find_one(
            {"schemeCode": scheme_code, "isDeleted": {"$ne": True}}
        )
        if existing:
            raise_http_error(
                status_code=status.HTTP_409_CONFLICT,
                message=f"Scheme code '{scheme_code}' already exists",
            )

        parent_scheme_id = payload.get("parentSchemeId")
        if parent_scheme_id:
            if not ObjectId.is_valid(parent_scheme_id):
                raise_http_error(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    message="Invalid parent scheme id",
                )
            parent_scheme_id = ObjectId(parent_scheme_id)
        else:
            parent_scheme_id = None

        launch_date = _parse_optional_datetime(payload.get("launchDate"), "launchDate")
        application_details = payload.get("applicationDetails") or None
        if application_details:
            if application_details.get("startDate"):
                application_details["startDate"] = _parse_optional_datetime(
                    application_details.get("startDate"), "applicationDetails.startDate"
                )
            if application_details.get("endDate"):
                application_details["endDate"] = _parse_optional_datetime(
                    application_details.get("endDate"), "applicationDetails.endDate"
                )

        now = current_time_utc()
        document = {
            "schemeName": scheme_name,
            "schemeCode": scheme_code,
            "schemeType": payload.get("schemeType"),
            "directUse": bool(payload.get("directUse", True)),
            "parentSchemeId": parent_scheme_id,
            "governmentLevel": payload.get("governmentLevel"),
            "ministry": payload.get("ministry"),
            "department": payload.get("department") or None,
            "sector": payload.get("sector") or None,
            "category": payload.get("category") or None,
            "sub_category": payload.get("sub_category") or None,
            "description": payload.get("description") or {},
            "benefits": payload.get("benefits") or None,
            "applicationDetails": application_details,
            "eligibilityV2": payload.get("eligibilityV2") or None,
            "status": payload.get("status") or "ACTIVE",
            "isDeleted": bool(payload.get("isDeleted", False)),
            "createdAt": now,
            "updatedAt": now,
            "launchDate": launch_date,
        }

        inserted = schemes_collection.insert_one(document)
        inserted_id = str(inserted.inserted_id)

        try:
            recipient_ids = []
            for user_doc in users_collection.find(
                {
                    "role": {"$ne": "admin"},
                    "is_deleted": {"$ne": True},
                    "is_active": True,
                },
                {"_id": 1},
            ):
                user_id = user_doc.get("_id")
                if user_id:
                    recipient_ids.append(str(user_id))

            if recipient_ids:
                notifier = {
                    "kind": "admin",
                    "id": token.get("user_id"),
                    "name": token.get("username") or "Admin",
                }
                reference = {
                    "kind": "scheme",
                    "id": inserted_id,
                    "api_url": f"/api/v1/backend/schemes/detail/{inserted_id}",
                }
                message = f"A new scheme is now available: {scheme_name}"
                meta = {
                    "scheme_name": scheme_name,
                    "scheme_code": scheme_code,
                }
                create_bulk_notifications(
                    recipient_ids,
                    "NEW_SCHEME",
                    notifier,
                    reference,
                    message,
                    meta=meta,
                )
        except Exception:
            pass

        return {
            "id": inserted_id,
            "schemeCode": scheme_code,
            "schemeName": scheme_name,
            "createdAt": serialize_datetime_utc(now),
        }

    except HTTPException:
        raise
    except Exception as e:
        error_msg = f"Error occurred while processing create_scheme() :: {str(e)}"
        raise Exception(error_msg)


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
        schemes_cursor = (
            schemes_collection.find(
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
                    "category": 1,
                    "sub_category": 1,
                    "department": 1,
                    "createdAt": 1,
                },
            )
            .skip(skip)
            .limit(limit)
            .sort("schemeName", 1)
        )

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
                "hasPrevious": page > 1,
            },
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
                message="Invalid scheme ID format",
            )

        # Find scheme
        scheme = schemes_collection.find_one({"_id": ObjectId(scheme_id)})

        if not scheme:
            raise_http_error(
                status_code=status.HTTP_404_NOT_FOUND, message="Scheme not found"
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
                    "status": 1,
                },
            )
            for sub in sub_schemes_cursor:
                sub["_id"] = str(sub["_id"])
                sub_schemes.append(sub)

        return {"scheme": scheme, "subSchemes": sub_schemes}

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
                message="Invalid scheme ID format",
            )

        result = schemes_collection.update_one(
            {"_id": ObjectId(scheme_id)},
            {"$set": {"isDeleted": True, "status": "DELETED"}},
        )

        if result.matched_count == 0:
            raise_http_error(
                status_code=status.HTTP_404_NOT_FOUND, message="Scheme not found"
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
                {"description.detailed": {"$regex": keyword, "$options": "i"}},
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
            query.setdefault("$and", []).append(
                {
                    "$or": [
                        {"benefits.benefitType": benefit_type},
                        {"benefitType": benefit_type},
                    ]
                }
            )
            applied_filters["benefitType"] = benefit_type

        # Pagination
        page = filters.get("page", 1)
        limit = filters.get("limit", 10)
        skip = (page - 1) * limit

        # Get total count
        total_count = schemes_collection.count_documents(query)
        total_pages = math.ceil(total_count / limit) if total_count > 0 else 1

        # Fetch schemes
        schemes_cursor = (
            schemes_collection.find(
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
                    "category": 1,
                    "sub_category": 1,
                    "department": 1,
                    "createdAt": 1,
                },
            )
            .skip(skip)
            .limit(limit)
            .sort("schemeName", 1)
        )

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
                "hasPrevious": page > 1,
            },
            "appliedFilters": applied_filters,
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
                message=f"Scheme with code '{scheme_code}' not found",
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


# ---------------------------------------------------------------------------
# Eligibility Rule Engine
# ---------------------------------------------------------------------------

# Old-schema path → new-schema path (or special sentinel)
_PATH_ALIASES = {
    # Documents no longer tracked — assume present for verified users
    "documents.aadhaar.exists": "__ALWAYS_TRUE__",
    "documents.bank.exists": "__ALWAYS_TRUE__",
    # Land record → agriculture hasLand flag
    "documents.land_record.exists": "profile.beneficiary_info.agriculture_info.hasLand",
    # assets.* → profile.beneficiary_info.*
    "assets.land.hasLand": "profile.beneficiary_info.agriculture_info.hasLand",
    "assets.land.area": "profile.beneficiary_info.agriculture_info.landArea",
    "assets.land.unit": "profile.beneficiary_info.agriculture_info.landUnit",
    "assets.dairy.cattleCount": "profile.beneficiary_info.dairy_info.cattleCount",
    "assets.poultry.birdCount": "profile.beneficiary_info.poultry.birdCount",
    "assets.agriculture.cropSowingDetails.exists": "__CROP_SOWING_EXISTS__",
}


def _compute_age(dob_str: str):
    """Return age in years given a YYYY-MM-DD date string, or None on error."""
    from datetime import date, datetime

    try:
        dob = datetime.strptime(dob_str, "%Y-%m-%d").date()
        today = date.today()
        return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))
    except Exception:
        return None


def _resolve_path(path: str, doc: dict):
    """Navigate a dot-separated path through a nested dict.
    Returns (value, found: bool).
    """
    keys = path.split(".")
    current = doc
    for key in keys:
        if not isinstance(current, dict) or key not in current:
            return None, False
        current = current[key]
    return current, True


def _evaluate_predicate(pred: dict, doc: dict) -> bool:
    """Evaluate a single {path, op, value} predicate against the profile doc."""
    path = pred.get("path", "")
    op = pred.get("op", "")
    expected = pred.get("value")

    resolved_path = _PATH_ALIASES.get(path, path)

    if resolved_path == "__ALWAYS_TRUE__":
        actual, found = True, True
    elif resolved_path == "__CROP_SOWING_EXISTS__":
        cd, _ = _resolve_path(
            "profile.beneficiary_info.agriculture_info.cropSowingDetails", doc
        )
        actual = bool(cd and (cd.get("cropNamesEnum") or cd.get("cropNamesOther")))
        found = True
    else:
        actual, found = _resolve_path(resolved_path, doc)

    if not found or actual is None:
        return False

    try:
        if op == "eq":
            return actual == expected
        elif op == "neq":
            return actual != expected
        elif op == "gte":
            return actual >= expected
        elif op == "lte":
            return actual <= expected
        elif op == "gt":
            return actual > expected
        elif op == "lt":
            return actual < expected
        elif op == "in":
            return actual in (expected or [])
        elif op == "nin":
            return actual not in (expected or [])
        elif op == "exists":
            return bool(actual)
        else:
            return False
    except TypeError:
        return False


def _evaluate_logic(node: dict, rule_map: dict, doc: dict) -> bool:
    """Recursively evaluate a logic node which can be:
    - {ref: "<rule_id>"}  →  resolve the rule then evaluate its logic
    - {all: [...]}        →  AND over children
    - {any: [...]}        →  OR over children
    - {path, op, value}   →  leaf predicate
    """
    if "ref" in node:
        rule = rule_map.get(node["ref"])
        if not rule:
            return False
        return _evaluate_logic(rule.get("logic", {}), rule_map, doc)

    if "all" in node:
        children = node["all"]
        if not children:
            return False  # empty rule list must not match everyone
        return all(_evaluate_logic(child, rule_map, doc) for child in children)

    if "any" in node:
        children = node["any"]
        if not children:
            return False
        return any(_evaluate_logic(child, rule_map, doc) for child in children)

    # Leaf predicate
    if "path" in node and "op" in node:
        return _evaluate_predicate(node, doc)

    return False


def _is_scheme_eligible(eligibility_v2: dict, user_profile: dict) -> bool:
    """Return True when the user satisfies the scheme's resultComputation.eligibleIf
    AND does not trigger any exclusion rule."""
    result_computation = eligibility_v2.get("resultComputation", {})
    eligible_if = result_computation.get("eligibleIf")
    if not eligible_if:
        return False  # No criteria defined — skip

    inclusion_rules = eligibility_v2.get("inclusionRules", [])
    exclusion_rules = eligibility_v2.get("exclusionRules", [])
    all_rules = inclusion_rules + exclusion_rules
    rule_map = {r["id"]: r for r in all_rules if "id" in r}

    # If any exclusion rule evaluates to True → user is excluded
    for exc in exclusion_rules:
        logic = exc.get("logic", {})
        if logic and _evaluate_logic(logic, rule_map, user_profile):
            return False

    return _evaluate_logic(eligible_if, rule_map, user_profile)


# ---------------------------------------------------------------------------


def get_eligible_schemes_for_user(user_profile: dict):
    """Get schemes eligible for user based on their profile using eligibilityV2 rules"""
    try:
        # Inject computed age so path "profile.basic_info.age" resolves
        dob = (user_profile.get("profile") or {}).get("basic_info", {}).get("dob")
        if dob:
            age = _compute_age(dob)
            if age is not None:
                user_profile["profile"]["basic_info"]["age"] = age

        # Extract farmer status — used to gate all farming-sector schemes
        beneficiary_info = (user_profile.get("profile") or {}).get(
            "beneficiary_info"
        ) or {}
        is_farmer = bool(beneficiary_info.get("are_you_farmer", False))

        # All sectors that require the user to be a registered farmer
        _FARMER_SECTORS = {
            "AGRICULTURE",
            "DAIRY",
            "POULTRY",
            "FISHERIES",
            "HORTICULTURE",
        }

        schemes_collection = get_schemes_collection()

        schemes_cursor = schemes_collection.find(
            {"status": "ACTIVE", "directUse": True, "eligibilityV2": {"$exists": True}},
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
                "category": 1,
                "sub_category": 1,
                "department": 1,
                "createdAt": 1,
                "eligibilityV2": 1,
            },
        ).sort("schemeName", 1)

        eligible_schemes = []
        for scheme in schemes_cursor:
            # Gate: non-farmers are never eligible for farming-sector schemes
            scheme_sector = (scheme.get("sector") or "").upper()
            if scheme_sector in _FARMER_SECTORS and not is_farmer:
                continue

            ev2 = scheme.get("eligibilityV2")
            if not ev2 or not _is_scheme_eligible(ev2, user_profile):
                continue

            scheme["_id"] = str(scheme["_id"])
            scheme.pop("eligibilityV2", None)

            if scheme.get("createdAt"):
                scheme["createdAt"] = serialize_datetime_utc(scheme["createdAt"])

            benefit = None
            if scheme.get("benefitType"):
                benefit = scheme["benefitType"]
            elif isinstance(scheme.get("benefits"), dict):
                benefit = scheme["benefits"].get("benefitType")
            scheme["benefitType"] = benefit

            scheme.pop("benefits", None)

            eligible_schemes.append(scheme)

        return {"schemes": eligible_schemes, "totalCount": len(eligible_schemes)}

    except HTTPException:
        raise

    except Exception as e:
        error_msg = f"Error occurred while processing get_eligible_schemes_for_user() :: {str(e)}"
        raise Exception(error_msg)
