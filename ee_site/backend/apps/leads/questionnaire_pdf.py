"""Network-free PDF renderer. Definitions come from the saved schema snapshot."""

import io
from pathlib import Path
from xml.sax.saxutils import escape
from zoneinfo import ZoneInfo
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.enums import TA_LEFT
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from django.conf import settings


def render_pdf(questionnaire):
    font = Path(
        getattr(
            settings,
            "QUESTIONNAIRE_FONT_PATH",
            "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        )
    )
    if "EEDejaVu" not in pdfmetrics.getRegisteredFontNames():
        pdfmetrics.registerFont(TTFont("EEDejaVu", str(font)))
    style = ParagraphStyle(
        "body",
        fontName="EEDejaVu",
        fontSize=8.5,
        leading=12,
        alignment=TA_LEFT,
        splitLongWords=True,
    )
    heading = ParagraphStyle(
        "heading",
        parent=style,
        fontSize=12,
        leading=16,
        keepWithNext=True,
        spaceBefore=12,
        spaceAfter=8,
        textColor=colors.HexColor("#b34d12"),
    )

    def p(text, sty=style):
        return Paragraph(escape(str(text)).replace("\n", "<br/>"), sty)

    def value(field, values):
        v = values.get(field["key"])
        if v is None or v == "":
            return "Не указано"
        if isinstance(v, dict):
            return v["value"] + " " + v["unit"]
        return str(v) + (" " + field["unit"] if field.get("unit") else "")

    from .questionnaires import applicable

    out = io.BytesIO()
    lead = questionnaire.lead
    content = [
        p("ООО «ЭНЕРГОЭФФЕКТ»", heading),
        p("+7 800 444-07-66 • sales@ee-don.ru"),
        p("344113, Ростов-на-Дону, б-р Комарова, 28/2, офис 319."),
        p("Опросный лист " + questionnaire.definition["title"], heading),
        p(
            f'Заявка №{lead.pk} • {lead.created_at.astimezone(ZoneInfo("Europe/Moscow")):%d.%m.%Y %H:%M} (МСК)'
        ),
        p(
            f"Версия схемы {questionnaire.schema_version}; генератор {questionnaire.generator_version}"
        ),
        Spacer(1, 8),
    ]
    for label, v in [
        ("Имя", lead.name),
        ("Компания", lead.company_name),
        ("Телефон", lead.phone),
        ("Email", lead.email),
        ("Сообщение", lead.description),
    ]:
        content.append(p(label + ": " + (v or "Не указано")))
    for sheet in questionnaire.definition["sheets"]:
        data = questionnaire.answers.get(sheet["key"])
        if data is None:
            continue
        content.append(p(sheet["title"], heading))
        # Single-field rows allow page breaks even with long user text.
        for field in sheet["fields"]:
            if applicable(field, data):
                content.append(p(field["label"] + ": " + value(field, data)))
        if "outletFields" in sheet:
            columns = sheet["outletFields"]
            rows = [
                [p("№")]
                + [
                    p(f["label"] + ("\n" + f["unit"] if f.get("unit") else ""))
                    for f in columns
                ]
            ]
            for index, row in enumerate(data.get("outlets", []), 1):
                rows.append([p(str(index))] + [p(value(f, row)) for f in columns])
            table = Table(
                rows,
                colWidths=[34, 80, 61, 53, 99, 99, 97],
                repeatRows=1,
                hAlign="LEFT",
            )
            table.setStyle(
                TableStyle(
                    [
                        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#fff0e5")),
                        ("VALIGN", (0, 0), (-1, -1), "TOP"),
                        ("GRID", (0, 0), (-1, -1), 0.4, colors.HexColor("#dddddd")),
                        ("LEFTPADDING", (0, 0), (-1, -1), 5),
                        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                        ("TOPPADDING", (0, 0), (-1, -1), 6),
                        ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
                    ]
                )
            )
            content.append(table)

    def footer(canvas, doc):
        canvas.setFont("EEDejaVu", 8)
        canvas.drawString(
            36,
            24,
            f"Энергоэффект • Заявка №{lead.pk} • {questionnaire.definition['title']} • Страница {doc.page}",
        )

    SimpleDocTemplate(
        out,
        pagesize=(595.28, 841.89),
        leftMargin=36,
        rightMargin=36,
        topMargin=30,
        bottomMargin=40,
        title="Опросный лист " + questionnaire.definition["title"],
        author="ООО Энергоэффект",
    ).build(content, onFirstPage=footer, onLaterPages=footer)
    result = out.getvalue()
    if len(result) > getattr(settings, "QUESTIONNAIRE_MAX_PDF_BYTES", 5 * 1024 * 1024):
        raise ValueError("pdf_size_limit")
    return result
