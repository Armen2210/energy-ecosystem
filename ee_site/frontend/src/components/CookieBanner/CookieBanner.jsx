import { useSyncExternalStore } from "react";
import { Link, useLocation } from "react-router-dom";
import { analytics } from "../../analytics/runtime.js";
import { useClientReady } from "../../hooks/useClientReady";

export default function CookieBanner({ settingsRef }) {
  const { pathname } = useLocation();
  const ready = useClientReady();
  const choice = useSyncExternalStore(analytics.subscribe, analytics.getChoice, () => "unknown");
  const calltouch = analytics.calltouchAvailable();
  const needsChoice = useSyncExternalStore(analytics.subscribe, analytics.needsCalltouchChoice, () => false);
  if (!ready) return null;

  const showBanner = (choice === "unknown" || needsChoice) && pathname !== "/privacy";
  const services = calltouch ? "Яндекс Метрику и Calltouch" : "Яндекс Метрику";
  function choose(next) {
    analytics.choose(next);
    settingsRef.current?.close();
  }

  return (
    <>
    {showBanner && <section className="cookie-banner" aria-label="Файлы cookies и аналитика">
      <div className="cookie-banner__content">
        <p>Мы используем cookies для работы сайта. Нажимая «Понятно», вы соглашаетесь на использование {calltouch ? "Яндекс Метрики и Calltouch" : "Яндекс Метрики"}.</p>
        <div className="cookie-banner__actions">
          <button className="cookie-banner__settings" type="button" onClick={() => settingsRef.current?.showModal()}>Подробнее и настройки</button>
          <button type="button" onClick={() => analytics.choose("allowed")}>Понятно</button>
        </div>
      </div>
    </section>}
    <dialog className="cookie-settings" ref={settingsRef} aria-labelledby="cookie-settings-title">
      <h2 id="cookie-settings-title">Настройки cookies</h2>
      <button className="cookie-settings__close" type="button" aria-label="Закрыть настройки cookies"
        onClick={() => settingsRef.current?.close()}>×</button>
      <p>Технические cookies помогают сайту работать. С вашего согласия мы также используем {services} для аналитики.</p>
      {needsChoice && <p>Метрика уже разрешена. Для Calltouch нужен новый выбор.</p>}
      <Link to="/privacy#cookies" target="_blank" rel="noopener noreferrer">Политика обработки данных (новая вкладка)</Link>
      <div className="cookie-preferences__actions">
        <button type="button" onClick={() => choose("allowed")}>Включить аналитику</button>
        <button type="button" onClick={() => choose("denied")}>Без аналитики</button>
      </div>
    </dialog>
    </>
  );
}
