// =========================================================
// SERVICES PAGE / УСЛУГИ
// Страница услуг компании.
// =========================================================

import SectionHeader from "../../components/SectionHeader";
import Seo from "../../components/Seo";
import ServiceCard from "../../components/ServiceCard";

import { services } from "../../data/services";

function ServicesPage() {
  return (
    <main>
      <Seo
        title="Услуги Энергоэффект — проектирование, СМР и пусконаладка"
        description="Инженерные услуги ООО «Энергоэффект»: проектирование инженерных объектов и сетей, строительно-монтажные работы, пусконаладка и ввод систем в эксплуатацию."
        path="/services"
      />

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