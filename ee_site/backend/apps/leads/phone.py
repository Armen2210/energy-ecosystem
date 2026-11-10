"""Normalize complete Russian lead phone numbers without rewriting foreign numbers."""
import re


def normalize_lead_phone(value):
    text = str(value or "").strip()
    if not re.fullmatch(r"[+0-9\s().-]+", text):
        return text
    digits = re.sub(r"[^0-9]", "", text)
    if len(digits) == 10 and not text.startswith("+"):
        return "+7" + digits
    if len(digits) == 11 and digits.startswith(("7", "8")):
        return "+7" + digits[1:]
    return text
