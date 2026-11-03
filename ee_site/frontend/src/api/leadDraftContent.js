// UI-only state (expanded sheet, scroll, row IDs/units) is not an answer.
function hasAnswer(value) {
  if (Array.isArray(value)) return value.some(hasAnswer);
  if (value && typeof value === "object") {
    if (Object.hasOwn(value, "value")) return hasAnswer(value.value);
    return Object.entries(value).some(([key, item]) => key !== "id" && hasAnswer(item));
  }
  return typeof value === "string" ? value.trim() !== "" : value != null && value !== false;
}

export function hasDraftContent(draft) {
  return (draft.started && !!draft.topic) || !!draft.submission || !!draft.indeterminate || draft.files.length > 0 ||
    Object.values(draft.fields).some(Boolean) ||
    Object.values(draft.questionnaires).some(q => q.enabled || hasAnswer(q.answers));
}
