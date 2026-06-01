// =====================================================
// DirectionsPage сайта ТД «Энергоэффект»
//
// Страница инженерных направлений для комплектации объектов.
//
// Задачи страницы:
// - объяснить, с какими зонами комплектации работает ТД;
// - показать, что клиент может обратиться не только с готовой спецификацией;
// - направить пользователя к заявке.
//
// Данные карточек вынесены в src/data/directions.js.
// =====================================================

import { Link } from "react-router-dom"

import Header from "../../components/Header"
import Seo from "../../components/Seo"

import {
  directionAreas,
  directionStartOptions,
} from "../../data/directions"

function DirectionsPage() {
  return (
    <>
      <Seo
        title="Инженерные направления — ТД Энергоэффект"
        description="Инженерные направления для комплектации объектов: насосное оборудование, КИПиА, арматура, автоматика, теплообменное оборудование и комплектующие."
        path="/directions"
      />

      <Header />

      <main className="page directions-page">
        <section className="page-hero">
          <div className="container">
            <p className="section__eyebrow">Направления</p>

            <h1 className="page__title">
              Инженерные направления для комплектации объектов
            </h1>

            <p className="page__text">
              Работаем с направлениями инженерного оборудования не как с
              витриной товаров, а как с частью задачи объекта: подбираем
              решения под проект, эксплуатацию, модернизацию и сроки поставки.
            </p>
          </div>
        </section>

        <section className="section">
          <div className="container">
            <div className="section__head">
              <p className="section__eyebrow">Зоны комплектации</p>

              <h2 className="section__title">
                Что может входить в задачу объекта
              </h2>

              <p className="section__text">
                Состав поставки зависит от проекта. Можно обратиться с готовой
                спецификацией, описанием задачи или запросом на подбор
                возможных решений.
              </p>
            </div>

            <div className="page-grid">
              {directionAreas.map((item) => (
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
              <p className="section__eyebrow">Как начать</p>

              <h2 className="section__title">
                Не обязательно знать точный перечень оборудования
              </h2>

              <p className="section__text">
                Если есть проект, спецификация или только описание задачи — с
                этого уже можно начать обсуждение. Мы поможем определить
                дальнейший маршрут.
              </p>
            </div>

            <div className="page-grid">
              {directionStartOptions.map((item) => (
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
            <div className="process-cta">
              <div>
                <h3>Есть задача по инженерной комплектации?</h3>

                <p>
                  Опишите, что требуется объекту. Поможем определить, какие
                  направления и решения могут подойти.
                </p>
              </div>

              <Link to="/contacts" className="btn btn--primary">
                Обсудить проект
              </Link>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}

export default DirectionsPage