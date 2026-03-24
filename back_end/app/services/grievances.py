from typing import Optional
import math
from bson import ObjectId
from datetime import datetime

from app.db.mongo import get_collection
from app.configs.config import settings
from app.services.error import raise_http_error
from fastapi import status, HTTPException
from app.utils.date_time import serialize_datetime_utc
from app.services.notifications import create_notification, create_bulk_notifications
import re
from app.services.notifications import create_bulk_notifications


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


def get_users_collection():
    return get_collection(
        db_name=settings.PRODUCTION_DATABASE_NAME,
        collection_name=settings.USERS_COLLECTION_NAME,
    )


def get_user_posts(user_id: str, post_type: Optional[str] = None, page: int = 1, page_size: int = 20):
    try:
        coll = get_grievances_collection()
        comments_coll = get_comments_collection()
        users_coll = get_users_collection()
        # Global feed: show all posts from shared master collection.
        query = {}
        if post_type:
            query["post_type"] = post_type

        # validate pagination
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
        if page_size > 100:
            page_size = 100

        total = 0
        try:
            total = coll.count_documents(query)
        except Exception:
            total = 0

        skip = (page - 1) * page_size

        cursor = coll.find(query, {
            "_id": 1,
            "user_id": 1,
            "title": 1,
            "description": 1,
            "post_type": 1,
            "posted_at": 1,
            "comments_count": 1,
            "created_at": 1,
        }).sort("posted_at", -1).skip(skip).limit(page_size)

        posts_raw = list(cursor)

        user_ids = []
        for post in posts_raw:
            post_user_id = post.get("user_id")
            if post_user_id is not None:
                user_ids.append(post_user_id)

        users_map = {}
        if user_ids:
            try:
                for user_doc in users_coll.find({"_id": {"$in": list(set(user_ids))}}, {"username": 1, "name": 1}):
                    users_map[str(user_doc.get("_id"))] = user_doc.get("username") or user_doc.get("name") or "User"
            except Exception:
                users_map = {}

        posts = []
        for p in posts_raw:
            orig_id = p.get("_id")
            p["_id"] = str(orig_id)
            p["id"] = str(orig_id)
            if p.get("user_id") is not None:
                p["user_id"] = str(p.get("user_id"))
                p["username"] = users_map.get(p["user_id"], "User")
            else:
                p["user_id"] = None
                p["username"] = "User"
            if p.get("posted_at"):
                p["posted_at"] = serialize_datetime_utc(p["posted_at"])
            # always recompute comments_count from comments collection for accuracy
            try:
                cnt = comments_coll.count_documents({"post_id": orig_id})
                p["comments_count"] = int(cnt)
            except Exception:
                p["comments_count"] = 0

            posts.append(p)

        total_pages = 0
        try:
            total_pages = math.ceil(total / page_size) if page_size else 0
        except Exception:
            total_pages = 0

        return {
            "posts": posts,
            "total": int(total),
            "page": int(page),
            "page_size": int(page_size),
            "total_pages": int(total_pages),
        }

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
        inserted_id = str(res.inserted_id)

        # Notify other users about the new post
        try:
            users_coll = get_users_collection()
            # fetch the author display name if available
            author_name = None
            try:
                author_doc = users_coll.find_one({"_id": ObjectId(user_id)}, {"username": 1, "name": 1})
                if author_doc:
                    author_name = author_doc.get("username") or author_doc.get("name")
            except Exception:
                author_name = None

            # gather recipient ids (all users except the author)
            recipient_ids = []
            try:
                for u in users_coll.find({}, {"_id": 1}):
                    try:
                        uid = u.get("_id")
                        if uid and str(uid) != str(user_id):
                            recipient_ids.append(str(uid))
                    except Exception:
                        continue
            except Exception:
                recipient_ids = []

            if recipient_ids:
                notifier = {"kind": "user", "id": str(user_id), "name": author_name}
                # include both the client navigation URL and the backend detail API
                reference = {
                    "kind": "post",
                    "id": inserted_id,
                    "url": f"/posts/{inserted_id}",
                    "api_url": f"/api/v1/backend/grievances/detail/{inserted_id}",
                }
                message = f"{author_name or 'A user'} added a new post: {title}"
                meta = {"post_title": title}
                # bulk create notifications (sync). For large user bases, perform this in background.
                try:
                    create_bulk_notifications(recipient_ids, "NEW_POST", notifier, reference, message, meta=meta)
                except Exception:
                    # do not block post creation on notification errors
                    pass
        except Exception:
            # swallow notification-related errors
            pass

        return {"id": inserted_id, "_id": inserted_id, "posted_at": serialize_datetime_utc(now)}
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
        doc["id"] = doc["_id"]
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

        # --- Notifications: notify post owner and any mentioned users ---
        try:
            users_coll = get_users_collection()
            # fetch post owner
            post_owner_id = None
            post_title = None
            try:
                post_doc = posts_coll.find_one({"_id": ObjectId(post_id)}, {"user_id": 1, "title": 1})
                if post_doc:
                    post_owner_id = post_doc.get("user_id")
                    post_title = post_doc.get("title")
            except Exception:
                post_owner_id = None

            notifier = {"kind": "user", "id": str(user_id), "name": username}
            reference = {
                "kind": "post",
                "id": str(post_id),
                "url": f"/posts/{post_id}",
                "api_url": f"/api/v1/backend/grievances/detail/{post_id}",
            }
            meta = {"comment_id": doc.get("_id")}

            # notify post owner if not the commenter
            try:
                if post_owner_id and str(post_owner_id) != str(user_id):
                    message = f"{username or 'Someone'} commented on your post"
                    create_notification(str(post_owner_id), "NEW_COMMENT", notifier, reference, message, meta=meta)
            except Exception:
                pass

            # find @mentions in comment content (e.g., @username)
            try:
                mentions = set(re.findall(r"@([\w\.-]+)", content or ""))
                if mentions:
                    # resolve mentions to user ids via username field
                    mentioned_users = users_coll.find({"username": {"$in": list(mentions)}}, {"_id": 1, "username": 1})
                    recipient_ids = []
                    for mu in mentioned_users:
                        try:
                            mid = mu.get("_id")
                            if mid and str(mid) != str(user_id) and (not post_owner_id or str(mid) != str(post_owner_id)):
                                recipient_ids.append(str(mid))
                        except Exception:
                            continue
                    if recipient_ids:
                        mention_msg = f"{username or 'Someone'} mentioned you in a comment"
                        create_bulk_notifications(recipient_ids, "NEW_COMMENT", notifier, reference, mention_msg, meta={**meta, "post_title": post_title})
            except Exception:
                pass
        except Exception:
            # keep comment creation resilient even if notifications fail
            pass

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
        # return comments newest-first to match UI expectations (descending by commented_at)
        comments_cursor = comments_coll.find({"post_id": ObjectId(post_id)}).sort("commented_at", -1)
        comments = []
        for c in comments_cursor:
            try:
                c["_id"] = str(c["_id"])
            except Exception:
                pass
            try:
                # ensure an `id` field exists alongside `_id` for frontend convenience
                if c.get("_id"):
                    c["id"] = c["_id"]
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
                    if user_doc and (user_doc.get("username") or user_doc.get("name")):
                        post["username"] = user_doc.get("username") or user_doc.get("name")
                    if user_doc and user_doc.get("created_at"):
                        try:
                            post["member_since"] = user_doc.get("created_at").isoformat()
                        except Exception:
                            post["member_since"] = str(user_doc.get("created_at"))
                except Exception:
                    # if user_obj_id was already a string id
                    try:
                        user_doc = users_coll.find_one({"_id": ObjectId(str(user_obj_id))})
                        if user_doc and (user_doc.get("username") or user_doc.get("name")):
                            post["username"] = user_doc.get("username") or user_doc.get("name")
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


def update_comment(user_id: str, comment_id: str, new_content: str):
    try:
        comments_coll = get_comments_collection()
        posts_coll = get_grievances_collection()

        if not ObjectId.is_valid(comment_id):
            raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message="Invalid comment id")

        orig = comments_coll.find_one({"_id": ObjectId(comment_id)})
        if not orig:
            raise_http_error(status_code=status.HTTP_404_NOT_FOUND, message="Comment not found")

        # verify ownership: stored user_id is ObjectId
        try:
            stored_user = orig.get("user_id")
            if stored_user is not None and str(stored_user) != str(user_id):
                raise_http_error(status_code=status.HTTP_403_FORBIDDEN, message="Not authorized to edit this comment")
        except Exception:
            pass

        update_fields = {"commented_content": new_content, "updated_at": datetime.utcnow()}
        comments_coll.update_one({"_id": ObjectId(comment_id)}, {"$set": update_fields})

        updated = comments_coll.find_one({"_id": ObjectId(comment_id)})
        if not updated:
            raise_http_error(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, message="Failed to fetch updated comment")

        # normalize response
        try:
            updated["_id"] = str(updated["_id"])
        except Exception:
            pass
        try:
            updated["post_id"] = str(updated["post_id"]) if updated.get("post_id") else None
        except Exception:
            pass
        try:
            # prefer username for frontend convenience
            updated["user_id"] = updated.get("username") or (str(updated.get("user_id")) if updated.get("user_id") is not None else None)
        except Exception:
            pass

        for dt_field in ("commented_at", "created_at", "updated_at"):
            if updated.get(dt_field):
                updated[dt_field] = serialize_datetime_utc(updated[dt_field])

        return updated
    except HTTPException:
        raise
    except Exception as e:
        raise Exception(f"Error in update_comment: {e}")


def update_post(user_id: str, post_id: str, title: Optional[str] = None, description: Optional[str] = None):
    try:
        posts_coll = get_grievances_collection()

        if not ObjectId.is_valid(post_id):
            raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message="Invalid post id")

        # fetch the post to verify ownership
        orig = posts_coll.find_one({"_id": ObjectId(post_id)})
        if not orig:
            raise_http_error(status_code=status.HTTP_404_NOT_FOUND, message="Post not found")

        # keep original posted_at and author for response preservation
        orig_posted_at = orig.get("posted_at")
        orig_user_id = orig.get("user_id")
        # normalize: stored user_id is ObjectId; user_id param is expected string
        try:
            if orig_user_id is not None and str(orig_user_id) != str(user_id):
                raise_http_error(status_code=status.HTTP_403_FORBIDDEN, message="Not authorized to edit this post")
        except Exception:
            pass

        update_fields = {}
        if title is not None:
            update_fields["title"] = title
        if description is not None:
            update_fields["description"] = description
        if not update_fields:
            # nothing to update
            # return the existing normalized post
            post = orig
        else:
            update_fields["updated_at"] = datetime.utcnow()
            posts_coll.update_one({"_id": ObjectId(post_id)}, {"$set": update_fields})
            post = posts_coll.find_one({"_id": ObjectId(post_id)})

        # normalize post for response
        try:
            post_id_str = str(post["_id"])
            post["_id"] = post_id_str
            post["id"] = post_id_str
        except Exception:
            pass

        try:
            post["user_id"] = str(post["user_id"]) if post.get("user_id") is not None else None
        except Exception:
            pass

        # always return the original posted_at (creation time) if available
        try:
            if orig_posted_at:
                post["posted_at"] = serialize_datetime_utc(orig_posted_at)
            elif post.get("posted_at"):
                post["posted_at"] = serialize_datetime_utc(post["posted_at"])
        except Exception:
            pass
        for dt in ("created_at", "updated_at"):
            if post.get(dt):
                try:
                    post[dt] = serialize_datetime_utc(post[dt])
                except Exception:
                    post[dt] = str(post[dt])

        # attach username if available, prefer stored username (not full name)
        try:
            users_coll = get_collection(db_name=settings.PRODUCTION_DATABASE_NAME, collection_name=settings.USERS_COLLECTION_NAME)
            user_obj_id = orig_user_id
            resolved_username = None
            if user_obj_id is not None:
                # try robust lookups: handle both ObjectId and string id stored
                try:
                    user_doc = users_coll.find_one({"_id": ObjectId(user_obj_id)})
                    if not user_doc:
                        # try string form
                        user_doc = users_coll.find_one({"_id": ObjectId(str(user_obj_id))})
                except Exception:
                    try:
                        user_doc = users_coll.find_one({"_id": ObjectId(str(user_obj_id))})
                    except Exception:
                        user_doc = None

                if user_doc:
                    resolved_username = user_doc.get("username") or user_doc.get("name")

            # fallback: if username is not resolved, prefer existing post.username or string user_id
            post["username"] = resolved_username or post.get("username") or (post.get("user_id") if post.get("user_id") else None)
        except Exception:
            # ensure we at least have some username-like value
            try:
                post["username"] = post.get("username") or (post.get("user_id") if post.get("user_id") else None)
            except Exception:
                pass

        # recompute comments_count
        try:
            comments_coll = get_comments_collection()
            cnt = comments_coll.count_documents({"post_id": ObjectId(post_id)})
            post["comments_count"] = int(cnt)
        except Exception:
            post["comments_count"] = int(post.get("comments_count") or 0)

        return post
    except HTTPException:
        raise
    except Exception as e:
        raise Exception(f"Error in update_post: {e}")
