// =========================================================
// NOT FOUND PAGE / СТРАНИЦА 404
// Показывается, если пользователь открыл несуществующий маршрут.
// Задача страницы:
// - спокойно объяснить ситуацию;
// - вернуть пользователя в полезный сценарий;
// - дать быстрые переходы к продукции, услугам и заявке.
// =========================================================

import { Link } from "react-router-dom";

import SectionHeader from "../../components/SectionHeader";

function NotFoundPage() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="404"
            title="Страница не найдена"
            description="Возможно, адрес изменился или страница была удалена. Вы можете вернуться на главную, перейти к продукции или сразу оставить заявку."
          />

          <div className="not-found-actions">
            <Link
              className="button button--primary"
              to="/"
              state={{ entryScroll: "top-smooth" }}
            >
              На главную
            </Link>

            <Link
              className="button button--secondary"
              to="/#products"
            >
              Смотреть продукцию
            </Link>

            <Link
              className="button button--secondary"
              to="/#contacts"
            >
              Оставить заявку
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;