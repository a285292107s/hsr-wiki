import logging

from config import OUTPUT_DIR, PROPERTY_MAP
from enum_labels import resolve as resolve_label
from utils import save_json, sort_by_id

logger = logging.getLogger("converter")


def convert() -> None:
    result = [
        {"id": key, "name": resolve_label("property", key, name)}
        for key, name in PROPERTY_MAP.items()
    ]
    result = sort_by_id(result)
    save_json(result, OUTPUT_DIR / "properties.json")
