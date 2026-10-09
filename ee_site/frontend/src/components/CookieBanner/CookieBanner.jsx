import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { analytics } from "../../analytics/runtime.js";

export default function CookieBanner() {
  const choice = useSyncExternalStore(analytics.subscribe, analytics.getChoice, () => "unknown");
  const [opened, setOpened] = useState(false);
  const accept = useRef(null);
  const returnFocus = useRef(null);
  useEffect(() => {
    function open() {
      returnFocus.current = document.activeElement;
      setOpened(true);
      setTimeout(() => accept.current?.focus(), 0);
    }
    window.addEventListener("ee:analytics-settings", open);
    return () => window.removeEventListener("ee:analytics-settings", open);
  }, []);
  function choose(next) {
    analytics.choose(next);
    setOpened(false);
    returnFocus.current?.focus();
  }
  if (!opened && choice !== "unknown") return null;
  return (
    <section className="cookie-banner" aria-label="Настройки аналитики">
      <div className="cookie-banner__content">
        <p>
          Яндекс Метрика помогает оценивать посещения и обращения. Аналитика
          выключена до вашего разрешения. Выбор не влияет на работу сайта и
          отправку заявки. Изменить его можно в «Настройках аналитики» внизу сайта.
          {opened && <strong> Сейчас: {choice === "allowed" ? "разрешена" : "выключена"}.</strong>}
        </p>
        <div className="cookie-banner__actions">
          <Link to="/privacy#cookies">Подробнее</Link>
          <button ref={accept} type="button" onClick={() => choose("allowed")}>Разрешить аналитику</button>
          <button type="button" onClick={() => choose("denied")}>Без аналитики</button>
          {opened && choice !== "unknown" && <button type="button" onClick={() => { setOpened(false); returnFocus.current?.focus(); }}>Закрыть</button>}
        </div>
      </div>
    </section>
  );
}
