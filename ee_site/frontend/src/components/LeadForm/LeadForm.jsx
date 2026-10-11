// =========================================================
// LEAD FORM / ФОРМА ЗАЯВКИ
// MVP-форма заявки.
// Отправляет данные в backend: POST /api/leads/
// =========================================================

import { useEffect, useSyncExternalStore } from "react";
import { leadDraft } from "../../api/leadDraft.js";
import { Link, useLocation } from "react-router-dom";
import { useClientReady } from "../../hooks/useClientReady";

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
  const ready = useClientReady();
  const { pathname } = useLocation();
  const draft = useSyncExternalStore(leadDraft.subscribe, leadDraft.get, leadDraft.getServerSnapshot);
  const selectedTopic = draft.started ? draft.topic : initialTopic;
  const selectedFiles = draft.files;
  const isSubmitting = draft.submitting;
  const fileError = draft.fileError;
  const submitStatus = draft.status;
  const submitMessage = draft.message;
  useEffect(() => leadDraft.presentSuccess(draft.successToken), [draft.successToken]);

  function handleFieldChange(event) {
    if (!ready || leadDraft.get().submitting) return;
    const { name, value, checked, type } = event.target;
    markStart();
    leadDraft.update({ fields: { ...leadDraft.get().fields, [name]: type === "checkbox" ? checked : value } });
  }

  function handleAddFiles(addedFiles) {
    if (leadDraft.get().submitting) return;
    const result = appendSelectedFiles(leadDraft.get().files, addedFiles);
    if (result.files.length > selectedFiles.length) {
      markStart();
      analytics.goal("document_selected", { ...pageParams(window.location.pathname), document_count: result.files.length === 1 ? "1" : result.files.length <= 5 ? "2-5" : "6-10" });
    }
    leadDraft.update({ files: result.files, fileError: result.error });
  }

  function direction() {
    const product = products.find(item => (item.formTitle || item.title) === selectedTopic);
    const service = services.find(item => (item.cardTitle || item.title) === selectedTopic);
    return product ? { product: product.slug } : service ? { service: service.slug } : {};
  }

  function markStart() {
    if (leadDraft.get().started || leadDraft.get().submitting) return;
    leadDraft.update({ started: true, topic: selectedTopic, sourcePage: safePath(window.location.pathname), status: "idle", message: "" });
    analytics.goal("lead_form_start", { ...pageParams(window.location.pathname), ...direction(), placement: "form" });
  }

  function handleRemoveFile(fileId) {
    if (leadDraft.get().submitting) return;
    leadDraft.update({ files: leadDraft.get().files.filter(({ id }) => id !== fileId), fileError: "" });
  }

  function handleClear() {
    const current = leadDraft.get();
    if (current.submitting) return;
    const nonempty = current.started || current.files.length > 0 || Object.values(current.fields).some(Boolean);
    if (nonempty && !window.confirm("Очистить форму? Введённые данные и прикреплённые файлы будут удалены")) return;
    for (const id of current.retryIds) analytics.forgetSubmission(id);
    if (current.snapshot) analytics.release(current.snapshot);
    leadDraft.reset();
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (!ready || leadDraft.get().submitting) return;
    const formData = new FormData(event.currentTarget);
    const submittedTopic = formData.get("description_topic");
    const description = formData.get("description");
    if (!formData.get("consent")) {
      leadDraft.update({ status: "error", message: "Подтвердите согласие на обработку персональных данных." });
      return;
    }
    markStart();
    if (submittedTopic) {
      formData.set("description", `Интересующее направление: ${submittedTopic}\n\nОписание задачи:\n${description || "Не указано"}`);
    }
    formData.delete("description_topic");
    formData.delete("consent");
    setLeadAttachments(formData, leadDraft.get().files);

    // Acquire the tab-wide lock before hashing; unmounting never releases it.
    const operation = {};
    leadDraft.update({ submitting: true, operation, status: "idle", message: "" });
    const ownsDraft = () => leadDraft.get().operation === operation;
    try {
      const submissionSignature = await createSubmissionSignature(formData);
      if (!ownsDraft()) return;
      const previousSubmission = leadDraft.get().submission;
      const recovered = previousSubmission ? null : analytics.recoverSubmission(submissionSignature);
      const submission = submissionForSignature(previousSubmission || recovered, submissionSignature, () => crypto.randomUUID());
      let snapshot = leadDraft.get().snapshot;
      if (previousSubmission !== submission) {
        if (snapshot) analytics.release(snapshot);
        snapshot = analytics.snapshot(direction(), recovered);
      }
      // Keep ownership of superseded attempts without changing existing retry storage.
      const retryIds = [...new Set([...leadDraft.get().retryIds, submission.id])];
      leadDraft.update({ submission, snapshot, retryIds });
      for (const type of ["product", "service"]) {
        if (snapshot.direction[type]) {
          formData.set("direction_type", type);
          formData.set("direction_slug", snapshot.direction[type]);
        }
      }
      const attribution = analytics.payload(snapshot);
      analytics.rememberSubmission(submission, snapshot);
      if (attribution) formData.set("campaign_attribution", JSON.stringify(attribution));
      formData.set("submission_id", submission.id);
      await createLead(formData);
      analytics.success(submission.id, snapshot);
      for (const id of retryIds) analytics.forgetSubmission(id);
      analytics.release(snapshot);
      if (!ownsDraft()) return;
      leadDraft.reset({ status: "success", message: "Заявка отправлена. Мы свяжемся с вами после обработки обращения." });
    } catch (error) {
      if (!ownsDraft()) return;
      if (error.status === 409) {
        const current = leadDraft.get();
        if (current.submission) analytics.forgetSubmission(current.submission.id);
        if (current.snapshot) analytics.release(current.snapshot);
        leadDraft.update({ submission: null, snapshot: null });
      }
      leadDraft.update({ status: "error", message: error.message || "Не удалось отправить заявку. Проверьте данные или попробуйте позже." });
    } finally {
      if (ownsDraft()) leadDraft.update({ submitting: false, operation: null });
    }
  }

  return (
    <form className="lead-form" method="post" onSubmit={handleSubmit} aria-busy={!ready}>
      <noscript><p>Для заполнения и отправки заявки включите JavaScript. Основное содержание сайта и ссылки доступны без него.</p></noscript>
      <fieldset className="lead-form__fieldset" disabled={!ready || isSubmitting}>
      <div className="lead-form__grid">
        <label>
          Имя
          <input
            type="text"
            name="name"
            value={draft.fields.name}
            onChange={handleFieldChange}
            placeholder="Как к вам обращаться"
            required
          />
        </label>

        <label>
          Компания
          <input
            type="text"
            name="company_name"
            value={draft.fields.company_name}
            onChange={handleFieldChange}
            placeholder="Название компании"
          />
        </label>

        <label>
          Телефон
          <input
            type="tel"
            name="phone"
            value={draft.fields.phone}
            onChange={handleFieldChange}
            placeholder="+7 (___) ___-__-__"
            required
          />
        </label>

        <label>
          Email
          <input type="email" name="email" value={draft.fields.email} onChange={handleFieldChange} placeholder="name@company.ru" />
        </label>

        <label className="lead-form__topic-field">
          Интересующее направление

          <TopicSelect
            products={products}
            services={services}
            value={selectedTopic}
            onChange={(topic) => { if (!leadDraft.get().submitting) { markStart(); leadDraft.update({ topic }); } }}
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
            value={draft.fields.description}
            onChange={handleFieldChange}
          rows="5"
          placeholder="Кратко опишите объект, задачу, сроки или приложите ТЗ"
        />
      </label>

      <input type="hidden" name="source_system" value="ee_site" />
      <input
        type="hidden"
        name="source_page"
        value={draft.sourcePage || safePath(pathname)}
      />

      <label className="lead-form__consent">
        <input type="checkbox" name="consent" checked={draft.fields.consent} onChange={handleFieldChange} />
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
          className={`lead-form__status lead-form__status--${submitStatus}${draft.hiding ? " lead-form__status--hiding" : ""}`}
          role="status"
          aria-live="polite"
        >
          {submitMessage}
        </div>
      )}

      <div className="lead-form__actions">
        <button
        className="button button--primary"
        type="submit"
        disabled={isSubmitting}
      >
        {isSubmitting ? "Отправляем..." : "Отправить заявку"}
      </button>
        <button
          className="lead-form__clear"
          type="button"
          onClick={handleClear}
          disabled={isSubmitting}
        >
          Очистить форму
        </button>
      </div>
      </fieldset>
    </form>
  );
}

export default LeadForm;
