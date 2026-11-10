// Normalize complete Russian numbers; keep partial input and other countries editable.
export function normalizeLeadPhone(value) {
  const text = String(value ?? "").trim();
  if (!/^[+\d\s().-]+$/.test(text)) return text;
  const digits = text.replace(/\D/g, "");
  if (digits.length === 10 && !text.startsWith("+")) return `+7${digits}`;
  if (digits.length === 11 && /^[78]/.test(digits)) return `+7${digits.slice(1)}`;
  return text;
}

// UI policy: +7 numbers only. A null result rejects foreign prefixes or text
// instead of silently turning an unrelated number/extension into another phone.
export function formatLeadPhoneInput(value) {
  const text = String(value ?? "").trim();
  if (!text) return "";
  if (text === "+") return "+7";
  if (!/^[+\d\s().-]+$/.test(text) || /\+/.test(text.slice(1))) return null;
  let digits = text.replace(/\D/g, "");
  if (text.startsWith("+") && !digits.startsWith("7")) return null;
  if (text.startsWith("+") || (digits.length !== 10 && /^[78]/.test(digits)))
    digits = digits.slice(1);
  return `+7${digits.slice(0, 10)}`;
}
