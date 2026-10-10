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
    <section className="cookie-banner" aria-labelledby="cookie-banner-title">
      <div className="cookie-banner__content">
        <h2 id="cookie-banner-title">Cookies и аналитика</h2>
        <p>
          Сайт сохраняет ваши настройки и использует техническое хранилище для
          работы формы заявки. С вашего разрешения мы также подключаем аналитику,
          чтобы улучшать сайт. Отказ не мешает пользоваться сайтом и отправлять заявки.
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
            Поля формы и выбранные файлы в хранилище браузера не сохраняются.
          </p>
          <p>
            Изменить решение или отозвать разрешение можно через “Настройки cookies”
            внизу сайта. Этот выбор не заменяет согласия на обработку данных при
            отправке заявки.
          </p>
          <Link to="/privacy#cookies">Подробнее о хранении и обработке данных</Link>
        </details>
        {opened && <p className="cookie-banner__status">Сейчас аналитика: {choice === "allowed" ? "разрешена" : "выключена"}.</p>}
        <div className="cookie-banner__actions">
          <button ref={accept} type="button" onClick={() => choose("allowed")}>Разрешить</button>
          <button type="button" onClick={() => choose("denied")}>Без аналитики</button>
          {opened && choice !== "unknown" && <button type="button" onClick={() => { setOpened(false); returnFocus.current?.focus(); }}>Закрыть</button>}
        </div>
      </div>
    </section>
  );
}
