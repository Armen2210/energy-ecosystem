// =========================================================
// ABOUT PAGE / О КОМПАНИИ
// Страница о производственной и инженерной роли компании.
// =========================================================

import SectionHeader from "../../components/SectionHeader";

function AboutPage() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="О компании"
            title="Энергоэффект — инженерная производственная платформа"
            description="Компания проектирует и производит инженерные системы для объектов, где важны надёжность, сроки, эксплуатация и ответственность за результат."
          />
        </div>
      </section>
    </main>
  );
}

export default AboutPage;