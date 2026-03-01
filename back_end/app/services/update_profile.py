from app.services.error import raise_http_error
from app.db.mongo import get_collection
from app.configs.config import settings
from fastapi import status
from bson import ObjectId
from app.utils.mongo_helpers import serialize_enums

def update_profile_info(update_payload, token):
    try:

        user_profile_collection = get_collection(db_name= settings.PRODUCTION_DATABASE_NAME, collection_name= settings.USERS_PROFILE_COLLECTION_NAME)

        user_id = token.get("user_id")
        profile_info_type = serialize_enums(update_payload.get("profile_info_type"))

        user_profile_existing_check = user_profile_collection.find_one({"user_id": ObjectId(user_id)})
        
        if not user_profile_existing_check:
            message = "User not found in the user profiles list"
            raise_http_error(status_code= status.HTTP_400_BAD_REQUEST, 
                        message= message
                        )
        if profile_info_type == "BASIC_INFO":
            user_profile_collection.update_one({"user_id": ObjectId(user_id)}, {"$set": {"basic_info": serialize_enums(update_payload.get("update_info"))}})
        elif profile_info_type == "COMMUNICATION_INFO":
            user_profile_collection.update_one({"user_id": ObjectId(user_id)}, {"$set": {"communication_info": serialize_enums(update_payload.get("update_info"))}})
        elif profile_info_type == "EDUCATION_INFO":
            user_profile_collection.update_one({"user_id": ObjectId(user_id)}, {"$set": {"education_info": serialize_enums(update_payload.get("update_info"))}})
        elif profile_info_type == "BENEFICIARY_INFO":
            user_profile_collection.update_one({"user_id": ObjectId(user_id)}, {"$set": {"beneficiary_info": serialize_enums(update_payload.get("update_info"))}})

    except Exception as e:
        print(f"Error occured while processing :: update_profile_info() :{str(e)}")
        raise


def get_current_profile_info(token):
    try:
        user_profile_collection = get_collection(db_name= settings.PRODUCTION_DATABASE_NAME, collection_name= settings.USERS_PROFILE_COLLECTION_NAME)
        user_id = token.get("user_id")

        print("token", token)

        user_profile_existing_check = user_profile_collection.find_one({"user_id": ObjectId(user_id)})
        
        if not user_profile_existing_check:
            message = "User not found in the user profiles list"
            raise_http_error(status_code= status.HTTP_400_BAD_REQUEST, 
                        message= message
                        )
            
        user_profile_status = user_profile_collection.find_one({"user_id": ObjectId(user_id)},{"_id":0, "basic_info":1, "communication_info": 1, "education_info": 1, "beneficiary_info": 1})
        return user_profile_status
    
    except Exception as e:
        print(f"Error occured while processing :: update_profile_info() :{str(e)}")
        raise

