"""Versioned, bounded server validation; UI validity is never trusted."""

import json
import re
from decimal import Decimal, InvalidOperation, Context
from pathlib import Path
from django.conf import settings
from rest_framework import serializers

CONTRACT = json.loads(
    (
        Path(__file__).resolve().parents[4] / "contracts/questionnaires/v1/fields.json"
    ).read_text()
)
NUMBER = re.compile(r"^[+-]?(?:[0-9]+(?:[.,][0-9]*)?|[.,][0-9]+)$")


def applicable(field, answers):
    return all(answers.get(k) in v for k, v in field.get("when", {}).items()) and (
        not field.get("whenAny")
        or any(answers.get(k) in v for k, v in field["whenAny"].items())
    )


def validate_payload(raw):
    errors = {}

    def error(path, message):
        errors[path] = message

    def exact(value, keys, path):
        if not isinstance(value, dict):
            error(path, "Ожидается объект.")
            return False
        if set(value) - set(keys):
            error(path, "Неизвестные поля.")
        return True

    def fields(data, definitions, path):
        if not exact(data, [f["key"] for f in definitions], path):
            return {}
        result = {}
        for f in definitions:
            key = f["key"]
            value = data.get(key)
            p = path + "." + key
            if not applicable(f, data):
                if key in data:
                    error(p, "Поле неприменимо при выбранных условиях.")
                continue
            if value is None or value == "":
                if f["required"]:
                    error(p, "Обязательное поле.")
                continue
            if f["type"] == "number":
                if f.get("units"):
                    if not exact(value, ("value", "unit"), p):
                        continue
                    unit = value.get("unit")
                    text = value.get("value")
                    factors = CONTRACT["units"][f["units"]]
                    if unit not in factors:
                        error(p, "Неизвестная единица.")
                        continue
                else:
                    text = value
                    unit = None
                if isinstance(text, str):
                    text = text.strip()
                if (
                    not isinstance(text, str)
                    or len(text) > 64
                    or not NUMBER.fullmatch(text)
                ):
                    error(p, "Введите конечное число.")
                    continue
                try:
                    number = Decimal(text.replace(",", "."))
                    if not number.is_finite() or abs(number) > Decimal("1e15"):
                        raise InvalidOperation
                    if f.get("integer") and number != number.to_integral_value():
                        raise InvalidOperation
                    if "min" in f and (
                        number < Decimal(str(f["min"]))
                        or f.get("exclusiveMin")
                        and number == Decimal(str(f["min"]))
                    ):
                        raise InvalidOperation
                    if "max" in f and number > Decimal(str(f["max"])):
                        raise InvalidOperation
                except InvalidOperation:
                    error(p, "Недопустимое значение или диапазон.")
                    continue
                # One canonical physical value in base units, no client-derived value.
                if unit:
                    number *= Decimal(factors[unit])
                canonical = (
                    format(
                        number.quantize(
                            Decimal("0.000000000001"), context=Context(prec=64)
                        ).normalize(),
                        "f",
                    )
                    if abs(number) >= Decimal("0.000000000001")
                    else format(number.normalize(), "f")
                )
                result[key] = (
                    {"value": canonical, "unit": f["unit"]} if unit else canonical
                )
            elif (
                not isinstance(value, str)
                or len(value) > getattr(settings, "QUESTIONNAIRE_MAX_TEXT", 2000)
                or any(ord(c) < 32 and c not in "\n\r\t" for c in value)
            ):
                error(p, "Недопустимый текст или превышена длина.")
            elif f["type"] == "choice" and value not in f["options"]:
                error(p, "Выберите допустимый вариант.")
            else:
                try:
                    value.encode("utf-8")
                except UnicodeEncodeError:
                    error(p, "Недопустимый Unicode.")
                    continue
                if f["required"] and not value.strip():
                    error(p, "Обязательное поле.")
                result[key] = value.strip()
        return result

    if not isinstance(raw, str) or len(raw.encode("utf-8")) > getattr(
        settings, "QUESTIONNAIRE_MAX_BYTES", 262144
    ):
        raise serializers.ValidationError(
            {"payload": "Превышен предел JSON опросных листов."}
        )

    def unique_pairs(pairs):
        result = {}
        for k, v in pairs:
            if k in result:
                raise ValueError("duplicate key")
            result[k] = v
        return result

    try:
        payload = json.loads(
            raw,
            object_pairs_hook=unique_pairs,
            parse_constant=lambda _: (_ for _ in ()).throw(ValueError()),
        )
    except (ValueError, RecursionError):
        raise serializers.ValidationError({"payload": "Некорректный JSON."})
    if not exact(payload, ("version", "items"), "payload"):
        raise serializers.ValidationError(errors)
    if type(payload.get("version")) is not int or payload["version"] != 1:
        error("version", "Неподдерживаемая версия.")
    items = payload.get("items")
    if not isinstance(items, list) or not 1 <= len(items) <= getattr(
        settings, "QUESTIONNAIRE_MAX_ITEMS", 4
    ):
        raise serializers.ValidationError(
            {"items": "Ожидается от одного до четырёх ОЛ."}
        )
    result = []
    seen = set()
    for i, item in enumerate(items):
        if not exact(item, ("product", "schemaVersion", "answers"), f"items.{i}"):
            continue
        product = item.get("product")
        if not isinstance(product, str) or product not in CONTRACT["products"]:
            error(f"items.{i}.product", "Неизвестное изделие.")
            continue
        if product in seen:
            error(product, "Изделие повторяется.")
            continue
        seen.add(product)
        if type(item.get("schemaVersion")) is not int or item["schemaVersion"] != 1:
            error(product, "Неподдерживаемая версия схемы.")
        definition = CONTRACT["products"][product]
        answers = item.get("answers")
        sheets = definition["sheets"]
        if not exact(
            answers,
            [s["key"] for s in sheets]
            + (["selectedSections"] if product == "btp" else []),
            product,
        ):
            continue
        selected = answers.get("selectedSections", [])
        if product == "btp":
            allowed = [s["key"] for s in sheets if s.get("optional")]
            if (
                not isinstance(selected, list)
                or not selected
                or any(not isinstance(k, str) or k not in allowed for k in selected)
                or len(set(selected)) != len(selected)
            ):
                error(
                    "btp.common.selectedSections",
                    "Выберите хотя бы одну систему или коллектор.",
                )
                selected = []
        clean = {"selectedSections": sorted(selected)} if product == "btp" else {}
        for s in sheets:
            key = s["key"]
            path = product + "." + key
            if s.get("optional") and key not in selected:
                if key in answers:
                    error(path, "Раздел не включён.")
                continue
            data = answers.get(key, {})
            if not isinstance(data, dict):
                error(path, "Ожидается объект.")
                continue
            regular = (
                {k: v for k, v in data.items() if k != "outlets"}
                if "outletFields" in s
                else data
            )
            clean[key] = fields(regular, s["fields"], path)
            if "outletFields" not in s:
                continue
            rows = data.get("outlets")
            if not isinstance(rows, list) or not 1 <= len(rows) <= getattr(
                settings, "QUESTIONNAIRE_MAX_OUTLETS", 100
            ):
                error(path + ".outlets", "Нужен хотя бы один выход; предел — 100.")
                continue
            clean[key]["outlets"] = []
            ids = set()
            for j, row in enumerate(rows):
                p = (
                    path
                    + ".outlets."
                    + str(row.get("id", j) if isinstance(row, dict) else j)
                )
                if not isinstance(row, dict):
                    error(p, "Ожидается объект.")
                    continue
                identity = row.get("id")
                if (
                    not isinstance(identity, str)
                    or not re.fullmatch(r"[a-zA-Z0-9_-]{1,64}", identity)
                    or identity in ids
                ):
                    error(p, "Некорректный или повторный идентификатор выхода.")
                    continue
                ids.add(identity)
                values = fields(
                    {k: v for k, v in row.items() if k != "id"}, s["outletFields"], p
                )
                if not any(k in values for k in ("power", "flow", "diameter")):
                    error(p + ".power", "Укажите мощность, расход или Ду.")
                clean[key]["outlets"].append({"id": identity, **values})
        if product == "bmk":
            loads = clean.get("loads", {})
            dhw = any(k in loads for k in ("dhw_max", "dhw_average"))
            if not any(
                k in loads for k in ("heating", "ventilation", "dhw_max", "dhw_average")
            ):
                error("bmk.loads.heating", "Укажите хотя бы одну полезную нагрузку.")
            if dhw:
                for key in ("dhw_max", "dhw_average"):
                    if key not in loads:
                        error(
                            "bmk.loads." + key,
                            "Для ГВС нужны максимальная и среднечасовая нагрузки.",
                        )
            if clean.get("scheme", {}).get("pipes") == "Четырёхтрубная" and not dhw:
                error(
                    "bmk.scheme.pipes", "Четырёхтрубная схема допустима только с ГВС."
                )
        result.append({"product": product, "schemaVersion": 1, "answers": clean})
    if errors:
        raise serializers.ValidationError(errors)
    return {"version": 1, "items": sorted(result, key=lambda i: i["product"])}


class QuestionnairesField(serializers.Field):
    def to_internal_value(self, data):
        return validate_payload(data)

    def to_representation(self, value):
        return value
