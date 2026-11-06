import { useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router-dom";
import { analytics } from "../../analytics/runtime.js";
import { useClientReady } from "../../hooks/useClientReady";

export default function CookieBanner() {
  const { pathname } = useLocation();
  const ready = useClientReady();
  const choice = useSyncExternalStore(analytics.subscribe, analytics.getChoice, () => "unknown");
  const calltouch = analytics.calltouchAvailable();
  const needsChoice = useSyncExternalStore(analytics.subscribe, analytics.needsCalltouchChoice, () => false);
  if (!ready || (choice !== "unknown" && !needsChoice) || pathname === "/privacy") return null;

  return (
    <section className="cookie-banner" aria-label="Файлы cookies и аналитика">
      <div className="cookie-banner__content">
        <p>Мы используем cookies для работы сайта. Нажимая «Понятно», вы соглашаетесь на использование {calltouch ? "Яндекс Метрики и Calltouch" : "Яндекс Метрики"}.</p>
        <div className="cookie-banner__actions">
          <Link to="/privacy#cookies">Подробнее и настройки</Link>
          <button type="button" onClick={() => analytics.choose("allowed")}>Понятно</button>
        </div>
      </div>
    </section>
  );
}
