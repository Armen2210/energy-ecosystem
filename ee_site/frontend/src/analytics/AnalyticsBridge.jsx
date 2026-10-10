import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { analytics } from "./runtime.js";
import { CASES, pageParams } from "./policy.js";

export default function AnalyticsBridge() {
  const location = useLocation();
  useEffect(() => {
    // All page Seo effects complete before this task. StrictMode cancels its first task.
    const task = setTimeout(() => {
      const background = location.state?.backgroundLocation;
      const slug = location.pathname.split("/")[2];
      analytics.visit({ path: (background || location).pathname, search: (background || location).search,
        title: document.title, key: location.key, modal: background && CASES.includes(slug) ? slug : null });
    }, 0);
    return () => clearTimeout(task);
  }, [location]);
  useEffect(() => {
    function click(event) {
      const target = event.target.closest?.("a,button");
      if (!target) return;
      const href = target.getAttribute("href") || "";
      const placement = target.closest("header") ? "header" : target.closest("footer") ? "footer" : "contacts";
      const params = { ...pageParams(location.state?.backgroundLocation?.pathname || location.pathname), placement };
      if (href.startsWith("tel:")) analytics.goal("contact_phone_click", params);
      if (href.startsWith("mailto:")) analytics.goal("contact_email_click", params);
      if (target.dataset.analyticsCta) analytics.goal("calculation_cta_click", { ...params, placement: target.dataset.analyticsCta, case: target.dataset.analyticsCase });
    }
    document.addEventListener("click", click);
    return () => document.removeEventListener("click", click);
  }, [location]);
  return null;
}
