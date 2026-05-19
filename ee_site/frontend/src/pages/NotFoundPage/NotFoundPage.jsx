// =========================================================
// NOT FOUND PAGE / СТРАНИЦА 404
// Показывается, если пользователь открыл несуществующий маршрут.
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
            description="Такой страницы нет или адрес был изменён. Вернитесь на главную страницу сайта."
          />

          <Link className="button button--primary" to="/">
            Вернуться на главную
          </Link>
        </div>
      </section>
    </main>
  );
}

export default NotFoundPage;