// =====================================================
// ExpertiseSection сайта ТД «Энергоэффект»
//
// Доверительный блок главной страницы.
//
// Задачи:
// - не повторять блоки "Направления", "Решения" и "Процесс";
// - показать, почему с ТД удобно работать в инженерном B2B;
// - усилить доверие через подход к задаче, документации,
//   срокам, аналогам и маршрутизации внутри экосистемы.
//
// Важно:
// блок отвечает не на вопрос "что делаем",
// а на вопрос "почему нам можно доверить задачу".
// =====================================================

function ExpertiseSection() {
  return (
    <section className="expertise section" id="expertise">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Инженерный подход</p>

          <h2 className="section__title">
            Не просто поставляем позиции, а разбираемся в задаче объекта
          </h2>

          <p className="section__text">
            Для инженерных проектов важно не только найти оборудование, но и
            понять требования, ограничения, сроки и дальнейший маршрут решения.
          </p>
        </div>

        <div className="expertise__grid">
          <article className="expertise-card expertise-card--large">
            <span className="expertise-card__number">01</span>

            <h3>Работаем от задачи, а не от каталога</h3>

            <p>
              Можно обратиться с проектом, спецификацией или кратким описанием
              объекта. Мы помогаем понять, какой путь решения подходит в
              конкретной ситуации.
            </p>
          </article>

          <article className="expertise-card">
            <span className="expertise-card__number">02</span>

            <h3>Учитываем проектные требования</h3>

            <p>
              Смотрим на состав оборудования, условия эксплуатации, сроки,
              ограничения объекта и требования документации.
            </p>
          </article>

          <article className="expertise-card">
            <span className="expertise-card__number">03</span>

            <h3>Не обещаем невозможное</h3>

            <p>
              Если задача требует уточнений, производства или отдельного
              инженерного решения, мы обозначаем это до начала поставки.
            </p>
          </article>

          <article className="expertise-card">
            <span className="expertise-card__number">04</span>

            <h3>Помогаем с аналогами</h3>

            <p>
              Если исходная позиция недоступна по срокам, бюджету или поставке,
              предлагаем варианты для обсуждения и дальнейшего согласования.
            </p>
          </article>

          <article className="expertise-card">
            <span className="expertise-card__number">05</span>

            <h3>Ведём в нужный контур экосистемы</h3>

            <p>
              Если задачу лучше решать через производство Энергоэффект или
              каталог Теплоучет, помогаем определить правильный маршрут.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

export default ExpertiseSection