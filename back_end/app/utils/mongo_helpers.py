from enum import Enum
from typing import Any

def serialize_enums(obj: Any) -> Any:
    if isinstance(obj, Enum):
        return obj.value
    elif isinstance(obj, dict):
        return {k: serialize_enums(v) for k, v in obj.items()}
    elif isinstance(obj, list):
        return [serialize_enums(i) for i in obj]
    elif isinstance(obj, tuple):
        return tuple(serialize_enums(i) for i in obj)
    else:
        return obj