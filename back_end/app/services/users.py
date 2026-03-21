from app.db.mongo import get_collection
from app.configs.config import settings
from typing import Dict
from app.services.error import raise_http_error
from fastapi import status, HTTPException
from bson import ObjectId
import math


def get_users_collection():
    return get_collection(
        db_name=settings.PRODUCTION_DATABASE_NAME,
        collection_name=settings.USERS_COLLECTION_NAME,
    )


def list_users(page: int = 1, limit: int = 20) -> Dict:
    try:
        coll = get_users_collection()

        # validate pagination
        try:
            page = int(page)
            limit = int(limit)
        except Exception:
            page = 1
            limit = 20
        if page < 1:
            page = 1
        if limit < 1:
            limit = 1

        total = coll.count_documents({})
        skip = (page - 1) * limit
        # include login/count, updated_at (last activity), and is_active flag
        cursor = coll.find({}, {"_id": 1, "username": 1, "email": 1, "role": 1, "created_at": 1, "success_login_count": 1, "updated_at": 1, "is_active": 1}).skip(skip).limit(limit).sort("created_at", -1)

        users = []
        for doc in cursor:
            try:
                uid = str(doc.get("_id"))
            except Exception:
                uid = None
            users.append({
                "id": uid,
                "username": doc.get("username") or None,
                "email": doc.get("email") or None,
                "role": doc.get("role") or None,
                "created_at": str(doc.get("created_at")) if doc.get("created_at") else None,
                "success_login_count": int(doc.get("success_login_count")) if doc.get("success_login_count") is not None else 0,
                "updated_at": str(doc.get("updated_at")) if doc.get("updated_at") else None,
                "is_active": bool(doc.get("is_active")) if doc.get("is_active") is not None else False,
            })

        total_pages = math.ceil(total / limit) if limit else 1

        return {"users": users, "pagination": {"page": page, "limit": limit, "total": total, "total_pages": total_pages}}

    except HTTPException:
        raise
    except Exception as e:
        raise Exception(f"Error in list_users: {e}")


def delete_user(user_id: str) -> Dict:
    """Soft-delete a user by setting is_active=False."""
    try:
        coll = get_users_collection()
        if not user_id:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="user_id is required")
        try:
            oid = ObjectId(user_id)
        except Exception:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Invalid user_id")

        result = coll.update_one({"_id": oid}, {"$set": {"is_active": False}})
        if result.matched_count == 0:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

        return {"message": "User removed successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise Exception(f"Error in delete_user: {e}")
