// Editing grammar only. Engineering bounds remain in the contract/server.
export function allowsNegative(field) {
  return field.min == null || field.min < 0;
}
export function acceptsNumericDraft(text, field) {
  const sign = allowsNegative(field) ? "[+-]?" : "[+]?";
  return new RegExp(
    "^" + sign + (field.integer ? "[0-9]*" : "[0-9]*(?:[.,][0-9]*)?") + "$",
  ).test(text);
}
export function insertedNumericDraft(value, start, end, inserted) {
  return value.slice(0, start) + inserted + value.slice(end);
}

export function acceptsNumericEdit(previous, next, field, inputType = "") {
  return (
    acceptsNumericDraft(next, field) ||
    (!acceptsNumericDraft(previous, field) &&
      inputType.startsWith("delete") &&
      next.length < previous.length)
  );
}
