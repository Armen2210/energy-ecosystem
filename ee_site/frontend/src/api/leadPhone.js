// Normalize complete Russian numbers; keep partial input and other countries editable.
export function normalizeLeadPhone(value) {
  const text = String(value ?? "").trim();
  if (!/^[+\d\s().-]+$/.test(text)) return text;
  const digits = text.replace(/\D/g, "");
  if (digits.length === 10 && !text.startsWith("+")) return `+7${digits}`;
  if (digits.length === 11 && /^[78]/.test(digits)) return `+7${digits.slice(1)}`;
  return text;
}
