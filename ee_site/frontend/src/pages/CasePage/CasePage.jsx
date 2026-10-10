// =========================================================
// CASE PAGE / ДЕТАЛЬНАЯ СТРАНИЦА КЕЙСА
//
// Прямая страница отдельного реализованного объекта.
// Использует то же представление CaseView,
// что и модальное окно кейса.
// =========================================================

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import CaseView from "../../components/CaseView";
import Seo from "../../components/Seo";
import NotFoundPage from "../NotFoundPage";
import { products } from "../../data/products";
import { services } from "../../data/services";

import { cases } from "../../data/cases";

function CasePage() {
  const { slug } = useParams();

  const navigate = useNavigate();

  const caseItem = cases.find((item) => item.slug === slug);

  if (!caseItem || !caseItem.hasDetailPage) {
    return <NotFoundPage />;
  }

  const handleCtaClick = () => {
    navigate("/#contacts", {
      state: {
        entryScroll: "contacts-direct",
      },
    });
  };

  return (
    <main>
      <Seo
        title={caseItem.seo.title}
        description={caseItem.seo.description}
        path={caseItem.url}
      />

      <section className="section case-page">
        <div className="container">
          <div className="case-page__navigation">
            <Link className="case-page__back-link" to="/cases">
              ← Все объекты
            </Link>

            <span className="case-page__breadcrumb">
              Главная / Объекты / {caseItem.type}
            </span>
          </div>

          <div className="case-page__view">
            <CaseView
              caseItem={caseItem}
              onCtaClick={handleCtaClick}
              titleId="case-page-title"
              headingLevel={1}
            />
          </div>

          <nav className="case-page__related" aria-label="Связанные направления">
            <h2>Связанные направления</h2>
            <ul>
              {products.filter((item) => item.slug === caseItem.relatedProductSlug).map((item) => (
                <li key={item.slug}><Link to={`/solutions/${item.slug}`}>{item.title}</Link></li>
              ))}
              {services.filter((item) => caseItem.relatedServiceSlugs?.includes(item.slug)).map((item) => (
                <li key={item.slug}><Link to={`/services/${item.slug}`}>{item.title}</Link></li>
              ))}
            </ul>
          </nav>

          <div className="case-page__actions">
            <Link
              className="case-page__all-cases-link"
              to="/cases"
            >
              Смотреть все объекты
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CasePage;