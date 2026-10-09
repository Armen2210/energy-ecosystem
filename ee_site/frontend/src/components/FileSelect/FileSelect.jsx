// =========================================================
// FILE SELECT / ВЫБОР ДОКУМЕНТОВ
//
// UI-контрол для выбора нескольких файлов в LeadForm.
//
// Отвечает только за интерфейс:
// - открывает системный выбор файлов;
// - показывает количество выбранных файлов;
// - раскрывает список выбранных документов;
// - позволяет удалить отдельный файл;
// - показывает оставшийся лимит;
// - закрывается по Escape и клику вне.
//
// Формирование FormData и отправка в backend остаются в LeadForm.
// =========================================================

import { useEffect, useRef, useState } from "react";

import {
  LEAD_FILE_LIMITS,
  formatFileSize,
} from "../../api/leadFiles";

function getAttachedFilesText(count) {
  const lastDigit = count % 10;
  const lastTwoDigits = count % 100;

  if (lastDigit === 1 && lastTwoDigits !== 11) {
    return `${count} файл прикреплён`;
  }

  if (
    lastDigit >= 2 &&
    lastDigit <= 4 &&
    !(lastTwoDigits >= 12 && lastTwoDigits <= 14)
  ) {
    return `${count} файла прикреплено`;
  }

  return `${count} файлов прикреплено`;
}

function FileSelect({
  files = [],
  onAddFiles,
  onRemoveFile,
  disabled = false,
}) {
  const rootRef = useRef(null);
  const toggleButtonRef = useRef(null);
  const fileInputRef = useRef(null);

  const [isOpen, setIsOpen] = useState(false);
  if (isOpen && (disabled || files.length === 0)) {
    setIsOpen(false);
  }

  const totalSize = files.reduce(
    (sum, { file }) => sum + file.size,
    0,
  );

  const remainingFiles = Math.max(
    LEAD_FILE_LIMITS.maxFiles - files.length,
    0,
  );

  const remainingSize = Math.max(
    LEAD_FILE_LIMITS.maxTotalSize - totalSize,
    0,
  );

  const hasFiles = files.length > 0;

  const canAddFiles =
    !disabled &&
    remainingFiles > 0 &&
    remainingSize > 0;

  useEffect(() => {
    function handleDocumentMouseDown(event) {
      if (
        rootRef.current &&
        !rootRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    }

    document.addEventListener(
      "mousedown",
      handleDocumentMouseDown,
    );

    return () => {
      document.removeEventListener(
        "mousedown",
        handleDocumentMouseDown,
      );
    };
  }, []);


  function openFilePicker() {
    if (!canAddFiles) return;

    fileInputRef.current?.click();
  }

  function handleFileChange(event) {
    const addedFiles = Array.from(
      event.target.files || [],
    );

    if (addedFiles.length > 0) {
      onAddFiles(addedFiles);
    }

    /*
      Разрешаем повторно выбрать тот же самый файл
      после удаления или ошибки валидации.
    */
    event.target.value = "";
  }

  function handleToggleClick() {
    if (disabled) return;

    if (!hasFiles) {
      openFilePicker();
      return;
    }

    setIsOpen((current) => !current);
  }

  function handleKeyDown(event) {
    if (event.key !== "Escape" || !isOpen) {
      return;
    }

    event.preventDefault();
    setIsOpen(false);
    toggleButtonRef.current?.focus();
  }

  return (
    <div
      className={`file-select ${
        isOpen ? "file-select--open" : ""
      }`}
      ref={rootRef}
      onKeyDown={handleKeyDown}
    >
      <input
        ref={fileInputRef}
        className="file-select__input"
        type="file"
        name="attachments"
        multiple
        disabled={disabled}
        onChange={handleFileChange}
      />

      <div className="file-select__control">
        <button
          className="file-select__add"
          type="button"
          onClick={openFilePicker}
          disabled={!canAddFiles}
          aria-label={
            hasFiles
              ? "Добавить ещё документы"
              : "Прикрепить файл"
          }
          title={
            canAddFiles
              ? "Добавить документы"
              : "Достигнут лимит прикреплённых файлов"
          }
        >
          <span aria-hidden="true">+</span>
        </button>

        <button
          ref={toggleButtonRef}
          className="file-select__toggle"
          type="button"
          aria-haspopup={hasFiles ? "dialog" : undefined}
          aria-expanded={hasFiles ? isOpen : undefined}
          disabled={disabled}
          onClick={handleToggleClick}
        >
          <span className="file-select__value">
            {hasFiles
              ? getAttachedFilesText(files.length)
              : "Прикрепить файл"}
          </span>

          {hasFiles && (
            <span
              className="file-select__chevron"
              aria-hidden="true"
            />
          )}
        </button>
      </div>

      {isOpen && hasFiles && !disabled && (
        <div
          className="file-select__menu"
          aria-label="Прикреплённые документы"
        >
          <div className="file-select__list">
            {files.map(({ id, file }) => (
              <div
                className="file-select__item"
                key={id}
              >
                <div className="file-select__info">
                  <span className="file-select__name">
                    {file.name}
                  </span>

                  <span className="file-select__size">
                    {formatFileSize(file.size)}
                  </span>
                </div>

                <button
                  className="file-select__remove"
                  type="button"
                  onClick={() => onRemoveFile(id)}
                  aria-label={`Удалить файл ${file.name}`}
                  title="Удалить файл"
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          <div className="file-select__remaining">
            Осталось: {remainingFiles} из{" "}
            {LEAD_FILE_LIMITS.maxFiles} файлов ·{" "}
            {formatFileSize(remainingSize)}
          </div>
        </div>
      )}
    </div>
  );
}

export default FileSelect;