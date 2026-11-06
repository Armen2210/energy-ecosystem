import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { leadDraft } from "../api/leadDraft.js";
import { selectedProduct } from "./state.js";
import QuestionnaireHeader from "./QuestionnaireHeader.jsx";
import { retryQuestionnaireBackend, useQuestionnaireBackend } from "./capabilities.js";
import { useViewportAnchor } from "./useViewportAnchor.js";
import { initialQuestionnaire, contract } from "./domain.js";

// Keep one store/contract/validator. The deferred module contains field rendering only.
export default function DeferredQuestionnaireEditor(props) {
  const draft = useSyncExternalStore(
    leadDraft.subscribe,
    leadDraft.get,
    leadDraft.getServerSnapshot,
  );
  const product = selectedProduct(draft, props.products, props.initialTopic);
  const supported = Object.hasOwn(contract.products, product);
  const target = useRef(null);
  const anchor = useViewportAnchor();
  const backend = useQuestionnaireBackend(supported);
  const q = draft.questionnaires[product] || initialQuestionnaire();
  const [near, setNear] = useState(false);
  const [Editor, setEditor] = useState(null);
  const [error, setError] = useState(false);
  const needed =
    supported && backend === "ready" && (near || !!draft.questionnaires[product]?.enabled);
  useEffect(() => {
    if (!target.current || !supported) return;
    if (!("IntersectionObserver" in window)) {
      const frame = requestAnimationFrame(() => setNear(true));
      return () => cancelAnimationFrame(frame);
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(target.current);
    return () => observer.disconnect();
  }, [supported]);
  useEffect(() => {
    if (!needed || Editor) return;
    let current = true;
    import("./QuestionnaireEditor.jsx").then(
      (module) => {
        if (current) {
          setError(false);
          setEditor(() => module.default);
        }
      },
      () => {
        if (current) setError(true);
      },
    );
    return () => {
      current = false;
    };
  }, [needed, Editor]);
  useEffect(() => {
    const header = document.querySelector(".header");
    const panel = target.current;
    if (!header || !panel) return;
    const measure = () => panel.style.setProperty(
      "--ql-sticky-top", `${header.getBoundingClientRect().height}px`,
    );
    measure();
    if (!("ResizeObserver" in window)) return;
    const observer = new ResizeObserver(measure);
    observer.observe(header, { box: "border-box" });
    return () => observer.disconnect();
  }, [supported]);
  if (!supported) return (
    <p className="ql-unavailable">
      Для выбранного направления электронный бланк не предусмотрен. Ранее включённые ОЛ доступны в составе заявки.
    </p>
  );
  return (
    <section
      ref={target}
      className={"ql-panel" + (!q.enabled ? " ql-panel--off" : "") + (!q.expanded ? " ql-panel--collapsed" : "")}
      aria-label={"Опросный лист " + contract.products[product].title}
    >
      <QuestionnaireHeader product={product} backend={backend} draft={draft} anchor={anchor} />
      {backend === "ready" && Editor ? <Editor {...props} /> : (
        <div className="ql-unavailable" role="status" aria-live="polite">
          {backend !== "ready" ? (
            backend === "loading"
              ? "Проверяем доступность электронных опросных листов…"
              : (
                  <>
                    Электронные опросные листы временно недоступны. Сохранённые ответы не удалены.{" "}
                    <button type="button" className="lead-form__clear" onClick={retryQuestionnaireBackend}>
                      Проверить снова
                    </button>
                  </>
                )
          ) : error ? (
            <>
              Не удалось загрузить файл редактора. Для новой попытки обновите страницу.
              Включённые ОЛ остаются в составе заявки и не будут исключены из отправки.{" "}
              {draft.storageNotice.includes("недоступно") || draft.storageNotice.includes("Не удалось")
                ? "Хранилище недоступно: обновление может удалить ответы и контакты. Сначала скопируйте их."
                : "Ответы и контакты сохраняются в этой вкладке на 24 часа без изменений. После обновления подтвердите согласие и выберите файлы заново."}{" "}
              <button type="button" className="lead-form__clear" onClick={() => window.location.reload()}>
                Обновить страницу
              </button>
            </>
          ) : needed ? "Загружаем редактор опросного листа…" : "Электронный опросный лист доступен ниже."}
        </div>
      )}
      {(backend === "unavailable" || error) && Object.values(draft.questionnaires).some((sheet) => sheet.enabled) && (
        <div className="ql-unavailable">
          Можно скачать Excel/PDF выше или отправить обычную заявку.
          Включённые ОЛ не будут исключены автоматически.
          <button type="button" className="lead-form__clear" disabled={draft.submitting || draft.indeterminate} onClick={() => {
            const current = leadDraft.get();
            if (current.submitting || current.indeterminate) return;
            if (!window.confirm("Исключить все электронные ОЛ из отправки? Ответы, контакты и выбранные файлы останутся в черновике. Для отправки останутся обычная заявка и прикреплённые файлы.")) return;
            leadDraft.update({
              questionnaires: Object.fromEntries(Object.entries(current.questionnaires).map(([key, sheet]) => [key, { ...sheet, enabled: false }])),
              questionnaireErrors: {},
              status: "idle",
              message: "Электронные ОЛ исключены из отправки. Ответы сохранены в черновике; обычная заявка и выбранные файлы остаются.",
            });
          }}>
            Исключить ОЛ и оставить обычную заявку
          </button>
        </div>
      )}
    </section>
  );
}
