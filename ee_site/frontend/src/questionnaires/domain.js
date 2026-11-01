import contract from "../../../../contracts/questionnaires/v1/fields.json" with { type: "json" };
export { contract };
export const applicable = (field, answers) =>
  Object.entries(field.when || {}).every(([k, v]) => v.includes(answers[k])) &&
  (!field.whenAny ||
    Object.entries(field.whenAny).some(([k, v]) => v.includes(answers[k])));
export const blank = (value) =>
  value == null ||
  (typeof value === "string" && value.trim() === "") ||
  (typeof value === "object" && value.value === "");
export function numberValue(value) {
  const text = String(value).trim();
  return /^[+-]?(?:\d+(?:[.,]\d*)?|[.,]\d+)$/.test(text) &&
    Number.isFinite(Number(text.replace(",", ".")))
    ? Number(text.replace(",", "."))
    : null;
}
export function changeUnit(value, unit, group) {
  if (blank(value)) return { value: "", unit };
  const n = numberValue(value.value);
  if (n === null) return null;
  const factors = contract.units[group];
  const base = value.base ?? n * Number(factors[value.unit]);
  return {
    value: String(Number((base / Number(factors[unit])).toPrecision(15))),
    unit,
    base,
  };
}
export const initialQuestionnaire = () => ({
  enabled: false,
  expanded: false,
  sheet: "",
  answers: {},
  scroll: {},
});
export function activeSheets(product, answers) {
  return contract.products[product].sheets.filter(
    (s) => !s.optional || answers.selectedSections?.includes(s.key),
  );
}
export function serializeQuestionnaires(drafts) {
  const items = [];
  for (const [product, draft] of Object.entries(drafts || {})) {
    if (!draft.enabled || !contract.products[product]) continue;
    const answers = {};
    if (product === "btp")
      answers.selectedSections = [
        ...(draft.answers.selectedSections || []),
      ].sort();
    for (const sheet of activeSheets(product, draft.answers)) {
      const data = draft.answers[sheet.key] || {};
      const output = {};
      for (const f of sheet.fields) {
        const v = data[f.key];
        if (!applicable(f, data) || blank(v)) continue;
        output[f.key] = f.units ? { value: v.value, unit: v.unit } : v;
      }
      if (sheet.outletFields)
        output.outlets = (data.outlets || [])
          .filter((row) => sheet.outletFields.some((f) => !blank(row[f.key])))
          .map((row) => {
            const result = { id: row.id };
            for (const f of sheet.outletFields)
              if (!blank(row[f.key]))
                result[f.key] = f.units
                  ? { value: row[f.key].value, unit: row[f.key].unit }
                  : row[f.key];
            return result;
          });
      answers[sheet.key] = output;
    }
    items.push({ product, schemaVersion: 1, answers });
  }
  return items.length
    ? {
        version: 1,
        items: items.sort((a, b) => a.product.localeCompare(b.product)),
      }
    : null;
}
export function validateQuestionnaires(drafts) {
  const errors = {};
  const payload = serializeQuestionnaires(drafts);
  if (!payload) return errors;
  for (const item of payload.items) {
    const { product, answers } = item;
    if (product === "btp" && !answers.selectedSections.length)
      errors["btp.common.selectedSections"] =
        "Выберите хотя бы одну систему или коллектор.";
    function fields(data, definitions, path) {
      for (const f of definitions) {
        if (!applicable(f, data)) continue;
        const v = data[f.key];
        const key = path + "." + f.key;
        if (blank(v)) {
          if (f.required) errors[key] = "Обязательное поле.";
          continue;
        }
        if (f.type === "number") {
          const n = numberValue(f.units ? v.value : v);
          if (
            n === null ||
            Math.abs(n) > 1e15 ||
            (f.integer && !Number.isInteger(n)) ||
            (f.min != null && (n < f.min || (f.exclusiveMin && n === f.min))) ||
            (f.max != null && n > f.max)
          )
            errors[key] = "Проверьте число и допустимый диапазон.";
        } else if (f.type === "choice" && !f.options.includes(v))
          errors[key] = "Выберите вариант.";
        else if (v.length > contract.limits.text)
          errors[key] = "Не более " + contract.limits.text + " символов.";
      }
    }
    for (const sheet of activeSheets(product, answers)) {
      const data = answers[sheet.key] || {};
      const path = product + "." + sheet.key;
      fields(data, sheet.fields, path);
      if (sheet.outletFields) {
        if (!data.outlets?.length)
          errors[path + ".outlets"] =
            "Добавьте хотя бы один заполненный выход.";
        for (const row of data.outlets || []) {
          fields(row, sheet.outletFields, path + ".outlets." + row.id);
          if (!["power", "flow", "diameter"].some((k) => !blank(row[k])))
            errors[path + ".outlets." + row.id + ".power"] =
              "Укажите мощность, расход или Ду.";
        }
      }
    }
    if (product === "bmk") {
      const loads = answers.loads || {};
      const dhw = !blank(loads.dhw_max) || !blank(loads.dhw_average);
      if (
        !["heating", "ventilation", "dhw_max", "dhw_average"].some(
          (k) => !blank(loads[k]),
        )
      )
        errors["bmk.loads.heating"] = "Укажите хотя бы одну полезную нагрузку.";
      if (dhw)
        for (const k of ["dhw_max", "dhw_average"])
          if (blank(loads[k]))
            errors["bmk.loads." + k] = "Для ГВС нужны обе нагрузки.";
      if (answers.scheme?.pipes === "Четырёхтрубная" && !dhw)
        errors["bmk.scheme.pipes"] = "Четырёхтрубная схема — только с ГВС.";
    }
  }
  if (
    new TextEncoder().encode(JSON.stringify(payload)).length >
    contract.limits.bytes
  )
    errors.payload = "Превышен предел данных ОЛ — 256 КиБ.";
  return errors;
}
