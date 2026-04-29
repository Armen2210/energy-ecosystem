import { useState } from "react"

function LeadForm() {

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

    setFormData((prev) => ({
      ...prev,
      [name]: files ? files[0] : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const data = new FormData()

    data.append("name", formData.name)
    data.append("company", formData.company)
    data.append("phone", formData.phone)
    data.append("email", formData.email)
    data.append("message", formData.message)

    if (formData.file) {
      data.append("uploaded_file", formData.file)
    }

    try {
      const response = await fetch("http://127.0.0.1:8000/api/leads/", {
        method: "POST",
        body: data,
      })

      if (!response.ok) {
        throw new Error("Ошибка отправки")
      }

      alert("Заявка успешно отправлена")

    } catch (error) {
      console.error(error)
      alert("Ошибка при отправке формы")
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
            />

            <input
              type="text"
              name="company"
              value={formData.company}
              onChange={handleChange}
              placeholder="Компания"
            />

            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="Телефон"
            />

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Email"
            />

            <textarea
              rows="5"
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Описание задачи"
            ></textarea>

            <input
              type="file"
              name="file"
              onChange={handleChange}
              className="file-input"
            />

            <button
              type="submit"
              className="btn btn--primary"
            >
              Отправить заявку
            </button>

          </form>

        </div>
      </div>
    </section>
  )
}

export default LeadForm