// =========================================================
// LEAD FORM / ФОРМА ЗАЯВКИ
// MVP-форма заявки.
// Отправляет данные в backend: POST /api/leads/
// =========================================================

import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";

import { createLead } from "../../api/leadsApi";

import TopicSelect from "../TopicSelect";

function LeadForm({ products = [], services = [], initialTopic = "" }) {
  const [selectedTopic, setSelectedTopic] = useState(initialTopic);
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isStatusHiding, setIsStatusHiding] = useState(false);
  useEffect(() => {
    setSelectedTopic(initialTopic);
  }, [initialTopic]);

  function handleFileChange(event) {
    const file = event.target.files?.[0] || null;
    setSelectedFile(file);
  }

  function handleRemoveFile() {
    setSelectedFile(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

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

    setIsSubmitting(true);
    setSubmitStatus("idle");
    setSubmitMessage("");
    setIsStatusHiding(false);

    try {
      await createLead(formData);

      form.reset();
      setSelectedTopic(initialTopic);
      setSelectedFile(null);

      setSubmitStatus("success");
      setSubmitMessage(
        "Заявка отправлена. Мы свяжемся с вами после обработки обращения.",
      );

      setTimeout(() => {
        setIsStatusHiding(true);
      }, 5000);

      setTimeout(() => {
        setSubmitStatus("idle");
        setSubmitMessage("");
        setIsStatusHiding(false);
      }, 5600);
    } catch (error) {
      setSubmitStatus("error");
      setSubmitMessage(
        error.message ||
          "Не удалось отправить заявку. Проверьте данные или попробуйте позже.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
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
          />
        </label>

        <div className="lead-form__file-field">
          <span className="lead-form__file-label">
            Файл
          </span>

          <input
            ref={fileInputRef}
            className="lead-form__file-input"
            type="file"
            name="attachment"
            onChange={handleFileChange}
          />

          {!selectedFile ? (
            <button
              className="lead-form__file-picker"
              type="button"
              onClick={() => fileInputRef.current?.click()}
            >
              <span className="lead-form__file-picker-icon" aria-hidden="true">
                +
              </span>

              <span>Прикрепить файл</span>
            </button>
          ) : (
            <div className="lead-form__file-item">
              <div className="lead-form__file-info">
                <span className="lead-form__file-name">
                  {selectedFile.name}
                </span>

                <span className="lead-form__file-size">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                </span>
              </div>

              <button
                className="lead-form__file-remove"
                type="button"
                onClick={handleRemoveFile}
                aria-label={`Удалить файл ${selectedFile.name}`}
                title="Удалить файл"
              >
                ×
              </button>
            </div>
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
    </form>
  );
}

export default LeadForm;