// =========================================================
// LEAD FORM / ФОРМА ЗАЯВКИ
// MVP-форма заявки.
// Отправляет данные в backend: POST /api/leads/
// =========================================================

import { useState } from "react";
import { Link } from "react-router-dom";

import { createLead } from "../../api/leadsApi";

function LeadForm({ products = [], services = [], initialTopic = "" }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState("idle");
  const [submitMessage, setSubmitMessage] = useState("");
  const [isStatusHiding, setIsStatusHiding] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);

    const selectedTopic = formData.get("description_topic");
    const description = formData.get("description");
    const consentAccepted = formData.get("consent");

    if (!consentAccepted) {
      setSubmitStatus("error");
      setSubmitMessage("Подтвердите согласие на обработку персональных данных.");
      return;
    }

    if (selectedTopic) {
      formData.set(
        "description",
        `Интересующее направление: ${selectedTopic}\n\nОписание задачи:\n${
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
          <select name="description_topic" defaultValue={initialTopic}>
            <option value="">Выберите направление</option>

            <optgroup label="Продукты">
              {products.map((product) => (
                <option value={product.title} key={product.slug}>
                  {product.title}
                </option>
              ))}
            </optgroup>

            <optgroup label="Услуги">
              {services.map((service) => (
                <option value={service.title} key={service.slug}>
                  {service.title}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <label>
          Файл
          <input type="file" name="attachment" />
          <span className="lead-form__file-note">
            Не прикрепляйте документы, содержащие персональные данные третьих
            лиц, если у вас нет права на их передачу.
          </span>
        </label>
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