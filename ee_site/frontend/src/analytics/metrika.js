import { COUNTER_ID } from "./policy.js";

// The counter must run in the page itself to record page interactions.
// Sensitive application regions carry ym-hide-content / ym-disable-keys.
export function installMetrika(win, doc, { ready, failed }) {
  let active = true;
  let initialized = false;
  const script = doc.createElement("script");
  if (!win.ym) {
    win.ym = function () { (win.ym.a = win.ym.a || []).push(arguments); };
    win.ym.l = Date.now();
  }
  script.async = true;
  script.src = "https://mc.yandex.ru/metrika/tag.js";
  script.referrerPolicy = "no-referrer";
  script.onerror = () => { if (active) failed(); };
  script.onload = () => {
    if (!active) return;
    try {
      win.ym(COUNTER_ID, "init", {
        defer: true, webvisor: true, clickmap: true, trackLinks: false,
        accurateTrackBounce: true, ecommerce: false, triggerEvent: false,
        trackHash: false, disableYtm: true,
      });
      initialized = true;
      ready();
    } catch { failed(); }
  };
  doc.head.append(script);
  return {
    send(data) {
      if (!active || !initialized) return false;
      if (data.type === "hit") win.ym(COUNTER_ID, "hit", data.url, { title: data.title, referer: data.referrer });
      if (data.type === "goal") win.ym(COUNTER_ID, "reachGoal", data.name, data.params);
      return true;
    },
    stop() {
      active = false;
      script.onload = script.onerror = null;
      try { if (initialized) win.ym?.(COUNTER_ID, "destruct"); } catch { /* reload also stops vendor code */ }
      script.remove();
    },
  };
}
