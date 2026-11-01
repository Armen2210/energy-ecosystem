import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { leadDraft } from "../api/leadDraft.js";
import { selectedProduct } from "./state.js";
import { contract } from "./domain.js";

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
  const [near, setNear] = useState(false);
  const [Editor, setEditor] = useState(null);
  const [error, setError] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const needed =
    supported && (near || !!draft.questionnaires[product]?.enabled);
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
  }, [needed, Editor, attempt]);
  if (Editor) return <Editor {...props} />;
  return (
    <div
      ref={target}
      className="ql-unavailable"
      role="status"
      aria-live="polite"
    >
      {!supported ? (
        "Для выбранного направления электронный бланк не предусмотрен. Ранее включённые ОЛ доступны в составе заявки."
      ) : error ? (
        <>
          Не удалось загрузить редактор. Ответы и данные заявки сохранены;
          включённые ОЛ остаются в составе отправки.{" "}
          <button
            type="button"
            className="lead-form__clear"
            onClick={() => {
              setError(false);
              setAttempt((value) => value + 1);
            }}
          >
            Повторить загрузку
          </button>
        </>
      ) : needed ? (
        "Загружаем редактор опросного листа…"
      ) : (
        "Электронный опросный лист доступен ниже."
      )}
    </div>
  );
}
