import { contract } from "../questionnaires/domain.js";
export const DRAFT_KEY = "ee-lead-draft-v1";
export const DRAFT_TTL = 24 * 60 * 60 * 1000;
export function saveDraft(storage, draft, now = Date.now()) {
  const data = {
    version: 1,
    changedAt: draft.changedAt || now,
    fields: draft.fields,
    topic: draft.topic,
    sourcePage: draft.sourcePage,
    started: draft.started,
    questionnaires: draft.questionnaires,
    submission: draft.submission,
    hadFiles: draft.files.length > 0,
    indeterminate: !!draft.indeterminate,
  };
  storage.setItem(DRAFT_KEY, JSON.stringify(data));
}
export function readDraft(storage, now = Date.now()) {
  const raw = storage.getItem(DRAFT_KEY);
  if (!raw) return null;
  const data = JSON.parse(raw);
  if (
    data.version !== 1 ||
    !Number.isFinite(data.changedAt) ||
    now - data.changedAt >= DRAFT_TTL ||
    data.changedAt > now + 60000
  ) {
    storage.removeItem(DRAFT_KEY);
    return null;
  }
  if (
    !data.fields ||
    typeof data.fields !== "object" ||
    typeof data.questionnaires !== "object" ||
    !data.questionnaires ||
    typeof data.topic !== "string"
  )
    throw Error("invalid draft");
  for (const k of ["name", "company_name", "phone", "email", "description"])
    if (typeof data.fields[k] !== "string") throw Error("invalid fields");
  function validFields(values, definitions) {
    if (!values || typeof values !== "object" || Array.isArray(values))
      throw Error("invalid fields");
    for (const [key, v] of Object.entries(values)) {
      if (key === "id") {
        if (typeof v !== "string") throw Error("invalid id");
        continue;
      }
      const field = definitions.find((f) => f.key === key);
      if (!field) throw Error("unknown field");
      if (field.units) {
        if (
          !v ||
          typeof v.value !== "string" ||
          !Object.hasOwn(contract.units[field.units], v.unit) ||
          (v.base != null && !Number.isFinite(v.base))
        )
          throw Error("invalid quantity");
      } else if (typeof v !== "string" || v.length > contract.limits.text)
        throw Error("invalid answer");
    }
  }
  for (const [product, q] of Object.entries(data.questionnaires)) {
    if (
      !Object.hasOwn(contract.products, product) ||
      !q ||
      typeof q.enabled !== "boolean" ||
      !q.answers ||
      typeof q.answers !== "object" ||
      Array.isArray(q.answers)
    )
      throw Error("invalid questionnaires");
    for (const [key, value] of Object.entries(q.answers)) {
      if (key === "selectedSections") {
        if (
          !Array.isArray(value) ||
          value.some(
            (v) =>
              typeof v !== "string" ||
              !contract.products[product].sheets.some(
                (s) => s.optional && s.key === v,
              ),
          )
        )
          throw Error("invalid sections");
        continue;
      }
      const sheet = contract.products[product].sheets.find(
        (s) => s.key === key,
      );
      if (!sheet || !value || typeof value !== "object" || Array.isArray(value))
        throw Error("invalid section");
      const { outlets, ...fields } = value;
      validFields(fields, sheet.fields);
      if (outlets != null) {
        if (
          !sheet.outletFields ||
          !Array.isArray(outlets) ||
          outlets.length > contract.limits.outlets
        )
          throw Error("invalid outlets");
        for (const row of outlets) validFields(row, sheet.outletFields);
      }
    }
  }
  if (
    data.submission &&
    (typeof data.submission.id !== "string" ||
      typeof data.submission.signature !== "string")
  )
    throw Error("invalid submission");
  return data;
}
