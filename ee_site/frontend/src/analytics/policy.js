// Shared by the app and isolated counter frame. Never accept arbitrary URLs/params.
export const COUNTER_ID = 113583806;
export const ORIGIN = "https://www.energoeffekt-rostov.ru";
export const PRODUCTS = ["bmk", "btp", "vns", "pns", "automation-cabinets"];
export const SERVICES = ["design", "construction-installation", "commissioning"];
export const CASES = ["bmk-sports-complex", "btp-food-production", "btp-hotel-complex", "btp-residential-complex", "btp-industrial-facility"];
export const CAMPAIGN_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "yclid"];
export const DAY = 86400000;
export const ATTRIBUTION_DAYS = 30;
export const CONSENT_DAYS = 180;
export const VERSION = 1;
export const KEYS = { consent: "ee_analytics_consent_v1", attribution: "ee_campaign_v1", successes: "ee_goal_success_v1" };
export function permittedEnvironment(production, enabled, location) {
  return production === true && enabled === "true" && location?.protocol === "https:"
    && ["energoeffekt-rostov.ru", "www.energoeffekt-rostov.ru"].includes(location?.hostname);
}
export function safePath(path) {
  if (path === "/contacts") return "/";
  if (["/", "/about", "/solutions", "/services", "/cases", "/privacy"].includes(path)) return path;
  const [, group, slug] = String(path).split("/");
  if (path === `/${group}/${slug}` && ({ solutions: PRODUCTS, services: SERVICES, cases: CASES })[group]?.includes(slug)) return `/${group}/${slug}`;
  return "/404";
}
export function pageParams(path) {
  const safe = safePath(path);
  const [, group, slug] = safe.split("/");
  return { page_category: safe === "/" ? "home" : group,
    ...(slug ? { [group === "solutions" ? "product" : group === "services" ? "service" : "case"]: slug } : {}) };
}
export function campaign(search) {
  const query = new URLSearchParams(search);
  const result = {};
  for (const key of CAMPAIGN_KEYS) {
    if (!query.has(key)) continue;
    const values = query.getAll(key);
    const value = values[0];
    // Controlled campaign codes only, not prose, contacts, URLs or hash values.
    if (values.length !== 1 || !validCampaignValue(key, value)) return null;
    result[key] = value;
  }
  return Object.keys(result).length && JSON.stringify(result).length <= 1024 ? result : null;
}
export function validCampaignValue(key, value) {
  return typeof value === "string" && (key === "yclid"
    ? /^[0-9]{1,32}$/.test(value)
    : /^[a-z][a-z0-9_-]{0,63}$/.test(value) && !/\d{7}/.test(value));
}
export function validTouch(touch, now) {
  return touch && Object.keys(touch).sort().join(",") === "at,tags" && Number.isSafeInteger(touch.at) && touch.at <= now && touch.at > now - ATTRIBUTION_DAYS * DAY
    && touch.tags && typeof touch.tags === "object" && !Array.isArray(touch.tags)
    && Object.keys(touch.tags).length > 0 && Object.keys(touch.tags).every(key => CAMPAIGN_KEYS.includes(key) && validCampaignValue(key, touch.tags[key]))
    && JSON.stringify(touch.tags).length <= 1024;
}
export function validAttribution(value, now) {
  return value?.version === VERSION && Object.keys(value).sort().join(",") === "first,last,version"
    && validTouch(value.first, now) && validTouch(value.last, now) && value.first.at <= value.last.at
    && JSON.stringify(value).length <= 2048;
}
export function safeReferrer(raw) {
  try {
    const url = new URL(raw);
    // A coarse, finite source category; never export an external hostname/path.
    if (["energoeffekt-rostov.ru", "www.energoeffekt-rostov.ru"].includes(url.hostname)) return ORIGIN + safePath(url.pathname);
    if (["yandex.ru", "www.yandex.ru", "yandex.com", "www.yandex.com"].includes(url.hostname)) return "https://yandex.ru/";
    if (["google.com", "www.google.com", "google.ru", "www.google.ru"].includes(url.hostname)) return "https://www.google.com/";
  } catch { /* Missing/malformed referrer is unknown. */ }
  return "";
}
export const GOALS = ["lead_success", "contact_phone_click", "contact_email_click", "lead_form_start", "document_selected", "calculation_cta_click", "case_open"];
export function safeParams(params = {}) {
  if (!params || typeof params !== "object") return {};
  const output = {};
  const lists = { product: PRODUCTS, service: SERVICES, case: CASES,
    placement: ["header", "footer", "contacts", "hero", "case", "form"],
    page_category: ["home", "about", "solutions", "services", "cases", "privacy", "404"],
    document_count: ["1", "2-5", "6-10"] };
  for (const [key, values] of Object.entries(lists)) if (values.includes(params[key])) output[key] = params[key];
  return output;
}
