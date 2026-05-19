// =========================================================
// SERVICES PAGE / УСЛУГИ
// Страница услуг компании.
// =========================================================

import SectionHeader from "../../components/SectionHeader";
import ServiceCard from "../../components/ServiceCard";
import { services } from "../../data/services";

function ServicesPage() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="Услуги"
            title="Работы вокруг инженерных объектов"
            description="Проектирование, строительно-монтажные работы, пусконаладка и ввод инженерных систем в эксплуатацию."
          />

          <div className="services-grid">
            {services.map((service, index) => (
              <ServiceCard service={service} index={index} key={service.slug} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ServicesPage;