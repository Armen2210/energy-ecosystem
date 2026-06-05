// =====================================================
// CasesPreview сайта ТД «Энергоэффект»
//
// Блок типовых инженерных задач на главной странице.
//
// Задачи:
// - показать, с какими B2B-задачами может прийти клиент;
// - не использовать выдуманные KPI и искусственные показатели;
// - подготовить место под будущие реальные кейсы;
// - заменить отдельную страницу /cases в коротком формате.
//
// Данные вынесены в src/data/casesPreview.js.
// =====================================================

import { casesPreview } from "../../data/casesPreview"

function CasesPreview() {
  // =====================================================
  // Скролл к форме заявки
  //
  // Используем JS-скролл вместо обычного href="#contacts",
  // чтобы переход был плавным и предсказуемым.
  // =====================================================
  const scrollToContacts = (event) => {
    event.preventDefault()

    const contactsSection = document.getElementById("contacts")

    if (!contactsSection) {
      return
    }

    contactsSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <section className="cases-preview section" id="cases">
      <div className="container">
        {/* =====================================================
            ЗАГОЛОВОК БЛОКА
        ===================================================== */}
        <div className="section__head">
          <p className="section__eyebrow">Типовые задачи</p>

          <h2 className="section__title">
            Инженерные задачи, которые можно разобрать через ТД
          </h2>

          <p className="section__text">
            Не используем выдуманные проценты, искусственные KPI и “успешный
            успех”. Для инженерного B2B важнее честно показать задачу, возможный
            маршрут решения и следующий шаг для клиента.
          </p>
        </div>

        {/* =====================================================
            КАРТОЧКИ ТИПОВЫХ ЗАДАЧ
        ===================================================== */}
        <div className="cases-preview__grid">
          {casesPreview.map((item) => (
            <article className="case-preview-card" key={item.type}>
              <span className="case-preview-card__type">
                {item.type}
              </span>

              <div>
                <h3>Задача</h3>
                <p>{item.task}</p>
              </div>

              <div>
                <h3>Маршрут решения</h3>
                <p>{item.result}</p>
              </div>
            </article>
          ))}
        </div>

        {/* =====================================================
            CTA
        ===================================================== */}
        <div className="cases-preview__footer">
          <p>
            Есть похожая задача по объекту? Опишите исходные данные — поможем
            определить маршрут: комплектация, производственное решение или
            оборудование из каталога.
          </p>

          <a href="#contacts" className="btn btn--primary" onClick={scrollToContacts}>
            Обсудить проект
          </a>
        </div>
      </div>
    </section>
  )
}

export default CasesPreview