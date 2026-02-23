import re

domain_regex = r"^(?:[a-zA-Z0-9-]+\.)+[a-zA-Z]{2,}$"
url_regex = r"^[a-zA-Z]+://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}.*$"
email_regex = r"^[a-zA-Z0-9._+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,12}$"
phone_regex = r"^[6-9]\d{9}$"

def validate_domain(v: str) -> str:
    if not re.match(domain_regex, v):
        raise ValueError("Invalid domain")
    return v

def validate_url(v: str) -> str:
    if not re.match(url_regex, v):
        raise ValueError("Invalid URL")
    return v

def validate_email(v: str):
    if not re.match(email_regex, v):
        raise ValueError("Invalid Email Id")
    return v

def validate_phone(v: str):
    if not re.match(phone_regex, v):
        raise ValueError("Invalid Phone Number")
    return v

def validate_tn_pincode(pincode: int):
    if not 600001 <= pincode <= 643282:
        raise ValueError("Invalid Pincode range")
    return pincode