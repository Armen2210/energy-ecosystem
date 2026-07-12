// =========================================================
// CASE PAGE / ДЕТАЛЬНАЯ СТРАНИЦА КЕЙСА
// Универсальная страница отдельного реализованного объекта.
// Нужный кейс определяется по slug из адреса страницы.
// =========================================================

import { Link, Navigate, useParams } from "react-router-dom";

import AiSummary from "../../components/AiSummary";

import Seo from "../../components/Seo";

import { cases } from "../../data/cases";

function CasePage() {
  const { slug } = useParams();

  const caseItem = cases.find((item) => item.slug === slug);

  if (!caseItem || !caseItem.hasDetailPage) {
    return <Navigate to="/cases" replace />;
  }

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

            <div className="case-page__hero">
              <div className="case-page__hero-content">
                <span className="case-page__type">
                  {caseItem.type}
                </span>

                <h1>{caseItem.heroTitle}</h1>

                <p>{caseItem.heroSubtitle}</p>
              </div>

              <div className="case-page__hero-media">
                <img
                  src={caseItem.coverImage}
                  alt={caseItem.coverImageAlt}
                />
              </div>
            </div>
            <div className="case-page__summary">
              <AiSummary
                title={caseItem.aiSummary.label}
                lead={caseItem.aiSummary.lead}
                items={caseItem.aiSummary.items}
              />
            </div>
            <div className="case-page__content-grid">
              <article className="case-page__content-card">
                <h2>{caseItem.task.title}</h2>

                {caseItem.task.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </article>

              <article className="case-page__content-card">
                <h2>{caseItem.completedWorks.title}</h2>

                <ul>
                  {caseItem.completedWorks.items.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </article>
            </div>
            <section className="case-page__gallery-section">
              <div className="case-page__gallery-head">
                <h2>Фотографии объекта</h2>

                <p>
                  Фотографии изготовленного оборудования, выполненных работ
                  и реализованного инженерного решения на объекте.
                </p>
              </div>

              <div className="case-page__gallery">
                {caseItem.gallery.map((galleryItem) => (
                  <figure className="case-page__gallery-item" key={galleryItem.image}>
                    <img
                      src={galleryItem.image}
                      alt={galleryItem.alt}
                      loading="lazy"
                    />

                    {galleryItem.caption && (
                      <figcaption>{galleryItem.caption}</figcaption>
                    )}
                  </figure>
                ))}
              </div>
            </section>
            <div className="case-page__actions">
              <Link
                className="button button--primary"
                to="/#contacts"
                state={{ entryScroll: "contacts-direct" }}
              >
                {caseItem.cta.buttonText}
              </Link>

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