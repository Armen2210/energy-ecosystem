// =========================================================
// CASES PAGE / КЕЙСЫ
// Страница будущих реализованных проектов.
// =========================================================

import SectionHeader from "../../components/SectionHeader";

function CasesPage() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="Кейсы"
            title="Реализованные инженерные решения"
            description="Здесь будут собраны проекты, в которых Энергоэффект решал задачи теплоснабжения, водоснабжения, пожарной безопасности и автоматизации."
          />
        </div>
      </section>
    </main>
  );
}

export default CasesPage;