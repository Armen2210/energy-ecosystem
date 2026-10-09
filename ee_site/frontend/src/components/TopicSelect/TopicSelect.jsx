// =========================================================
// TOPIC SELECT / ВЫБОР НАПРАВЛЕНИЯ
// Кастомный select для продуктов и услуг.
// Используется в LeadForm.
//
// Задачи:
// - фирменный внешний вид;
// - поддержка групп "Продукты" и "Услуги";
// - выбор мышью и клавиатурой;
// - закрытие по Escape и клику вне;
// - сохранение значения для формы через hidden input.
// =========================================================

import { useEffect, useRef, useState } from "react";

function TopicSelect({
  products = [],
  services = [],
  value = "",
  onChange,
  disabled = false,
}) {
  const rootRef = useRef(null);
  const buttonRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  if (isOpen && disabled) {
    setIsOpen(false);
  }

  const productOptions = products.map((product) => ({
    value: product.formTitle || product.title,
    label: product.formTitle || product.title,
  }));

  const serviceOptions = services.map((service) => ({
    value: service.cardTitle || service.title,
    label: service.cardTitle || service.title,
  }));

  const allOptions = [
    ...productOptions,
    ...serviceOptions,
  ];

  const selectedOption = allOptions.find(
    (option) => option.value === value,
  );

  useEffect(() => {
    function handleDocumentMouseDown(event) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleDocumentMouseDown);

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentMouseDown,
      );
    };
  }, []);


  function handleKeyDown(event) {
    if (disabled) return;

    if (event.key === "Escape") {
      setIsOpen(false);
      buttonRef.current?.focus();
    }

    if (
      (event.key === "Enter" || event.key === " ") &&
      event.currentTarget === buttonRef.current
    ) {
      event.preventDefault();
      setIsOpen((current) => !current);
    }
  }

  function handleSelect(optionValue) {
    if (disabled) return;
    onChange(optionValue);
    setIsOpen(false);
    buttonRef.current?.focus();
  }

  return (
    <div
      className={`topic-select ${
        isOpen ? "topic-select--open" : ""
      }`}
      ref={rootRef}
    >
      <button
        ref={buttonRef}
        className="topic-select__button"
        type="button"
        aria-haspopup="listbox"
        aria-expanded={isOpen && !disabled}
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((current) => !current);
        }}
        onKeyDown={handleKeyDown}
      >
        <span className="topic-select__value">
          {selectedOption?.label || "Выберите направление"}
        </span>

        <span
          className="topic-select__chevron"
          aria-hidden="true"
        />
      </button>

      {isOpen && !disabled && (
        <div
          className="topic-select__menu"
          role="listbox"
          aria-label="Интересующее направление"
        >
          <button
            type="button"
            className={`topic-select__option ${
              value === "" ? "topic-select__option--selected" : ""
            }`}
            onClick={() => handleSelect("")}
          >
            Выберите направление
          </button>

          <div className="topic-select__group">
            <div className="topic-select__group-title">
              Продукты
            </div>

            {productOptions.map((option) => (
              <button
                type="button"
                className={`topic-select__option ${
                  value === option.value
                    ? "topic-select__option--selected"
                    : ""
                }`}
                key={option.value}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="topic-select__group">
            <div className="topic-select__group-title">
              Услуги
            </div>

            {serviceOptions.map((option) => (
              <button
                type="button"
                className={`topic-select__option ${
                  value === option.value
                    ? "topic-select__option--selected"
                    : ""
                }`}
                key={option.value}
                onClick={() => handleSelect(option.value)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <input
        type="hidden"
        name="description_topic"
        value={value}
        disabled={disabled}
      />
    </div>
  );
}

export default TopicSelect;
