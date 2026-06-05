// =====================================================
// ExpertiseSection сайта ТД «Энергоэффект»
//
// Блок инженерной экспертизы.
//
// Задачи:
// - показать, чем ТД полезен помимо простой поставки;
// - объяснить роль в подборе оборудования, аналогов,
//   координации поставок и работе с проектными задачами;
// - усилить доверие к ТД как к B2B-точке входа
//   в инженерную экосистему.
//
// Важно:
// компонент вынесен из HomePage.jsx, чтобы главная страница
// оставалась сборщиком секций, как в архитектуре сайта ЭЭ.
// =====================================================

function ExpertiseSection() {
  return (
    <section className="expertise section" id="expertise">
      <div className="container">
        <div className="section__head">
          <p className="section__eyebrow">Инженерная экспертиза</p>

          <h2 className="section__title">
            Помогаем решать задачи инженерных объектов
          </h2>

          <p className="section__text">
            Работаем с задачами комплектации, подбора оборудования и
            организации поставок для объектов различной сложности.
          </p>
        </div>

        <div className="expertise__grid">
          <article className="expertise-card expertise-card--large">
            <span className="expertise-card__number">01</span>

            <h3>Комплектация объектов</h3>

            <p>
              Помогаем организовать поставки оборудования и материалов под
              задачи инженерного проекта.
            </p>
          </article>

          <article className="expertise-card">
            <span className="expertise-card__number">02</span>

            <h3>Подбор оборудования</h3>

            <p>
              Подбираем решения под проектную документацию, требования объекта
              и особенности реализации.
            </p>
          </article>

          <article className="expertise-card">
            <span className="expertise-card__number">03</span>

            <h3>Поиск аналогов</h3>

            <p>
              Предлагаем альтернативные решения под сроки, бюджет и доступность
              оборудования.
            </p>
          </article>

          <article className="expertise-card">
            <span className="expertise-card__number">04</span>

            <h3>Координация поставок</h3>

            <p>
              Помогаем выстраивать поставки оборудования для различных этапов
              реализации объекта.
            </p>
          </article>

          <article className="expertise-card">
            <span className="expertise-card__number">05</span>

            <h3>Работа по проекту</h3>

            <p>
              Взаимодействуем с проектными, строительными и монтажными
              организациями.
            </p>
          </article>
        </div>
      </div>
    </section>
  )
}

export default ExpertiseSection