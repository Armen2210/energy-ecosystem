// =====================================================
// AboutPage сайта ТД «Энергоэффект»
//
// Страница объясняет роль ТД внутри инженерной экосистемы.
//
// Задачи страницы:
// - показать, что ТД не просто поставщик;
// - объяснить связь ТД, ЭЭ и Теплоучет;
// - описать принцип работы от задачи объекта.
//
// Данные карточек вынесены в src/data/about.js.
// =====================================================

import Header from "../../components/Header"
import Seo from "../../components/Seo"

import {
  aboutEcosystemCards,
  aboutPrincipleCards,
  aboutRoleCards,
} from "../../data/about"

function AboutPage() {
  return (
    <>
      <Seo
        title="О компании — ТД Энергоэффект"
        description="ТД Энергоэффект — точка входа в инженерную экосистему для комплектации объектов, подбора оборудования и маршрутизации задач."
        path="/about"
      />

      <Header />

      <main className="page about-page">
        <section className="page-hero">
          <div className="container">
            <p className="section__eyebrow">О компании</p>

            <h1 className="page__title">
              ТД Энергоэффект — точка входа в инженерную экосистему
            </h1>

            <p className="page__text">
              Помогаем заказчикам разобраться в задаче объекта, подобрать
              инженерные решения, организовать поставку и выйти на нужное
              направление внутри экосистемы Энергоэффект.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="page-grid">
              {aboutRoleCards.map((item) => (
                <article className="info-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section section--muted">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Экосистема</p>

              <h2 className="section__title">
                Как устроена экосистема Энергоэффект
              </h2>

              <p className="section__text">
                У каждого направления своя роль. ТД Энергоэффект помогает
                пользователю понять, куда обратиться с конкретной задачей.
              </p>
            </div>

            <div className="page-grid">
              {aboutEcosystemCards.map((item) => (
                <article className="info-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Принцип работы</p>

              <h2 className="section__title">
                Главное — понять задачу объекта
              </h2>

              <p className="section__text">
                Мы не строим сайт как каталог “всего подряд”. Для инженерных
                проектов важнее понять требования объекта, сроки, ограничения и
                подобрать реалистичный путь решения.
              </p>
            </div>

            <div className="page-grid">
              {aboutPrincipleCards.map((item) => (
                <article className="info-card" key={item.title}>
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default AboutPage