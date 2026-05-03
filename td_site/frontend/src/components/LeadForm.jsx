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
      const response = await fetch("http://127.0.0.1:8000/api/leads/", {
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
        text: "Заявка успешно отправлена. Мы свяжемся с вами.",
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
    <section className="lead-form">
      <div className="container">
        <div className="lead-form__box">
          <div className="lead-form__content">
            <h2 className="section__title">
              Получить предложение
            </h2>

            <p className="lead-form__text">
              Оставьте заявку и мы подготовим предложение
              под ваш объект.
            </p>
          </div>

          <form className="form" onSubmit={handleSubmit}>
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
              placeholder="Описание задачи"
            ></textarea>

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
