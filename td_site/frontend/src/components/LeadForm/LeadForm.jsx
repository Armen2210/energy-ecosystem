// =====================================================
// LeadForm сайта ТД «Энергоэффект»
//
// Финальный конверсионный блок главной страницы.
//
// Задачи:
// - принять заявку на комплектацию инженерного объекта;
// - дать пользователю подсказку, что можно отправить;
// - показать контакты;
// - сохранить юридически корректное согласие на обработку
//   персональных данных.
//
// Важно:
// форма остаётся рабочей и отправляет данные в backend:
// POST /api/leads/
// =====================================================

import { useRef, useState } from "react"
import { Link } from "react-router-dom"

function LeadForm() {
  const fileInputRef = useRef(null)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formMessage, setFormMessage] = useState(null)

  const [formData, setFormData] = useState({
    name: "",
    company: "",
    phone: "",
    email: "",
    message: "",
    file: null,
    personalDataConsent: false,
  })

  const handleChange = (e) => {
    const { name, value, files, type, checked } = e.target

    setFormMessage(null)

    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : files ? files[0] : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting) {
      return
    }

    // =====================================================
    // ОБЯЗАТЕЛЬНЫЕ ПОЛЯ
    // =====================================================

    if (!formData.name.trim()) {
      setFormMessage({ type: "error", text: "Укажите имя" })
      return
    }

    if (!formData.phone.trim()) {
      setFormMessage({ type: "error", text: "Укажите телефон" })
      return
    }

    if (!formData.personalDataConsent) {
      setFormMessage({
        type: "error",
        text: "Подтвердите согласие на обработку персональных данных",
      })
      return
    }

    // =====================================================
    // ПРОВЕРКА EMAIL
    //
    // Сейчас email не является обязательным.
    // Если нужно снова сделать email обязательным —
    // можно вернуть проверки ниже.
    // =====================================================

    /*
    if (!formData.email.trim()) {
      setFormMessage({ type: "error", text: "Укажите email" })
      return
    }

    if (!formData.email.includes("@")) {
      setFormMessage({ type: "error", text: "Укажите корректный email" })
      return
    }
    */

    setIsSubmitting(true)
    setFormMessage(null)

    const data = new FormData()

    data.append("name", formData.name)
    data.append("company", formData.company)
    data.append("phone", formData.phone)
    data.append("email", formData.email)
    data.append("message", formData.message)
    data.append("source_page", window.location.pathname)
    data.append("personal_data_consent", "true")

    if (formData.file) {
      data.append("uploaded_file", formData.file)
    }

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/leads/`, {
        method: "POST",
        body: data,
      })

      if (response.status === 409) {
        setFormMessage({
          type: "error",
          text: "Похожая заявка уже была отправлена недавно.",
        })
        return
      }

      if (!response.ok) {
        throw new Error("Ошибка отправки")
      }

      setFormData({
        name: "",
        company: "",
        phone: "",
        email: "",
        message: "",
        file: null,
        personalDataConsent: false,
      })

      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      setFormMessage({
        type: "success",
        text: "Спасибо! Мы получили вашу заявку. Мы свяжемся с вами в ближайшее время.",
      })
    } catch (error) {
      console.error(error)

      setFormMessage({
        type: "error",
        text: "Ошибка при отправке формы. Попробуйте снова.",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section className="contact-section lead-form">
      <div className="container">
        <div className="contact-section__grid">
          {/* =====================================================
              ЛЕВАЯ КОЛОНКА
              Подсказки, контакты и доверие перед отправкой формы.
          ===================================================== */}
          <div className="contact-section__content">
            <p className="section__eyebrow">Финальный шаг</p>

            <h2 className="section__title">
              Обсудим задачу вашего объекта
            </h2>

            <p className="contact-section__text">
              Опишите задачу, приложите проект или спецификацию — поможем
              определить маршрут: комплектация, производственное решение или
              подбор оборудования.
            </p>

            <div className="contact-section__cards">

              <article className="contact-info-card">
                <h3>Как с нами связаться</h3>

                <div className="contact-section__contacts">
                  <a href="tel:+79381246802">+7 (938) 124-68-02</a>
                  <a href="mailto:salestd@ee-don.ru">salestd@ee-don.ru</a>
                  <span>Ростов-на-Дону</span>
                </div>
              </article>

              <article className="contact-info-card">
                  <h3>Реквизиты компании</h3>

                  <p>
                    ООО «ТОРГОВЫЙ ДОМ ЭНЕРГОЭФФЕКТ»
                    <br />
                    <strong>ИНН:</strong> 6161098301
                    <br />
                    <strong>КПП:</strong> 616101001
                    <br />
                    <strong>ОГРН:</strong> 1236100003490
                    <br />
                    <strong>Юридический адрес:</strong> 344113, Ростовская область,
                    г. Ростов-на-Дону, б-р Комарова, здание 28/2, офис 403-404А
                  </p>
              </article>
            </div>
          </div>

          {/* =====================================================
              ФОРМА ЗАЯВКИ
          ===================================================== */}
          <form className="form contact-form" onSubmit={handleSubmit}>
            <div className="contact-form__head">
              <h3>Расскажите о задаче</h3>

              <p>
                Достаточно кратко описать объект, задачу или приложить проект /
                спецификацию.
              </p>
            </div>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Ваше имя"
              autoComplete="name"
            />

            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Компания"
              autoComplete="organization"
            />

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Телефон"
              autoComplete="tel"
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
              autoComplete="email"
            />

            <textarea
              rows="5"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Что требуется вашему объекту?"
            ></textarea>

            <label className="form__file-label">
              Прикрепить проект / спецификацию
            </label>

            <input
              ref={fileInputRef}
              type="file"
              name="file"
              onChange={handleChange}
              className="file-input"
            />

            <p className="form__file-note">
              Не прикрепляйте документы, содержащие персональные данные третьих
              лиц, если у вас нет права на их передачу.
            </p>

            <div className="form__consent">
              <input
                id="personalDataConsent"
                type="checkbox"
                name="personalDataConsent"
                checked={formData.personalDataConsent}
                onChange={handleChange}
              />

              <label htmlFor="personalDataConsent">
                Я согласен на обработку персональных данных в соответствии с{" "}
                <Link to="/privacy" target="_blank" rel="noreferrer">
                  Политикой обработки персональных данных
                </Link>
                .
              </label>
            </div>

            <button
              type="submit"
              className="btn btn--primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Отправляем..." : "Отправить заявку"}
            </button>

            {formMessage && (
              <div className={`form-message form-message--${formMessage.type}`}>
                {formMessage.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </section>
  )
}

export default LeadForm