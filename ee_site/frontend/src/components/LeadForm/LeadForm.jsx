// =========================================================
// LEAD FORM / ФОРМА ЗАЯВКИ
// MVP-форма заявки.
// Позже подключим отправку в backend: POST /api/leads/
// =========================================================

function LeadForm({ products = [], services = [] }) {
  return (
    <form className="lead-form">
      <div className="lead-form__grid">
        <label>
          Имя
          <input type="text" name="name" placeholder="Как к вам обращаться" />
        </label>

        <label>
          Компания
          <input type="text" name="company_name" placeholder="Название компании" />
        </label>

        <label>
          Телефон
          <input type="tel" name="phone" placeholder="+7 (___) ___-__-__" />
        </label>

        <label>
          Email
          <input type="email" name="email" placeholder="name@company.ru" />
        </label>

        <label>
          Интересующее направление
          <select name="interest">
            <option value="">Выберите направление</option>

            <optgroup label="Продукты">
              {products.map((product) => (
                <option value={product.slug} key={product.slug}>
                  {product.title}
                </option>
              ))}
            </optgroup>

            <optgroup label="Услуги">
              {services.map((service) => (
                <option value={service.slug} key={service.slug}>
                  {service.title}
                </option>
              ))}
            </optgroup>
          </select>
        </label>

        <label>
          Файл
          <input type="file" name="attachment" />
        </label>
      </div>

      <label className="lead-form__message">
        Описание задачи
        <textarea
          name="description"
          rows="5"
          placeholder="Кратко опишите объект, задачу, сроки или приложите ТЗ"
        />
      </label>

      <label className="lead-form__consent">
        <input type="checkbox" name="consent" />
        <span>
          Я согласен на обработку персональных данных и передачу информации для
          подготовки ответа по заявке.
        </span>
      </label>

      <button className="button button--primary" type="submit">
        Отправить заявку
      </button>
    </form>
  );
}

export default LeadForm;