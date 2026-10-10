import { useContext, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { SeoLocationContext } from "./location";
import { cases } from "../../data/cases";

const SITE_URL = "https://www.energoeffekt-rostov.ru";
const DEFAULT_TITLE = "Энергоэффект — инженерная производственная платформа";
const DEFAULT_DESCRIPTION =
  "Энергоэффект проектирует и производит БМК, БТП, ВНС, ПНС, шкафы управления и автоматизации, а также выполняет проектирование, СМР и пусконаладку инженерных объектов.";

function setMeta(key, value, attribute = "name") {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", value);
}

function Seo({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  path = "/",
  robots = "index, follow",
}) {
  const routeLocation = useLocation();
  const { pathname, state } = useContext(SeoLocationContext) || routeLocation;
  const modalCase = state?.backgroundLocation
    ? cases.find((item) => item.hasDetailPage && item.url === pathname)
    : null;
  const pageTitle = modalCase?.seo.title ?? title;
  const pageDescription = modalCase?.seo.description ?? description;
  const pagePath = modalCase?.url ?? path;

  useEffect(() => {
    const pageUrl = pagePath === null ? null : `${SITE_URL}${pagePath}`;
    document.title = pageTitle;
    setMeta("description", pageDescription);
    setMeta("robots", robots);
    setMeta("og:type", "website", "property");
    setMeta("og:title", pageTitle, "property");
    setMeta("og:description", pageDescription, "property");
    setMeta("og:image", `${SITE_URL}/og-image.jpg`, "property");
    setMeta("og:locale", "ru_RU", "property");
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", pageTitle);
    setMeta("twitter:description", pageDescription);
    setMeta("twitter:image", `${SITE_URL}/og-image.jpg`);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (pageUrl) {
      if (!canonical) {
        canonical = document.createElement("link");
        canonical.setAttribute("rel", "canonical");
        document.head.appendChild(canonical);
      }
      canonical.setAttribute("href", pageUrl);
      setMeta("og:url", pageUrl, "property");
    } else {
      canonical?.remove();
      document.head.querySelector('meta[property="og:url"]')?.remove();
    }
    // The background page stays mounted when a case modal opens/closes.
    // A pathname change must reapply its tags even when props are unchanged.
  }, [pageTitle, pageDescription, pagePath, robots, pathname]);

  return null;
}

export default Seo;
