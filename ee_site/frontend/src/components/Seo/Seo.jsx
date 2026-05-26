// =========================================================
// SEO / ДИНАМИЧЕСКИЕ META-ТЕГИ СТРАНИЦ
// Небольшой MVP-компонент без дополнительных библиотек.
// Обновляет title, description, OpenGraph и canonical.
//
// Зачем нужен:
// - отдельные title/description для страниц;
// - усиление SEO, AEO/GEO;
// - подготовка сайта к production без усложнения архитектуры.
// =========================================================

import { useEffect } from "react";

const SITE_URL = "https://energoeffect.ru";
const DEFAULT_TITLE = "Энергоэффект — инженерная производственная платформа";
const DEFAULT_DESCRIPTION =
  "Энергоэффект проектирует и производит БМК, БТП, ВНС, ПНС, шкафы управления и автоматизации, а также выполняет проектирование, СМР и пусконаладку инженерных объектов.";

function updateMetaTag(selector, attributeName, value) {
  const element = document.head.querySelector(selector);

  if (!element || !value) {
    return;
  }

  element.setAttribute(attributeName, value);
}

function updateCanonical(url) {
  const canonical = document.head.querySelector('link[rel="canonical"]');

  if (!canonical || !url) {
    return;
  }

  canonical.setAttribute("href", url);
}

function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
}) {
  useEffect(() => {
    const pageUrl = `${SITE_URL}${path}`;

    document.title = title;

    updateMetaTag('meta[name="description"]', "content", description);
    updateMetaTag('meta[property="og:title"]', "content", title);
    updateMetaTag('meta[property="og:description"]', "content", description);
    updateMetaTag('meta[property="og:url"]', "content", pageUrl);
    updateCanonical(pageUrl);
  }, [title, description, path]);

  return null;
}

export default Seo;