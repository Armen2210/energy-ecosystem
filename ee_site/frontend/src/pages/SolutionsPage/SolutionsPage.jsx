// =========================================================
// SOLUTIONS PAGE / ПРОДУКЦИЯ И РЕШЕНИЯ
// Страница продуктовых направлений компании.
// =========================================================

import ProductCard from "../../components/ProductCard";
import SectionHeader from "../../components/SectionHeader";
import { products } from "../../data/products";

function SolutionsPage() {
  return (
    <main>
      <section className="section">
        <div className="container">
          <SectionHeader
            eyebrow="Продукция"
            title="Инженерные решения под задачи объекта"
            description="Продуктовые направления Энергоэффект: БМК, БТП, ВНС, ПНС, шкафы управления и автоматизации."
          />

          <div className="product-grid">
            {products.map((product, index) => (
              <ProductCard product={product} index={index} key={product.slug} />
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

export default SolutionsPage;