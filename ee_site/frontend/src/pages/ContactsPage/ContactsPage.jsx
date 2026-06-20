// =========================================================
// CONTACTS PAGE / КОНТАКТЫ И ЗАЯВКА
// Страница для связи с ООО «Энергоэффект».
// Задача страницы:
// - быстро дать контакты;
// - показать режим работы;
// - объяснить, какие заявки можно отправлять;
// - оставить главным действием форму заявки.
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
              title="Связаться с Энергоэффект"
              description="Оставьте заявку, приложите файл или кратко опишите задачу — мы свяжемся с вами для уточнения деталей."
            />

            {/* =====================================================
                CONTACT DETAILS / КРАТКИЕ КОНТАКТЫ
                Компактный блок без перегруза страницы.
                Полную навигацию, экосистему и дополнительные ссылки
                пользователь видит в footer.
                ===================================================== */}

            <div className="contact-note">
              <strong>Как с нами связаться:</strong>

              <span>
                Телефон:{" "}
                <a href="tel:+78004440766">+7 800 444-07-66</a>
              </span>

              <span>
                Email:{" "}
                <a href="mailto:sales@ee-don.ru">
                  sales@ee-don.ru
                </a>
              </span>

              <span>Режим работы: Пн–Пт, 08:00–17:00</span>

              <span>
                Заявку через сайт можно отправить в любое время.
              </span>
            </div>

            <div className="contact-note contact-note--secondary">
              <strong>Какие заявки рассматриваем:</strong>
              <span>
                Производство БМК, БТП, ВНС, ПНС, шкафов управления,
                проектирование, строительно-монтажные работы и пусконаладку.
              </span>
            </div>
          </div>

          <LeadForm products={products} services={services} />
        </div>
      </section>
    </main>
  );
}

export default ContactsPage;