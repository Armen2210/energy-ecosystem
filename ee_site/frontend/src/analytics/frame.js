import { COUNTER_ID, GOALS, ORIGIN, campaign, permittedEnvironment, safeParams, safePath, safeReferrer } from "./policy.js";

// A clean document, no form DOM/referrer. Opening/embedding this file alone
// never loads the library: a guarded, same-origin consent handshake is required.
let active = false, started = false;
const generation = Number(new URLSearchParams(location.hash.slice(1)).get("g"));
const send = type => parent.postMessage({ eeAnalytics: true, generation, type }, location.origin);
function stop() {
  active = false;
  try { window.ym?.(COUNTER_ID, "destruct"); } catch { /* parent also destroys context */ }
}
window.eeAnalyticsStop = stop;
function start() {
  if (started || window === parent || !permittedEnvironment(import.meta.env.PROD, import.meta.env.VITE_EE_ANALYTICS_ENABLED, location)) return;
  started = true;
  active = true;
  window.ym = function () { if (active) (window.ym.a = window.ym.a || []).push(arguments); };
  window.ym.l = Date.now();
  const script = document.createElement("script");
  script.async = true;
  script.src = "https://mc.yandex.ru/metrika/tag.js";
  script.referrerPolicy = "no-referrer";
  script.onerror = () => { stop(); send("failed"); };
  script.onload = () => {
    if (!active) return;
    try {
      window.ym(COUNTER_ID, "init", {
        defer: true, clickmap: false, trackLinks: false, accurateTrackBounce: false,
        webvisor: false, ecommerce: false, triggerEvent: false, trackHash: false,
        disableYtm: true,
      });
      send("ready");
    } catch { stop(); send("failed"); }
  };
  document.head.append(script);
}
window.addEventListener("message", event => {
  const data = event.data;
  if (event.source !== parent || event.origin !== location.origin || data?.eeAnalytics !== true || data.generation !== generation) return;
  if (data.type === "start") { start(); return; }
  if (!active) return;
  try {
    if (data.type === "hit") {
      const url = new URL(data.url);
      const tags = campaign(url.search);
      const safe = ORIGIN + safePath(url.pathname) + (tags ? `?${new URLSearchParams(tags)}` : "");
      document.title = String(data.title).slice(0, 200);
      window.ym(COUNTER_ID, "hit", safe, { title: document.title, referer: safeReferrer(data.referrer) });
    } else if (data.type === "goal" && GOALS.includes(data.name)) {
      window.ym(COUNTER_ID, "reachGoal", data.name, safeParams(data.params));
    }
  } catch { /* Analytics must never affect the parent app. */ }
});
