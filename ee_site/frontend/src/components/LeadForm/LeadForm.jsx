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
  appendSelectedFiles,
  setLeadAttachments,
} from "../../api/leadFiles";

import TopicSelect from "../TopicSelect";

import FileSelect from "../FileSelect";
import { analytics } from "../../analytics/runtime.js";
import { pageParams, safePath } from "../../analytics/policy.js";

function LeadForm({ products = [], services = [], initialTopic = "" }) {
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const [topicOrigin, setTopicOrigin] = useState(initialTopic);
  if (topicOrigin !== initialTopic) {
    setTopicOrigin(initialTopic);
    setSelectedTopic(initialTopic);
  }
  const mountedRef = useRef(false);
  const initialTopicRef = useRef(initialTopic);
  useEffect(() => {
    initialTopicRef.current = initialTopic;
  }, [initialTopic]);
  const submissionRef = useRef(null);
  const snapshotRef = useRef(null);
  const startedRef = useRef(false);
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
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      window.clearTimeout(statusHideTimerRef.current);
      window.clearTimeout(statusResetTimerRef.current);
      if (snapshotRef.current) analytics.release(snapshotRef.current);
    };
  }, []);

  function clearStatusTimers() {
    window.clearTimeout(statusHideTimerRef.current);
    window.clearTimeout(statusResetTimerRef.current);
    statusHideTimerRef.current = null;
    statusResetTimerRef.current = null;
  }

  function handleAddFiles(addedFiles) {
    const result = appendSelectedFiles(
      selectedFiles,
      addedFiles,
    );

    setSelectedFiles(result.files);
    setFileError(result.error);
    if (result.files.length > selectedFiles.length) {
      markStart();
      analytics.goal("document_selected", { ...pageParams(window.location.pathname), document_count: result.files.length === 1 ? "1" : result.files.length <= 5 ? "2-5" : "6-10" });
    }
  }

  function direction() {
    const product = products.find(item => (item.formTitle || item.title) === selectedTopic);
    const service = services.find(item => (item.cardTitle || item.title) === selectedTopic);
    return product ? { product: product.slug } : service ? { service: service.slug } : {};
  }

  function markStart() {
    if (startedRef.current) return;
    startedRef.current = true;
    analytics.goal("lead_form_start", { ...pageParams(window.location.pathname), ...direction(), placement: "form" });
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
      if (!mountedRef.current) return;
      const previousSubmission = submissionRef.current;
      const recovered = previousSubmission ? null : analytics.recoverSubmission(submissionSignature);
      submissionRef.current = submissionForSignature(
        submissionRef.current || recovered,
        submissionSignature,
        () => crypto.randomUUID(),
      );
      if (previousSubmission !== submissionRef.current) {
        if (snapshotRef.current) analytics.release(snapshotRef.current);
        snapshotRef.current = analytics.snapshot(direction(), recovered);
      }
      const snapshot = snapshotRef.current;
      for (const type of ["product", "service"]) {
        if (snapshot.direction[type]) {
          formData.set("direction_type", type);
          formData.set("direction_slug", snapshot.direction[type]);
        }
      }
      const attribution = analytics.payload(snapshot);
      analytics.rememberSubmission(submissionRef.current, snapshot);
      if (attribution) formData.set("campaign_attribution", JSON.stringify(attribution));
      formData.set("submission_id", submissionRef.current.id);

      await createLead(formData);
      analytics.success(submissionRef.current.id, snapshot);
      analytics.forgetSubmission(submissionRef.current.id);
      analytics.release(snapshot);
      snapshotRef.current = null;
      if (!mountedRef.current) return;
      submissionRef.current = null;
      startedRef.current = false;

      form.reset();
      setSelectedTopic(initialTopicRef.current);
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
      if (!mountedRef.current) return;
      if (error.status === 409) {
        if (submissionRef.current) analytics.forgetSubmission(submissionRef.current.id);
        submissionRef.current = null;
        if (snapshotRef.current) analytics.release(snapshotRef.current);
        snapshotRef.current = null;
      }
      setSubmitStatus("error");
      setSubmitMessage(
        error.message ||
          "Не удалось отправить заявку. Проверьте данные или попробуйте позже.",
      );
    } finally {
      isSubmittingRef.current = false;
      if (mountedRef.current) setIsSubmitting(false);
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit} onInput={markStart}>
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

        <label className="lead-form__topic-field">
          Интересующее направление

          <TopicSelect
            products={products}
            services={services}
            value={selectedTopic}
            onChange={(topic) => { markStart(); setSelectedTopic(topic); }}
            disabled={isSubmitting}
          />
        </label>

        <div className="lead-form__file-field">
          <span className="lead-form__file-label">
            Документы
          </span>

          <FileSelect
            files={selectedFiles}
            onAddFiles={handleAddFiles}
            onRemoveFile={handleRemoveFile}
            disabled={isSubmitting}
          />

          {fileError && (
            <span
              className="lead-form__file-error"
              role="alert"
            >
              {fileError}
            </span>
          )}

          <span className="lead-form__file-note">
            Не прикрепляйте документы, содержащие персональные данные
            третьих лиц, если у вас нет права на их передачу.
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
        value={safePath(window.location.pathname)}
      />

      <label className="lead-form__consent">
        <input type="checkbox" name="consent" />
        <span>
          Я согласен на обработку персональных данных и передачу информации для
          подготовки ответа по заявке.{" "}
          <Link to="/privacy?from=lead-form" target="_blank" rel="noopener noreferrer">
            Политика обработки персональных данных (новая вкладка)
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
