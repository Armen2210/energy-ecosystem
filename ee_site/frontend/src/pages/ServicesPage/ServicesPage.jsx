// =========================================================
// SERVICES PAGE / УСЛУГИ
// Страница услуг компании.
// =========================================================

import SectionHeader from "../../components/SectionHeader";
import PageNavigation from "../../components/PageNavigation";
import Seo from "../../components/Seo";
import ServiceCard from "../../components/ServiceCard";

import { services } from "../../data/services";

function ServicesPage() {
  return (
    <main className="catalog-page">
      <Seo
        title="Услуги Энергоэффект — проектирование, СМР и пусконаладка"
        description="Инженерные услуги ООО «Энергоэффект»: проектирование инженерных объектов и сетей, строительно-монтажные работы, пусконаладка и ввод систем в эксплуатацию."
        path="/services"
      />

      <section className="section section--services">
        <div className="container">
          <PageNavigation
            backLabel="На главную"
            backTo="/"
            breadcrumbItems={[
              { label: "Главная", to: "/" },
              { label: "Услуги" },
            ]}
          />
          <SectionHeader
            as="h1"
            eyebrow="Услуги"
            title="Работы вокруг инженерных объектов"
            description="Проектирование, строительно-монтажные работы, пусконаладка и ввод инженерных систем в эксплуатацию."
          />

          <div className="services-grid services-grid--home">
            {services.map((service, index) => (
              <ServiceCard
                headingLevel={2}
                service={service}
                index={index}
                key={service.slug}
              />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default ServicesPage;
