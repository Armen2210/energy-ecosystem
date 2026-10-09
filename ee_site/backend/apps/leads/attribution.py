"""Bounded metadata; first accepted write wins, not part of legacy fingerprint."""
import json
import re
import time

from rest_framework import serializers

PRODUCTS = ("bmk", "btp", "vns", "pns", "automation-cabinets")
SERVICES = ("design", "construction-installation", "commissioning")
CAMPAIGN_KEYS = ("utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid")


def validate_attribution(value):
    if value == {}:
        return value
    if not isinstance(value, dict) or set(value) != {"version", "first", "last"} or type(value["version"]) is not int or value["version"] != 1:
        raise serializers.ValidationError("Некорректная структура источника.")
    if len(json.dumps(value, ensure_ascii=True, separators=(",", ":"))) > 2048:
        raise serializers.ValidationError("Превышен размер источника.")
    for key in ("first", "last"):
        touch = value[key]
        if not isinstance(touch, dict) or set(touch) != {"tags", "at"}:
            raise serializers.ValidationError("Некорректная структура входа.")
        if type(touch["at"]) is not int or not 946684800000 <= touch["at"] <= int(time.time() * 1000) + 300000:
            raise serializers.ValidationError("Некорректное время входа.")
        tags = touch["tags"]
        if not isinstance(tags, dict) or not tags or not set(tags).issubset(CAMPAIGN_KEYS):
            raise serializers.ValidationError("Недопустимые рекламные поля.")
        for name, code in tags.items():
            if not isinstance(code, str) or not (
                re.fullmatch(r"[0-9]{1,32}", code) if name == "yclid" else
                re.fullmatch(r"[a-z][a-z0-9_-]{0,63}", code) and not re.search(r"\d{7}", code)
            ):
                raise serializers.ValidationError("Недопустимый рекламный код.")
    if value["first"]["at"] > value["last"]["at"]:
        raise serializers.ValidationError("Некорректный порядок входов.")
    return value


class CampaignField(serializers.JSONField):
    def to_internal_value(self, data):
        # Bound the raw multipart string before JSON decoding.
        if isinstance(data, str) and len(data) > 2048:
            self.fail("invalid")
        return validate_attribution(super().to_internal_value(data))
