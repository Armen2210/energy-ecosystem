import { useRef, useState } from "react"

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
  })

  const handleChange = (e) => {
    const { name, value, files } = e.target

    setFormMessage(null)

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (isSubmitting) {
      return
    }
    /*
      ОБЯЗАТЕЛЬНЫЕ ПОЛЯ
    */

    if (!formData.name.trim()) {
      setFormMessage({ type: "error", text: "Укажите имя" })
      return
    }

    if (!formData.phone.trim()) {
      setFormMessage({ type: "error", text: "Укажите телефон" })
      return
    }

    /*
      ПРОВЕРКА EMAIL
      Сейчас отключена.

      Чтобы снова сделать email обязательным —
      убери комментарии ниже.
    */

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
            <div className="contact-section__content">
              <p className="section__eyebrow">Финальный шаг</p>

              <h2 className="section__title">
                Обсудим задачу вашего объекта
              </h2>

              <p className="contact-section__text">
                Поможем подобрать инженерное решение, обсудить проект и определить
                дальнейшие шаги по реализации задачи.
              </p>

              <div className="contact-section__contacts">
                <a href="tel:+79381693109">+7 (938) 169-31-09</a>
                <a href="mailto:salestd@ee-don.ru">salestd@ee-don.ru</a>
                <span>Ростов-на-Дону</span>
              </div>
            </div>

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

              <button
                type="submit"
                className="btn btn--primary"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Отправляем..." : "Обсудить проект"}
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
