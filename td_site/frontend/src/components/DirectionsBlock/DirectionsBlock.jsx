// =====================================================
// DirectionsBlock сайта ТД «Энергоэффект»
//
// Блок инженерных направлений на главной странице.
//
// Задачи:
// - кратко показать, с какими зонами комплектации работает ТД;
// - объяснить, что клиент может обратиться не только
//   с готовой спецификацией;
// - заменить отдельную страницу /directions в коротком
//   формате главной посадочной страницы.
//
// Данные карточек берутся из src/data/directions.js.
// =====================================================

import {
  directionAreas,
  directionStartOptions,
} from "../../data/directions"

function DirectionsBlock() {
  return (
    <section className="directions section section--muted" id="directions">
      <div className="container">
        {/* =====================================================
            ЗАГОЛОВОК БЛОКА
        ===================================================== */}
        <div className="section__head">
          <p className="section__eyebrow">Направления</p>

          <h2 className="section__title">
            Инженерные направления для комплектации объектов
          </h2>

          <p className="section__text">
            Работаем с оборудованием и материалами не как с витриной товаров,
            а как с частью задачи объекта: подбираем решения под проект,
            эксплуатацию, модернизацию и сроки поставки.
          </p>
        </div>

        {/* =====================================================
            ЗОНЫ КОМПЛЕКТАЦИИ
        ===================================================== */}
        <div className="page-grid">
          {directionAreas.map((item) => (
            <article className="info-card" key={item.title}>
              <h3>{item.title}</h3>

              <p>{item.description}</p>
            </article>
          ))}
        </div>

        {/* =====================================================
            КАК МОЖНО НАЧАТЬ ОБСУЖДЕНИЕ
        ===================================================== */}
        <div className="section__head section__head--compact">
          <p className="section__eyebrow">Как начать</p>

          <h2 className="section__title">
            Не обязательно знать точный перечень оборудования
          </h2>

          <p className="section__text">
            Если есть проект, спецификация или только описание задачи — с этого
            уже можно начать обсуждение. Мы поможем определить дальнейший
            маршрут.
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
  )
}

export default DirectionsBlock