// =====================================================
// FaqSection сайта ТД «Энергоэффект»
//
// Блок вопросов и ответов.
// Данные вынесены в src/data/faqItems.js,
// чтобы компонент отвечал только за отображение.
// =====================================================

import { faqItems } from "../../data/faqItems"

function FaqSection() {
  return (
    <section className="faq section section--muted">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Вопросы и ответы</p>

          <h2 className="section__title">
            Вопросы по работе с проектами и поставками
          </h2>

          <p className="section__text">
            Кратко отвечаем на вопросы по взаимодействию, комплектации объектов
            и инженерным решениям.
          </p>
        </div>

        <div className="faq__list">
          {faqItems.map((item) => (
            <details className="faq-item" key={item.question}>
              <summary>{item.question}</summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}

export default FaqSection