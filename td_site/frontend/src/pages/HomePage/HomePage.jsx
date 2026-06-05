// =====================================================
// HomePage сайта ТД «Энергоэффект»
//
// Главная посадочная страница сайта.
//
// Задачи:
// - объяснить роль ТД в экосистеме;
// - показать сценарии комплексной поставки;
// - направить пользователя к заявке;
// - дать доверие через кейсы, FAQ и процесс работы.
//
// Важно:
// главная страница постепенно приводится к логике сайта ЭЭ:
// основные пункты навигации должны вести по секциям главной,
// а отдельные страницы остаются для SEO, privacy и самостоятельных разделов.
// =====================================================

import Header from "../../components/Header"
import Seo from "../../components/Seo"
import Hero from "../../components/Hero"
import DirectionsBlock from "../../components/DirectionsBlock"
import WorkSteps from "../../components/WorkSteps"
import ExpertiseSection from "../../components/ExpertiseSection"
import EcosystemSection from "../../components/EcosystemSection"
import CasesPreview from "../../components/CasesPreview"
import FaqSection from "../../components/FaqSection"
import LeadForm from "../../components/LeadForm"


function HomePage() {
  // =====================================================
  // Скролл к форме заявки
  //
  // Используем JS-скролл вместо обычного href="#contacts",
  // чтобы поведение было стабильнее внутри React SPA.
  // =====================================================
  const scrollToContacts = (event) => {
    event.preventDefault()

    const contactsSection = document.getElementById("contacts")

    if (!contactsSection) {
      return
    }

    contactsSection.scrollIntoView({
      behavior: "smooth",
      block: "start",
    })
  }

  return (
    <>
      <Seo
        title="ТД Энергоэффект — комплектация инженерных объектов"
        description="Комплектация инженерных объектов, подбор оборудования, поставка инженерных решений и сопровождение проектов."
        path="/"
      />

      <Header />

      <main>
        <Hero />

        {/* =====================================================
            НАПРАВЛЕНИЯ / МАРШРУТ ПОЛЬЗОВАТЕЛЯ
        ===================================================== */}
        <div id="directions">
          <DirectionsBlock />
        </div>

        {/* =====================================================
            ПРОЦЕСС РАБОТЫ
        ===================================================== */}
        <div id="process">
          <WorkSteps />
        </div>

        {/* =====================================================
            ИНЖЕНЕРНАЯ ЭКСПЕРТИЗА
        ===================================================== */}
        <ExpertiseSection />

        {/* =====================================================
            ЭКОСИСТЕМА
        ===================================================== */}
        <div id="solutions">
          <EcosystemSection />
        </div>

        {/* =====================================================
            КЕЙСЫ / ТИПОВЫЕ ЗАДАЧИ
        ===================================================== */}
        <div id="cases">
          <CasesPreview />
        </div>

        {/* =====================================================
            FAQ
        ===================================================== */}
        <div id="faq">
          <FaqSection />
        </div>

        {/* =====================================================
            КОНТАКТЫ / ФОРМА ЗАЯВКИ
        ===================================================== */}
        <div id="contacts">
          <LeadForm />
        </div>
      </main>
    </>
  )
}

export default HomePage