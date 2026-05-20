// =========================================================
// SERVICE PAGE / СТРАНИЦА УСЛУГИ
// Универсальная страница услуги компании.
// Позже будет открываться по маршрутам:
// /services/design, /services/construction-installation,
// /services/commissioning
// =========================================================

import { useParams } from "react-router-dom";

import AiSummary from "../../components/AiSummary";
import InfoListBlock from "../../components/InfoListBlock";
import LeadForm from "../../components/LeadForm";
import SectionHeader from "../../components/SectionHeader";
import TrustBlock from "../../components/TrustBlock";
import { products } from "../../data/products";
import { services } from "../../data/services";

function ServicePage() {
  const { slug } = useParams();
  const service = services.find((item) => item.slug === slug);

  if (!service) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <SectionHeader
              eyebrow="Услуги"
              title="Услуга не найдена"
              description="Проверьте адрес страницы или вернитесь к списку услуг компании."
            />
          </div>
        </section>
      </main>
    );
  }

  return (
    <main>
      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow={service.shortTitle}
            title={service.title}
            description={service.description}
          />

          <AiSummary
            title={`${service.title}: кратко`}
            items={[
              "Услуга относится к инженерным объектам и системам.",
              "Работы выполняются с учётом требований проекта, объекта и эксплуатации.",
              "Для оценки задачи можно отправить заявку, ТЗ, проект или спецификацию.",
            ]}
          />
          <TrustBlock
              title="Как мы подходим к работе"
              items={[
                {
                  title: "От задачи объекта",
                  description:
                    "Сначала уточняем условия, исходные данные, ограничения и требования к результату.",
                },
                {
                  title: "С учётом эксплуатации",
                  description:
                    "Решение должно быть не только выполнено, но и понятно обслуживаться после запуска.",
                },
                {
                  title: "С привязкой к срокам",
                  description:
                    "Учитываем проектные, монтажные и организационные этапы, чтобы работа двигалась последовательно.",
                },
              ]}
          />

          <div className="info-list-grid">
              <InfoListBlock title="Что входит в услугу" items={service.features} />
              <InfoListBlock title="Для каких задач" items={service.useCases} />
          </div>

        </div>
      </section>

      <section className="section section--contact">
        <div className="container contact-grid">
          <div>
            <SectionHeader
              eyebrow="Заявка"
              title={`Обсудить услугу: ${service.shortTitle}`}
              description="Оставьте контакты и приложите файл, если есть техническое задание, проект или спецификация."
            />
          </div>

          <LeadForm
              products={products}
              services={services}
              initialTopic={service.title}
          />
        </div>
      </section>
    </main>
  );
}

export default ServicePage;