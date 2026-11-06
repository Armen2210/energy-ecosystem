import { useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router-dom";
import { analytics } from "../../analytics/runtime.js";
import { useClientReady } from "../../hooks/useClientReady";

export default function CookieBanner() {
  const { pathname } = useLocation();
  const ready = useClientReady();
  const choice = useSyncExternalStore(analytics.subscribe, analytics.getChoice, () => "unknown");
  if (!ready || choice !== "unknown" || pathname === "/privacy") return null;

  return (
    <section className="cookie-banner" aria-label="Файлы cookies и аналитика">
      <div className="cookie-banner__content">
        <p>С вашего разрешения мы используем cookies и Яндекс Метрику, чтобы улучшать сайт.</p>
        <div className="cookie-banner__actions">
          <Link to="/privacy#cookies">Подробнее и настройки</Link>
          <button type="button" onClick={() => analytics.choose("allowed")}>Разрешить аналитику</button>
        </div>
      </div>
    </section>
  );
}
