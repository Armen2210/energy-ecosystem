import { useState } from "react";
import { formatLeadPhoneInput } from "../../api/leadPhone.js";

// Keep the editable value compact: +7 and ten national digits, without a mask
// whose punctuation interferes with Backspace, selection and mobile keyboards.
export default function PhoneInput({ value, onChange }) {
  const [focused, setFocused] = useState(false);
  const display = value ? (formatLeadPhoneInput(value) ?? value) : focused ? "+7" : "";

  function apply(input, raw, cursor, { wholeNumber = false, typing = false } = {}) {
    if (typing && !value && raw.replace("+7", "") === "+") raw = "+7";
    let next = formatLeadPhoneInput(raw);
    if (next === null) {
      input.value = display;
      input.setCustomValidity("Введите номер с кодом +7: 10 цифр после кода страны.");
      input.reportValidity();
      return;
    }
    input.setCustomValidity("");
    if (!next) next = "+7";
    // The first 7/8 typed into an empty field is a country/trunk prefix.
    if (typing && !value && /^\+7[78]$/.test(raw)) next = "+7";
    // At capacity an insertion must not discard the last digit of the number.
    if (typing && raw.replace(/\D/g, "").length > 11) next = display;
    const position = wholeNumber ? next.length : Math.max(2,
      cursor + next.length - raw.length);
    input.value = next;
    input.setSelectionRange(position, position);
    onChange(next === "+7" ? "" : next);
    // Restore the caret after React commits the shared draft update.
    requestAnimationFrame(() => {
      if (document.activeElement === input && input.value === next)
        input.setSelectionRange(position, position);
    });
  }

  return <input
    type="tel"
    name="phone"
    autoComplete="tel"
    inputMode="tel"
    value={display}
    placeholder="+7 (___) ___-__-__"
    title="Номер с кодом +7: 10 цифр после кода страны"
    required
    onFocus={() => setFocused(true)}
    onKeyDown={(event) => {
      const input = event.currentTarget;
      if (input.selectionStart !== input.selectionEnd) return;
      if ((event.key === "Backspace" && input.selectionStart <= 2) ||
          (event.key === "Delete" && input.selectionStart < 2)) {
        event.preventDefault();
        input.setSelectionRange(2, 2);
      }
    }}
    onBlur={(event) => {
      setFocused(false);
      // Read the DOM, including autofill that bypassed React's change event.
      if (event.currentTarget.value !== display)
        apply(event.currentTarget, event.currentTarget.value, event.currentTarget.value.length);
    }}
    onChange={(event) => apply(event.currentTarget, event.currentTarget.value,
      event.currentTarget.selectionStart ?? event.currentTarget.value.length,
      { typing: event.nativeEvent.inputType === "insertText" })}
    onPaste={(event) => {
      const text = event.clipboardData.getData("text");
      event.preventDefault();
      const input = event.currentTarget;
      const wholeNumber = text.replace(/\D/g, "").length >= 10;
      const start = Math.max(2, input.selectionStart ?? display.length);
      const end = Math.max(start, input.selectionEnd ?? start);
      const raw = wholeNumber ? text : display.slice(0, start) + text + display.slice(end);
      apply(input, raw, start + text.length, { wholeNumber });
    }}
  />;
}
