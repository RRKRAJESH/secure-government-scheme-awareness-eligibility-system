from app.services.error import raise_http_error
from app.db.mongo import get_collection
from app.configs.config import settings
from fastapi import status
from bson import ObjectId
from app.utils.mongo_helpers import serialize_enums
from app.utils.date_time import current_time_utc


def is_profile_complete(profile_data):
    """Return True when the minimum profile fields required for eligibility are present."""
    if not profile_data:
        return False

    profile = profile_data.get("profile") or {}
    basic = profile.get("basic_info") or {}
    comm = profile.get("communication_info") or {}
    addr = profile.get("address_info") or {}

    required_checks = [
        basic.get("name"),
        basic.get("dob"),
        basic.get("gender"),
        comm.get("phone"),
        addr.get("address_line_1"),
        addr.get("district"),
        addr.get("pincode"),
        basic.get("social_category"),
    ]

    return all(required_checks)


def update_profile_info(update_payload, token):
    """Update user profile with nested structure matching new schema"""
    try:
        user_profile_collection = get_collection(
            db_name=settings.PRODUCTION_DATABASE_NAME, 
            collection_name=settings.USERS_PROFILE_COLLECTION_NAME
        )

        users_collection = get_collection(
            db_name=settings.PRODUCTION_DATABASE_NAME, 
            collection_name=settings.USERS_COLLECTION_NAME
        )

        user_id = token.get("user_id")

        user_profile_existing_check = user_profile_collection.find_one({"user_id": ObjectId(user_id)})
        
        if not user_profile_existing_check:
            message = "User not found in the user profiles list"
            raise_http_error(
                status_code=status.HTTP_400_BAD_REQUEST, 
                message=message
            )

        # Serialize enums and build nested $set operations
        profile_data = serialize_enums(update_payload)

        # Build update document preserving nested structure
        update_doc = {}

        if "profile" in profile_data:
            for section_key, section_val in profile_data["profile"].items():
                if section_val is not None:
                    update_doc[f"profile.{section_key}"] = section_val

        if "registrations" in profile_data and profile_data["registrations"] is not None:
            update_doc["registrations"] = profile_data["registrations"]

        if "exclusions" in profile_data and profile_data["exclusions"] is not None:
            update_doc["exclusions"] = profile_data["exclusions"]

        update_doc["updated_at"] = current_time_utc()

        user_profile_collection.update_one(
            {"user_id": ObjectId(user_id)}, 
            {"$set": update_doc}
        )

        users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": {"user_profile_updated": True}}
        )

    except Exception as e:
        print(f"Error occurred while processing :: update_profile_info() :{str(e)}")
        raise


def get_current_profile_info(token):
    """Get current user profile with nested structure"""
    try:
        user_profile_collection = get_collection(
            db_name=settings.PRODUCTION_DATABASE_NAME, 
            collection_name=settings.USERS_PROFILE_COLLECTION_NAME
        )
        user_id = token.get("user_id")

        user_profile_existing_check = user_profile_collection.find_one({"user_id": ObjectId(user_id)})
        
        if not user_profile_existing_check:
            message = "User not found in the user profiles list"
            raise_http_error(
                status_code=status.HTTP_400_BAD_REQUEST, 
                message=message
            )
        
        # Get profile data excluding internal fields
        profile_data = user_profile_collection.find_one(
            {"user_id": ObjectId(user_id)},
        )
        
        # Remove internal MongoDB fields
        if profile_data:
            fields_to_remove = ["_id", "user_id"]
            profile_data = {
                k: str(v) if isinstance(v, ObjectId) else v 
                for k, v in profile_data.items() 
                if k not in fields_to_remove
            }
        
        is_complete = is_profile_complete(profile_data)
        
        return {
            "profile_info": profile_data if profile_data else {},
            "is_profile_complete": is_complete
        }
    
    except Exception as e:
        print(f"Error occurred while processing :: get_current_profile_info() :{str(e)}")
        raise

