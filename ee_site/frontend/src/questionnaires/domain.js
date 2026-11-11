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
// API precision comes from the original strings, never from the rounded display
// or the legacy floating-point base kept by older tab drafts.
export function quantityPair(value) {
  const source = value.source ?? value;
  return { value: source.value, unit: source.unit };
}
export function changeUnit(value, unit, group) {
  if (blank(value)) return { value: "", unit };
  if (numberValue(value.value) === null) return null;
  const source = quantityPair(value);
  const n = numberValue(source.value);
  if (n === null) return null;
  const factors = contract.units[group];
  const display = (n * Number(factors[source.unit])) / Number(factors[unit]);
  return {
    value:
      unit === source.unit
        ? source.value
        : String(Number(display.toPrecision(15))),
    unit,
    source,
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
function fieldError(field, value) {
  if (blank(value)) return field.required ? "Обязательное поле." : undefined;
  if (field.type === "number") {
    const n = numberValue(field.units ? value.value : value);
    if (
      n === null ||
      Math.abs(n) > 1e15 ||
      (field.integer && !Number.isInteger(n)) ||
      (field.min != null && (n < field.min || (field.exclusiveMin && n === field.min))) ||
      (field.max != null && n > field.max)
    )
      return "Проверьте число и допустимый диапазон.";
  } else if (field.type === "choice" && !field.options.includes(value))
    return "Выберите вариант.";
  else if (value.length > contract.limits.text)
    return "Не более " + contract.limits.text + " символов.";
}

function serializeAnswers(product, draftAnswers) {
  const answers = {};
  if (product === "btp")
    answers.selectedSections = [...(draftAnswers.selectedSections || [])].sort();
  for (const sheet of activeSheets(product, draftAnswers)) {
    const data = draftAnswers[sheet.key] || {};
    const output = {};
    for (const f of sheet.fields) {
      const v = data[f.key];
      if (!applicable(f, data) || blank(v)) continue;
      output[f.key] = f.units ? quantityPair(v) : v;
    }
    if (sheet.outletFields)
      output.outlets = (data.outlets || [])
        .filter((row) => sheet.outletFields.some((f) => !blank(row[f.key])))
        .map((row) => {
          const result = { id: row.id };
          for (const f of sheet.outletFields)
            if (!blank(row[f.key]))
              result[f.key] = f.units ? quantityPair(row[f.key]) : row[f.key];
          return result;
        });
    answers[sheet.key] = output;
  }
  return answers;
}

export function serializeQuestionnaires(drafts) {
  const items = [];
  for (const [product, draft] of Object.entries(drafts || {})) {
    if (!draft.enabled || !contract.products[product]) continue;
    items.push({ product, schemaVersion: 1, answers: serializeAnswers(product, draft.answers) });
  }
  return items.length
    ? {
        version: 1,
        items: items.sort((a, b) => a.product.localeCompare(b.product)),
      }
    : null;
}
function checkQuestionnaire(product, answers) {
  const errors = {};
  const required = new Set();
  function check(path, error, mandatory = true) {
    if (error) errors[path] = error;
    if (mandatory || error) required.add(path);
  }
  function fields(data, definitions, path) {
    for (const f of definitions) {
      if (!applicable(f, data)) continue;
      check(path + "." + f.key, fieldError(f, data[f.key]), f.required === true);
    }
  }
  if (product === "btp") {
    check("btp.common.selectedSections", answers.selectedSections.length
      ? undefined : "Выберите хотя бы одну систему или коллектор.");
  }
  for (const sheet of activeSheets(product, answers)) {
    const data = answers[sheet.key] || {};
    const path = product + "." + sheet.key;
    fields(data, sheet.fields, path);
    if (sheet.outletFields) {
      if (!data.outlets?.length)
        check(path + ".outlets", "Добавьте хотя бы один заполненный выход.");
      for (const row of data.outlets || []) {
        const rowPath = path + ".outlets." + row.id;
        fields(row, sheet.outletFields, rowPath);
        const dimension = ["power", "flow", "diameter"].find((k) => !blank(row[k]));
        check(rowPath + "." + (dimension || "power"),
          dimension ? undefined : "Укажите мощность, расход или Ду.");
      }
    }
  }
  if (product === "bmk") {
    const loads = answers.loads || {};
    const dhw = !blank(loads.dhw_max) || !blank(loads.dhw_average);
    if (dhw) {
      for (const k of ["dhw_max", "dhw_average"])
        check("bmk.loads." + k, blank(loads[k]) ? "Для ГВС нужны обе нагрузки." : undefined);
    } else {
      const load = ["heating", "ventilation"].find((k) => !blank(loads[k]));
      check("bmk.loads." + (load || "heating"),
        load ? undefined : "Укажите хотя бы одну полезную нагрузку.");
    }
    if (answers.scheme?.pipes === "Четырёхтрубная" && !dhw)
      check("bmk.scheme.pipes", "Четырёхтрубная схема — только с ГВС.");
  }
  return { total: required.size, errors };
}

export function requiredFieldProgress(product, answers) {
  const { total, errors } = checkQuestionnaire(product, serializeAnswers(product, answers));
  return { total, remaining: Object.keys(errors).length };
}

export function validateQuestionnaires(drafts) {
  const errors = {};
  const payload = serializeQuestionnaires(drafts);
  if (!payload) return errors;
  for (const { product, answers } of payload.items)
    Object.assign(errors, checkQuestionnaire(product, answers).errors);
  if (
    new TextEncoder().encode(JSON.stringify(payload)).length >
    contract.limits.bytes
  )
    errors.payload = "Превышен предел данных ОЛ — 256 КиБ.";
  return errors;
}
