// =====================================================
// ContactsPage сайта ТД «Энергоэффект»
//
// Страница контактов и формы обращения.
//
// Задачи страницы:
// - дать основные контакты;
// - объяснить, с какими исходными данными можно обратиться;
// - показать реквизиты;
// - вывести форму заявки.
//
// Данные карточек вынесены в src/data/contacts.js.
// =====================================================

import Header from "../../components/Header"
import Seo from "../../components/Seo"
import LeadForm from "../../components/LeadForm"

import { contactCards, contactRequestCards } from "../../data/contacts"

function ContactsPage() {
  return (
    <>
      <Seo
        title="Контакты — ТД Энергоэффект"
        description="Контакты ТД Энергоэффект: обсудить комплектацию инженерного объекта, подбор оборудования, проект или спецификацию."
        path="/contacts"
      />

      <Header />

      <main className="page contacts-page">
        <section className="page-hero">
          <div className="container">
            <p className="section__eyebrow">Контакты</p>

            <h1 className="page__title">
              Обсудим задачу вашего объекта
            </h1>

            <p className="page__text">
              Свяжитесь с ТД Энергоэффект, чтобы обсудить комплектацию объекта,
              подбор оборудования, производственное решение или дальнейший
              маршрут внутри инженерной экосистемы.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Как начать</p>

              <h2 className="section__title">
                Достаточно описать задачу
              </h2>

              <p className="section__text">
                Можно обратиться с проектом, спецификацией, перечнем
                оборудования или предварительным описанием объекта.
              </p>
            </div>

            <div className="page-grid">
              {contactCards.map((item) => (
                <article className="info-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>

            <div className="page-grid page-grid--details">
              <article className="info-card info-card--wide">
                  <h3>Реквизиты компании</h3>

                  <p>
                    <strong>Полное наименование:</strong> ООО «ТОРГОВЫЙ ДОМ ЭНЕРГОЭФФЕКТ»
                    <br />
                    <strong>ИНН:</strong> 6161098301
                    <br />
                    <strong>КПП:</strong> 616101001
                    <br />
                    <strong>ОГРН:</strong> 1236100003490
                    <br />
                    <strong>Юридический адрес:</strong> 344113, Ростовская область,
                    г.о. Город Ростов-на-Дону, г. Ростов-на-Дону, б-р Комарова,
                    здание 28/2, офис 403-404А
                    <br />
                    <strong>Email:</strong> salestd@ee-don.ru
                    <br />
                    <strong>Телефон:</strong> +7 (938) 124-68-02
                  </p>
              </article>
            </div>
          </div>
        </section>

        <section className="section section--muted">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Что можно отправить</p>

              <h2 className="section__title">
                Чем больше исходных данных, тем точнее маршрут
              </h2>

              <p className="section__text">
                Но даже если полного проекта пока нет, можно начать с краткого
                описания задачи.
              </p>
            </div>

            <div className="page-grid">
              {contactRequestCards.map((item) => (
                <article className="info-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <LeadForm />
      </main>
    </>
  )
}

export default ContactsPage