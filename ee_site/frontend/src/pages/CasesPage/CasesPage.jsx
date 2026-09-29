// =========================================================
// CASES PAGE / КЕЙСЫ
// Страница реализованных инженерных задач.
// Пока работает как общий реестр кейсов без детальных страниц.
// Данные берутся из src/data/cases.js.
// =========================================================

import { Link } from "react-router-dom";

import CaseCard from "../../components/CaseCard";
import PageNavigation from "../../components/PageNavigation";
import SectionHeader from "../../components/SectionHeader";
import Seo from "../../components/Seo";

import { cases } from "../../data/cases";

function CasesPage() {
  return (
    <main>
      <Seo
        title="Объекты Энергоэффект — реализованные инженерные решения"
        description="Реализованные объекты ООО «Энергоэффект»: инженерные решения для теплоснабжения, водоснабжения, пожарной безопасности, автоматизации и инженерной инфраструктуры."
        path="/cases"
      />

      <section className="section cases-page">
          <div className="container">
            <PageNavigation
              backLabel="К объектам на главной"
              backTo="/#cases"
              backState={{ entryScroll: "cases-direct" }}
              breadcrumbItems={[
                {
                  label: "Главная",
                  to: "/",
                },
                {
                  label: "Объекты",
                },
              ]}
            />

            <div className="cases-page__intro">
              <SectionHeader
                title="Реализованные инженерные решения"
                description="Здесь собраны задачи и направления, в которых ООО «Энергоэффект» разрабатывает, производит и сопровождает инженерные решения для объектов."
              />
            </div>

          <div className="cases-grid">
            {cases.map((caseItem) => (
              <CaseCard caseItem={caseItem} key={caseItem.slug} />
            ))}
          </div>

          <div className="cases-actions">
            <Link className="cases-link" to="/#contacts">
              Обсудить похожую задачу
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export default CasesPage;