from typing import Optional
from bson import ObjectId
from datetime import datetime

from app.db.mongo import get_collection
from app.configs.config import settings
from app.services.error import raise_http_error
from fastapi import status, HTTPException
from app.utils.date_time import serialize_datetime_utc


def get_grievances_collection():
    return get_collection(
        db_name=settings.PRODUCTION_DATABASE_NAME,
        collection_name="grievances_thoughts"
    )


def get_comments_collection():
    return get_collection(
        db_name=settings.PRODUCTION_DATABASE_NAME,
        collection_name="comments"
    )


def get_user_posts(user_id: str, post_type: Optional[str] = None):
    try:
        coll = get_grievances_collection()
        comments_coll = get_comments_collection()
        query = {"user_id": ObjectId(user_id)}
        if post_type:
            query["post_type"] = post_type

        cursor = coll.find(query, {
            "_id": 1,
            "title": 1,
            "description": 1,
            "post_type": 1,
            "posted_at": 1,
            "comments_count": 1,
            "created_at": 1,
        }).sort("posted_at", -1)

        posts = []
        for p in cursor:
            orig_id = p.get("_id")
            p["_id"] = str(orig_id)
            p["id"] = str(orig_id)
            if p.get("posted_at"):
                p["posted_at"] = serialize_datetime_utc(p["posted_at"])
            # always recompute comments_count from comments collection for accuracy
            try:
                cnt = comments_coll.count_documents({"post_id": orig_id})
                p["comments_count"] = int(cnt)
            except Exception:
                p["comments_count"] = 0

            posts.append(p)

        return posts

    except HTTPException:
        raise
    except Exception as e:
        raise Exception(f"Error in get_user_posts: {e}")


def create_post(user_id: str, title: str, description: str, post_type: str):
    try:
        coll = get_grievances_collection()
        now = datetime.utcnow()
        doc = {
            "user_id": ObjectId(user_id),
            "title": title,
            "description": description,
            "post_type": post_type,
            "posted_at": now,
            "comments_count": 0,
            "created_at": now,
            "updated_at": now,
        }
        res = coll.insert_one(doc)
        return {"id": str(res.inserted_id), "_id": str(res.inserted_id), "posted_at": serialize_datetime_utc(now)}
    except Exception as e:
        raise Exception(f"Error in create_post: {e}")


def create_comment(user_id: str, username: Optional[str], post_id: str, content: str, post_type: Optional[str] = None):
    try:
        comments_coll = get_comments_collection()
        posts_coll = get_grievances_collection()

        if not ObjectId.is_valid(post_id):
            raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message="Invalid post id")

        now = datetime.utcnow()
        doc = {
            "user_id": ObjectId(user_id),
            "username": username,
            "commented_content": content,
            "post_id": ObjectId(post_id),
            "post_type": post_type,
            "commented_at": now,
            "created_at": now,
            "updated_at": now,
        }

        res = comments_coll.insert_one(doc)

        # increment comments_count on post
        posts_coll.update_one({"_id": ObjectId(post_id)}, {"$inc": {"comments_count": 1}})

        # prepare response
        doc["_id"] = str(res.inserted_id)
        # normalize id and datetime fields to strings for JSON/Pydantic
        doc["post_id"] = str(post_id)
        # prefer returning username for frontend; fallback to string user id
        try:
            doc["user_id"] = username if username else (str(doc["user_id"]) if doc.get("user_id") is not None else None)
        except Exception:
            doc["user_id"] = username or doc.get("user_id")

        for dt_field in ("commented_at", "created_at", "updated_at"):
            if doc.get(dt_field):
                doc[dt_field] = serialize_datetime_utc(doc[dt_field])

        return doc
    except HTTPException:
        raise
    except Exception as e:
        raise Exception(f"Error in create_comment: {e}")


def get_post_with_comments(post_id: str):
    try:
        coll = get_grievances_collection()
        comments_coll = get_comments_collection()

        if not ObjectId.is_valid(post_id):
            raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message="Invalid post id")

        post = coll.find_one({"_id": ObjectId(post_id)})
        if not post:
            raise_http_error(status_code=status.HTTP_404_NOT_FOUND, message="Post not found")
        # normalize id fields for response validation
        post_id_str = str(post["_id"])
        post["_id"] = post_id_str
        post["id"] = post_id_str
        # normalize post user_id and datetime fields
        user_obj_id = None
        try:
            user_obj_id = post.get("user_id")
            post["user_id"] = str(post["user_id"]) if post.get("user_id") is not None else None
        except Exception:
            user_obj_id = None

        if post.get("posted_at"):
            post["posted_at"] = serialize_datetime_utc(post["posted_at"])
        for dt in ("created_at", "updated_at"):
            if post.get(dt):
                post[dt] = serialize_datetime_utc(post[dt])

        # fetch comments
        comments_cursor = comments_coll.find({"post_id": ObjectId(post_id)}).sort("commented_at", 1)
        comments = []
        for c in comments_cursor:
            try:
                c["_id"] = str(c["_id"])
            except Exception:
                pass
            try:
                c["post_id"] = str(c["post_id"]) if c.get("post_id") else None
            except Exception:
                pass
            try:
                # prefer username if available so frontend can display name
                c["user_id"] = c.get("username") or (str(c["user_id"]) if c.get("user_id") is not None else None)
            except Exception:
                pass

            if c.get("commented_at"):
                c["commented_at"] = serialize_datetime_utc(c["commented_at"])
            for dt in ("created_at", "updated_at"):
                if c.get(dt):
                    c[dt] = serialize_datetime_utc(c[dt])
            comments.append(c)

        # ensure post comments_count reflects actual comments
        try:
            post["comments_count"] = len(comments)
        except Exception:
            post["comments_count"] = int(post.get("comments_count") or 0)

        # fetch author created_at (member since) from users collection if available
        try:
            users_coll = get_collection(db_name=settings.PRODUCTION_DATABASE_NAME, collection_name=settings.USERS_COLLECTION_NAME)
            if user_obj_id:
                try:
                    user_doc = users_coll.find_one({"_id": ObjectId(user_obj_id)})
                    if user_doc and user_doc.get("created_at"):
                        try:
                            post["member_since"] = user_doc.get("created_at").isoformat()
                        except Exception:
                            post["member_since"] = str(user_doc.get("created_at"))
                except Exception:
                    # if user_obj_id was already a string id
                    try:
                        user_doc = users_coll.find_one({"_id": ObjectId(str(user_obj_id))})
                        if user_doc and user_doc.get("created_at"):
                            try:
                                post["member_since"] = user_doc.get("created_at").isoformat()
                            except Exception:
                                post["member_since"] = str(user_doc.get("created_at"))
                    except Exception:
                        pass
        except Exception:
            pass

        return {"post": post, "comments": comments}

    except HTTPException:
        raise
    except Exception as e:
        raise Exception(f"Error in get_post_with_comments: {e}")
