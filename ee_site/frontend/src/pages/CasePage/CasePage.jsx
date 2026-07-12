// =========================================================
// CASE PAGE / ДЕТАЛЬНАЯ СТРАНИЦА КЕЙСА
//
// Прямая страница отдельного реализованного объекта.
// Использует то же представление CaseView,
// что и модальное окно кейса.
// =========================================================

import {
  Link,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";

import CaseView from "../../components/CaseView";
import Seo from "../../components/Seo";

import { cases } from "../../data/cases";

function CasePage() {
  const { slug } = useParams();

  const navigate = useNavigate();

  const caseItem = cases.find((item) => item.slug === slug);

  if (!caseItem || !caseItem.hasDetailPage) {
    return <Navigate to="/cases" replace />;
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
              ← Все кейсы
            </Link>

            <span className="case-page__breadcrumb">
              Главная / Кейсы / {caseItem.type}
            </span>
          </div>

          <div className="case-page__view">
            <CaseView
              caseItem={caseItem}
              onCtaClick={handleCtaClick}
              titleId="case-page-title"
            />
          </div>

          <div className="case-page__actions">
            <Link
              className="case-page__all-cases-link"
              to="/cases"
            >
              Смотреть все кейсы
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CasePage;