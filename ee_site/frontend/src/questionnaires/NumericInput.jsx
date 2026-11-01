import { useLayoutEffect, useRef, useState } from "react";
import {
  acceptsNumericDraft,
  acceptsNumericEdit,
  allowsNegative,
  insertedNumericDraft,
} from "./numericInput.js";
export default function NumericInput({ field, value, onChange, ...props }) {
  const input = useRef(null),
    selection = useRef([0, 0]);
  const [rejection, setRejection] = useState(null);
  const formatId = props.id + "-format";
  const invalidRestored = !acceptsNumericDraft(value, field);
  const reject = () => setRejection({ selection: [...selection.current] });
  useLayoutEffect(() => {
    if (rejection && input.current)
      input.current.setSelectionRange(...rejection.selection);
  }, [rejection]);
  function beforeInsert(event, text) {
    const element = event.currentTarget;
    selection.current = [element.selectionStart, element.selectionEnd];
    const next = insertedNumericDraft(value, ...selection.current, text);
    if (!acceptsNumericDraft(next, field)) {
      event.preventDefault();
      reject();
    }
  }
  function change(event) {
    if (
      !acceptsNumericEdit(
        value,
        event.currentTarget.value,
        field,
        event.nativeEvent.inputType,
      )
    ) {
      reject();
      return;
    }
    setRejection(null);
    onChange(event.currentTarget.value);
  }
  return (
    <div className="ql-number-input">
      <input
        {...props}
        ref={input}
        type="text"
        inputMode={
          field.integer ? "numeric" : allowsNegative(field) ? "text" : "decimal"
        }
        value={value}
        aria-describedby={
          [
            props["aria-describedby"],
            rejection || invalidRestored ? formatId : "",
          ]
            .filter(Boolean)
            .join(" ") || undefined
        }
        onSelect={(event) => {
          selection.current = [
            event.currentTarget.selectionStart,
            event.currentTarget.selectionEnd,
          ];
        }}
        onBeforeInput={(event) => {
          if (event.data != null && !event.nativeEvent.isComposing)
            beforeInsert(event, event.data);
        }}
        onPaste={(event) =>
          beforeInsert(event, event.clipboardData.getData("text"))
        }
        onChange={change}
        onCompositionEnd={change}
      />
      {(rejection || invalidRestored) && (
        <small id={formatId} className="ql-error" role="status">
          {field.integer
            ? "Введите целое число."
            : "Введите число с точкой или запятой."}{" "}
          {invalidRestored
            ? " Исправьте сохранённое значение; оно не изменено автоматически."
            : " Недопустимый текст не добавлен."}
        </small>
      )}
    </div>
  );
}
