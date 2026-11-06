import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { Link } from "react-router-dom";
import { analytics } from "../../analytics/runtime.js";
import { useClientReady } from "../../hooks/useClientReady";

const mobileQuery = "(max-width: 960px)";
const subscribeViewport = (notify) => {
  const query = window.matchMedia(mobileQuery);
  query.addEventListener("change", notify);
  return () => query.removeEventListener("change", notify);
};

export default function CookieBanner() {
  const mobile = useSyncExternalStore(subscribeViewport, () => window.matchMedia(mobileQuery).matches, () => false);
  const ready = useClientReady();
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
  if (!ready || (!opened && choice !== "unknown")) return null;
  return (
    <section className="cookie-banner" aria-labelledby="cookie-banner-title">
      <div className="cookie-banner__content">
        <div className="cookie-banner__copy">
          <h2 id="cookie-banner-title">Помогите нам стать удобнее</h2>
          <p>
            С вашего разрешения мы используем cookies и Яндекс Метрику, чтобы
            понимать, что полезно посетителям, и делать сайт удобнее. Изменить
            выбор можно в настройках cookies внизу сайта.
          </p>
          <details className="cookie-banner__details">
            <summary>Подробнее</summary>
            <p>
              Для аналитики используем Яндекс Метрику. Она включается только после
              вашего разрешения и может использовать cookies и хранилище браузера.
              При разрешении также сохраняются сведения об источниках перехода на
              сайт и отметки учёта целей.
            </p>
            <p>
              Отказ от аналитики не отключает техническое хранение для работы сайта.
              Черновик формы и ответы ОЛ сохраняются в этой вкладке на 24 часа без изменений. Выбранные файлы после обновления нужно прикрепить заново.
            </p>
            <p>
              Изменить решение или отозвать разрешение можно через “Настройки cookies”
              внизу сайта. Этот выбор не заменяет согласия на обработку данных при
              отправке заявки.
            </p>
            <Link to="/privacy#cookies">Подробнее о хранении и обработке данных</Link>
          </details>
          {opened && <p className="cookie-banner__status">Сейчас аналитика: {choice === "allowed" ? "разрешена" : "выключена"}.</p>}
        </div>
        <div className="cookie-banner__actions">
          {(mobile ? ["denied", "allowed"] : ["allowed", "denied"]).map((value) => (
            <button key={value} className={value === "allowed" ? "cookie-banner__accept" : "cookie-banner__decline"}
              ref={value === "allowed" ? accept : undefined} type="button" onClick={() => choose(value)}>
              {value === "allowed" ? "Разрешить аналитику" : "Без аналитики"}
            </button>
          ))}
          {opened && choice !== "unknown" && <button type="button" onClick={() => { setOpened(false); returnFocus.current?.focus(); }}>Закрыть</button>}
        </div>
      </div>
    </section>
  );
}
