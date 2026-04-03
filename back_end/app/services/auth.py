from fastapi import status, HTTPException
from fastapi.security import HTTPBearer
from bson import ObjectId

from app.services.error import raise_http_error
from app.configs.config import settings
from app.db.mongo import get_collection

from app.utils.auth import hash_password, verify_password, create_access_token
from app.utils.date_time import current_time_utc

security = HTTPBearer()


def register_user(register_user_info_payload):
    try:
        users_collection = get_collection(
            db_name=settings.PRODUCTION_DATABASE_NAME,
            collection_name=settings.USERS_COLLECTION_NAME,
        )
        users_profile_collection = get_collection(
            db_name=settings.PRODUCTION_DATABASE_NAME,
            collection_name=settings.USERS_PROFILE_COLLECTION_NAME,
        )

        username = register_user_info_payload.get("username")
        password = register_user_info_payload.get("password")
        requested_role = str(register_user_info_payload.get("role") or "USER").upper()

        if requested_role != "USER":
            raise_http_error(
                status_code=status.HTTP_400_BAD_REQUEST,
                message="Register endpoint can only create user accounts",
            )

        user_role = "user"

        user_existing_check = users_collection.find_one(
            {"username": {"$regex": username, "$options": "i"}}
        )

        if user_existing_check:
            message = "User already exists"
            raise_http_error(status_code=status.HTTP_400_BAD_REQUEST, message=message)

        hashed_password = hash_password(password=password)

        new_user_info = {
            "username": username,
            "password": hashed_password,
            "role": user_role,
            "is_active": True,
            "user_profile_updated": False,
            "user_profile_id": None,
            "last_login_at": current_time_utc(),
            "created_at": current_time_utc(),
            "updated_at": current_time_utc(),
            "is_deleted": False,
            "success_login_count": 0,
        }

        user_insert_info = users_collection.insert_one(new_user_info)

        users_profile_data = {
            "user_id": ObjectId(user_insert_info.inserted_id),
            "profile": {
                "basic_info": None,
                "communication_info": None,
                "address_info": None,
                "economic_info": None,
                "beneficiary_info": None,
                "fisheries": None,
            },
            "registrations": None,
            "exclusions": None,
            "created_at": current_time_utc(),
            "updated_at": current_time_utc(),
        }

        user_profile_insert_info = users_profile_collection.insert_one(
            users_profile_data
        )

        users_collection.update_one(
            {"_id": ObjectId(user_insert_info.inserted_id)},
            {
                "$set": {
                    "user_profile_id": ObjectId(user_profile_insert_info.inserted_id)
                }
            },
        )

        return {
            "error": False,
            "data": {
                "message": "User registered successfully",
                "acknowledgement": True,
            },
        }

    except HTTPException:
        raise

    except Exception as e:
        error_msg = f"Error occured while processing register_user() :: {str(e)}"
        raise Exception(error_msg)


def login_user(login_user_info):
    try:
        users_collection = get_collection(
            db_name=settings.PRODUCTION_DATABASE_NAME,
            collection_name=settings.USERS_COLLECTION_NAME,
        )

        username = login_user_info.get("username")
        password = login_user_info.get("password")

        user_existing_check = users_collection.find_one({"username": username})
        if not user_existing_check:
            raise_http_error(
                status_code=status.HTTP_400_BAD_REQUEST,
                message="Invalid email or password",
            )

        if bool(user_existing_check.get("is_deleted")):
            raise_http_error(
                status_code=status.HTTP_403_FORBIDDEN,
                message="Your account was deleted by the admin",
            )

        if user_existing_check.get("is_active") is False:
            raise_http_error(
                status_code=status.HTTP_403_FORBIDDEN,
                message="Your account is inactive. Please contact the admin",
            )

        if not verify_password(password, user_existing_check["password"]):
            raise_http_error(
                status_code=status.HTTP_400_BAD_REQUEST,
                message="Invalid email or password",
            )

        user_info = dict()
        user_info["username"] = user_existing_check["username"]
        user_info["role"] = user_existing_check["role"]
        user_info["user_id"] = str(user_existing_check["_id"])

        token = create_access_token(data=user_info)

        users_collection.update_one(
            {"_id": user_existing_check["_id"]},
            {
                "$set": {
                    "last_login_at": current_time_utc(),
                    "updated_at": current_time_utc(),
                },
                "$inc": {"success_login_count": 1},
            },
        )

        return {"error": False, "data": {"access_token": token}}

    except HTTPException:
        raise

    except Exception as e:
        message = f"Error occured while processing login_user() :: {str(e)}"
        raise Exception(message)
