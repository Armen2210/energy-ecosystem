// =========================================================
// PRODUCT PAGE / СТРАНИЦА ПРОДУКТА
// Универсальная страница продуктового направления.
// Позже будет открываться по маршрутам:
// /solutions/bmk, /solutions/btp, /solutions/vns, /solutions/pns,
// /solutions/automation-cabinets
// =========================================================

import { useParams } from "react-router-dom";

import AiSummary from "../../components/AiSummary";
import InfoListBlock from "../../components/InfoListBlock";
import LeadForm from "../../components/LeadForm";
import SectionHeader from "../../components/SectionHeader";
import TrustBlock from "../../components/TrustBlock";
import { products } from "../../data/products";
import { services } from "../../data/services";

function ProductPage() {
  const { slug } = useParams();
  const product = products.find((item) => item.slug === slug);

  if (!product) {
    return (
      <main>
        <section className="section">
          <div className="container">
            <SectionHeader
              eyebrow="Продукция"
              title="Направление не найдено"
              description="Проверьте адрес страницы или вернитесь к списку продуктовых направлений."
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
            eyebrow={product.shortTitle}
            title={product.title}
            description={product.description}
          />

          <AiSummary
            title={`${product.title}: кратко`}
            items={[
              "Производственное направление ООО «Энергоэффект».",
              "Решение подбирается под требования объекта и условия эксплуатации.",
              "Для расчёта можно отправить заявку, ТЗ, проект или спецификацию.",
            ]}
          />

          <TrustBlock
              title="Что получает заказчик"
              items={[
                {
                  title: "Решение под объект",
                  description:
                    "Подбор и производство выполняются с учётом параметров объекта, проекта и условий эксплуатации.",
                },
                {
                  title: "Инженерная логика",
                  description:
                    "Смотрим не только на изделие, а на работу всей инженерной системы.",
                },
                {
                  title: "Готовность к заявке",
                  description:
                    "Можно отправить ТЗ, проект или спецификацию для первичной оценки задачи.",
                },
              ]}
          />

          <div className="info-list-grid">
              <InfoListBlock title="Особенности решения" items={product.features} />
              <InfoListBlock title="Где применяется" items={product.useCases} />
          </div>

        </div>
      </section>

      <section id="lead-form" className="section section--contact">
        <div className="container contact-grid">
          <div>
            <SectionHeader
              eyebrow="Заявка"
              title={`Обсудить направление: ${product.shortTitle}`}
              description="Оставьте контакты и приложите файл, если есть техническое задание, проект или спецификация."
            />
          </div>

          <LeadForm
              products={products}
              services={services}
              initialTopic={product.title}
          />
        </div>
      </section>
    </main>
  );
}

export default ProductPage;