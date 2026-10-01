// =========================================================
// LEAD FORM / ФОРМА ЗАЯВКИ
// MVP-форма заявки.
// Отправляет данные в backend: POST /api/leads/
// =========================================================

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import {
  createLead,
  createSubmissionSignature,
  submissionForSignature,
} from "../../api/leadsApi";
import {
  LEAD_FILE_LIMITS,
  appendSelectedFiles,
  formatFileSize,
  setLeadAttachments,
} from "../../api/leadFiles";

import TopicSelect from "../TopicSelect";

function LeadForm({ products = [], services = [], initialTopic = "" }) {
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const fileInputRef = useRef(null);
  const submissionRef = useRef(null);
  const isSubmittingRef = useRef(false);
  const statusHideTimerRef = useRef(null);
  const statusResetTimerRef = useRef(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [fileError, setFileError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isStatusHiding, setIsStatusHiding] = useState(false);
  useEffect(() => {
    setSelectedTopic(initialTopic);
  }, [initialTopic]);

  useEffect(
    () => () => {
      window.clearTimeout(statusHideTimerRef.current);
      window.clearTimeout(statusResetTimerRef.current);
    },
    [],
  );

  function clearStatusTimers() {
    window.clearTimeout(statusHideTimerRef.current);
    window.clearTimeout(statusResetTimerRef.current);
    statusHideTimerRef.current = null;
    statusResetTimerRef.current = null;
  }

  function handleFileChange(event) {
    const result = appendSelectedFiles(selectedFiles, event.target.files || []);
    setSelectedFiles(result.files);
    setFileError(result.error);
    event.target.value = "";
  }

  function handleRemoveFile(fileId) {
    setSelectedFiles((files) => files.filter(({ id }) => id !== fileId));
    setFileError("");
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (isSubmittingRef.current) {
      return;
    }

    clearStatusTimers();
    setIsStatusHiding(false);

    const form = event.currentTarget;
    const formData = new FormData(form);

    const submittedTopic = formData.get("description_topic");
    const description = formData.get("description");
    const consentAccepted = formData.get("consent");

    if (!consentAccepted) {
      setSubmitStatus("error");
      setSubmitMessage("Подтвердите согласие на обработку персональных данных.");
      return;
    }

    if (submittedTopic) {
      formData.set(
        "description",
        `Интересующее направление: ${submittedTopic}\n\nОписание задачи:\n${
          description || "Не указано"
        }`,
      );
    }

    formData.delete("description_topic");
    formData.delete("consent");
    setLeadAttachments(formData, selectedFiles);

    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitStatus("idle");
    setSubmitMessage("");

    try {
      const submissionSignature = await createSubmissionSignature(formData);
      submissionRef.current = submissionForSignature(
        submissionRef.current,
        submissionSignature,
        () => crypto.randomUUID(),
      );
      formData.set("submission_id", submissionRef.current.id);

      await createLead(formData);
      submissionRef.current = null;

      form.reset();
      setSelectedTopic(initialTopic);
      setSelectedFiles([]);
      setFileError("");

      setSubmitStatus("success");
      setSubmitMessage(
        "Заявка отправлена. Мы свяжемся с вами после обработки обращения.",
      );

      statusHideTimerRef.current = window.setTimeout(() => {
        statusHideTimerRef.current = null;
        setIsStatusHiding(true);
      }, 5000);

      statusResetTimerRef.current = window.setTimeout(() => {
        statusResetTimerRef.current = null;
        setSubmitStatus("idle");
        setSubmitMessage("");
        setIsStatusHiding(false);
      }, 5600);
    } catch (error) {
      if (error.status === 409) {
        submissionRef.current = null;
      }
      setSubmitStatus("error");
      setSubmitMessage(
        error.message ||
          "Не удалось отправить заявку. Проверьте данные или попробуйте позже.",
      );
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <fieldset className="lead-form__fieldset" disabled={isSubmitting}>
      <div className="lead-form__grid">
        <label>
          Имя
          <input
            type="text"
            name="name"
            placeholder="Как к вам обращаться"
            required
          />
        </label>

        <label>
          Компания
          <input
            type="text"
            name="company_name"
            placeholder="Название компании"
          />
        </label>

        <label>
          Телефон
          <input
            type="tel"
            name="phone"
            placeholder="+7 (___) ___-__-__"
            required
          />
        </label>

        <label>
          Email
          <input type="email" name="email" placeholder="name@company.ru" />
        </label>

        <label>
          Интересующее направление

          <TopicSelect
            products={products}
            services={services}
            value={selectedTopic}
            onChange={setSelectedTopic}
            disabled={isSubmitting}
          />
        </label>

        <div className="lead-form__file-field">
          <span className="lead-form__file-label">
            Документы
          </span>

          <input
            ref={fileInputRef}
            className="lead-form__file-input"
            type="file"
            name="attachments"
            multiple
            onChange={handleFileChange}
          />

          <button
            className="lead-form__file-picker"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="lead-form__file-picker-icon" aria-hidden="true">
              +
            </span>

            <span>Добавить документы</span>
          </button>

          {selectedFiles.length > 0 && (
            <div className="lead-form__file-list" aria-label="Выбранные документы">
              {selectedFiles.map(({ id, file }) => (
                <div className="lead-form__file-item" key={id}>
                  <div className="lead-form__file-info">
                    <span className="lead-form__file-name">{file.name}</span>
                    <span className="lead-form__file-size">
                      {formatFileSize(file.size)}
                    </span>
                  </div>

                  <button
                    className="lead-form__file-remove"
                    type="button"
                    onClick={() => handleRemoveFile(id)}
                    aria-label={`Удалить файл ${file.name}`}
                    title="Удалить файл"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}

          <span className="lead-form__file-summary">
            Выбрано: {selectedFiles.length} из {LEAD_FILE_LIMITS.maxFiles}; общий
            размер: {formatFileSize(
              selectedFiles.reduce((sum, { file }) => sum + file.size, 0),
            )}.
          </span>

          <span className="lead-form__file-limits">
            До 10 файлов, каждый до 10 МиБ, суммарно до 25 МиБ. Пустые файлы не
            принимаются.
          </span>

          {fileError && (
            <span className="lead-form__file-error" role="alert">
              {fileError}
            </span>
          )}

          <span className="lead-form__file-note">
            Не прикрепляйте документы, содержащие персональные данные третьих
            лиц, если у вас нет права на их передачу.
          </span>
        </div>
      </div>

      <label className="lead-form__message">
        Описание задачи
        <textarea
          name="description"
          rows="5"
          placeholder="Кратко опишите объект, задачу, сроки или приложите ТЗ"
        />
      </label>

      <input type="hidden" name="source_system" value="ee_site" />
      <input
        type="hidden"
        name="source_page"
        value={`${window.location.pathname}${window.location.hash}`}
      />

      <label className="lead-form__consent">
        <input type="checkbox" name="consent" />
        <span>
          Я согласен на обработку персональных данных и передачу информации для
          подготовки ответа по заявке.{" "}
          <Link to="/privacy" target="_blank" rel="noopener noreferrer">
            Политика обработки персональных данных
          </Link>
        </span>
      </label>

      {submitMessage && (
        <div
          className={`lead-form__status lead-form__status--${submitStatus} ${
            isStatusHiding ? "lead-form__status--hiding" : ""
          }`}
          role="status"
          aria-live="polite"
        >
          {submitMessage}
        </div>
      )}

      <button
        className="button button--primary"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Отправляем..." : "Отправить заявку"}
      </button>
      </fieldset>
    </form>
  );
}

export default LeadForm;
