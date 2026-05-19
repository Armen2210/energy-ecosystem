// =========================================================
// CONTACTS PAGE / КОНТАКТЫ
// Страница контактов и заявки.
// =========================================================

import LeadForm from "../../components/LeadForm";
import SectionHeader from "../../components/SectionHeader";
import { products } from "../../data/products";
import { services } from "../../data/services";

function ContactsPage() {
  return (
    <main>
      <section className="section section--contact">
        <div className="container contact-grid">
          <div>
            <SectionHeader
              eyebrow="Контакты"
              title="Свяжитесь с Энергоэффект"
              description="Оставьте заявку, приложите файл или кратко опишите задачу — мы свяжемся с вами для уточнения деталей."
            />

            <div className="contact-note">
              <strong>Телефон:</strong>
              <span>+7 (938) 169-31-09</span>
            </div>
          </div>

          <LeadForm products={products} services={services} />
        </div>
      </section>
    </main>
  );
}

export default ContactsPage;