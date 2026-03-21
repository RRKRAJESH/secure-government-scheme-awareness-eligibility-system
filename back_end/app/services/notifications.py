from typing import List, Optional
from bson import ObjectId
from datetime import datetime

from app.db.mongo import get_collection
from app.configs.config import settings
from app.services.error import raise_http_error
from fastapi import status, HTTPException
from app.utils.date_time import serialize_datetime_utc


def get_notifications_collection():
    return get_collection(
        db_name=settings.PRODUCTION_DATABASE_NAME,
        collection_name="notifications"
    )


def create_notification(recipient_id: str, notification_type: str, notifier: dict, reference: dict, message: str, meta: Optional[dict] = None):
    try:
        coll = get_notifications_collection()
        now = datetime.utcnow()
        doc = {
            "recipient_id": ObjectId(recipient_id) if recipient_id else None,
            "notification_type": notification_type,
            "is_seen": False,
            "created_at": now,
            "updated_at": now,
            "reference": reference or {},
            "notifier": notifier or {},
            "message": message,
            "meta": meta or {},
        }
        res = coll.insert_one(doc)
        return {"id": str(res.inserted_id), "_id": str(res.inserted_id), "created_at": serialize_datetime_utc(now)}
    except Exception as e:
        raise Exception(f"Error in create_notification: {e}")


def get_user_notifications(user_id: str, page: int = 1, page_size: int = 20):
    try:
        coll = get_notifications_collection()

        try:
            page = int(page)
            page_size = int(page_size)
        except Exception:
            page = 1
            page_size = 20
        if page < 1:
            page = 1
        if page_size < 1:
            page_size = 1
        if page_size > 200:
            page_size = 200

        query = {"recipient_id": ObjectId(user_id)}

        total = 0
        try:
            total = coll.count_documents(query)
        except Exception:
            total = 0

        skip = (page - 1) * page_size

        cursor = coll.find(query, {
            "_id": 1,
            "notification_type": 1,
            "is_seen": 1,
            "created_at": 1,
            "reference": 1,
            "notifier": 1,
            "message": 1,
            "meta": 1,
        }).sort("created_at", -1).skip(skip).limit(page_size)

        items_raw = list(cursor)
        items = []
        for it in items_raw:
            try:
                it_id = it.get("_id")
                it["_id"] = str(it_id)
                it["id"] = str(it_id)
            except Exception:
                pass
            try:
                if it.get("created_at"):
                    it["created_at"] = serialize_datetime_utc(it["created_at"])
            except Exception:
                pass
            # normalize notifier id to string if present
            try:
                if it.get("notifier") and it["notifier"].get("id"):
                    it["notifier"]["id"] = str(it["notifier"]["id"])
            except Exception:
                pass
            items.append(it)

        total_pages = 0
        try:
            total_pages = (total + page_size - 1) // page_size if page_size else 0
        except Exception:
            total_pages = 0

        return {
            "notifications": items,
            "total": int(total),
            "page": int(page),
            "page_size": int(page_size),
            "total_pages": int(total_pages),
        }

    except HTTPException:
        raise
    except Exception as e:
        raise Exception(f"Error in get_user_notifications: {e}")


def mark_notifications_read(user_id: str, notification_ids: List[str]):
    try:
        coll = get_notifications_collection()
        obj_ids = []
        for nid in notification_ids or []:
            try:
                obj_ids.append(ObjectId(nid))
            except Exception:
                pass
        if not obj_ids:
            return {"updated": 0}

        res = coll.update_many({"_id": {"$in": obj_ids}, "recipient_id": ObjectId(user_id)}, {"$set": {"is_seen": True, "updated_at": datetime.utcnow()}})
        return {"updated": int(res.modified_count)}
    except Exception as e:
        raise Exception(f"Error in mark_notifications_read: {e}")


def mark_all_read(user_id: str):
    try:
        coll = get_notifications_collection()
        res = coll.update_many({"recipient_id": ObjectId(user_id), "is_seen": False}, {"$set": {"is_seen": True, "updated_at": datetime.utcnow()}})
        return {"updated": int(res.modified_count)}
    except Exception as e:
        raise Exception(f"Error in mark_all_read: {e}")


def create_bulk_notifications(recipient_ids: List[str], notification_type: str, notifier: dict, reference: dict, message: str, meta: Optional[dict] = None):
    """Create notifications for multiple recipients using a single bulk insert.
    recipient_ids: list of user id strings
    """
    try:
        if not recipient_ids:
            return {"inserted_count": 0}
        coll = get_notifications_collection()
        now = datetime.utcnow()
        docs = []
        for rid in recipient_ids:
            try:
                doc = {
                    "recipient_id": ObjectId(rid),
                    "notification_type": notification_type,
                    "is_seen": False,
                    "created_at": now,
                    "updated_at": now,
                    "reference": reference or {},
                    "notifier": notifier or {},
                    "message": message,
                    "meta": meta or {},
                }
                docs.append(doc)
            except Exception:
                # skip invalid recipient id
                continue

        if not docs:
            return {"inserted_count": 0}

        res = coll.insert_many(docs)
        return {"inserted_count": len(res.inserted_ids)}
    except Exception as e:
        raise Exception(f"Error in create_bulk_notifications: {e}")
