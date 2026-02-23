from app.services.error import raise_http_error
from app.db.mongo import get_collection
from app.configs.config import settings
from fastapi import status
from bson import ObjectId

def update_profile_info(update_payload, token):
    try:

        user_profile_collection = get_collection(db_name= settings.PRODUCTION_DATABASE_NAME, collection_name= settings.USERS_PROFILE_COLLECTION_NAME)

        user_id = token.get("user_id")
        user_profile_existing_check = user_profile_collection.find_one({"user_id": ObjectId(user_id)})
        if not user_profile_existing_check:
            message = "User not found in the user profiles list"
            raise_http_error(status_code= status.HTTP_400_BAD_REQUEST, 
                        message= message
                        )
        print()
        if update_payload.get("profile_info_type").value == "BASIC_INFO":
            user_profile_collection.update_one({"user_id": ObjectId(user_id)}, {"$set": {"basic_info": update_payload.get("update_info")}})
        print(" ????????????????????????????")

    except Exception as e:
        print(f"Error occured while processing :: update_profile_info() :{str(e)}")
        raise