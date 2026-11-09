import { useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router-dom";
import { analytics } from "../../analytics/runtime.js";
import { useClientReady } from "../../hooks/useClientReady";

export default function CookieBanner() {
  const { pathname } = useLocation();
  const ready = useClientReady();
  const choice = useSyncExternalStore(analytics.subscribe, analytics.getChoice, () => "unknown");
  const calltouch = analytics.calltouchAvailable();
  if (!ready || choice !== "unknown" || pathname === "/privacy") return null;

  return (
    <section className="cookie-banner" aria-label="Файлы cookies и аналитика">
      <div className="cookie-banner__content">
        <p>
          Мы используем cookies для работы сайта и повышения удобства его использования.
          Управлять cookies и аналитикой можно через «Настройки cookies» внизу сайта.
        </p>
        <div className="cookie-banner__actions">
          <details className="cookie-banner__details">
            <summary>
              <span className="cookie-banner__more">Подробнее</span>
              <span className="cookie-banner__less">Скрыть</span>
            </summary>
            <div className="cookie-banner__explanation">
              <p>
                Техническое хранение помогает сайту работать и сохранять черновик заявки.
                При открытии сайта работает {calltouch ? "аналитика Яндекс Метрики и Calltouch" : "Яндекс Метрика"} для
                оценки посещений и источников обращений.
              </p>
              <Link to="/privacy#cookies">Политика обработки данных</Link>
            </div>
          </details>
          <button className="cookie-banner__accept" type="button" onClick={() => analytics.choose("allowed")}>
            Принять
          </button>
        </div>
      </div>
    </section>
  );
}
