// =========================================================
// CASES PAGE / КЕЙСЫ
// Страница будущих реализованных проектов.
// =========================================================

import SectionHeader from "../../components/SectionHeader";
import Seo from "../../components/Seo";

function CasesPage() {
  return (
    <main>
      <Seo
        title="Кейсы Энергоэффект — инженерные решения для объектов"
        description="Кейсы ООО «Энергоэффект»: реализованные инженерные решения для теплоснабжения, водоснабжения, пожарной безопасности, автоматизации и инженерной инфраструктуры."
        path="/cases"
      />

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