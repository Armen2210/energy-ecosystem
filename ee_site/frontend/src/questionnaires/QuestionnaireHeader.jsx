import { documents } from "../data/documents.js";
import { contract, initialQuestionnaire } from "./domain.js";
import { updateQuestionnaire } from "./state.js";
import { QuestionnaireSwitch } from "./QuestionnaireControls.jsx";

// This shell belongs to the initial page bundle and prerender, not the deferred
// field renderer. Downloads never depend on backend or editor availability.
export default function QuestionnaireHeader({ product, backend, draft, anchor }) {
  const q = draft.questionnaires[product] || initialQuestionnaire();
  const definition = contract.products[product];
  const document = documents.find(
    (item) => item.categoryId === "questionnaires" && item.productSlug === product,
  );
  const unavailable = backend !== "ready";
  return (
    <header className="ql-header">
      <strong>Опросный лист {definition.title}</strong>
      <div className="ql-online">
        {q.enabled ? (
          <small>Включён в заявку</small>
        ) : (
          <button
            type="button"
            className="ql-online-action"
            disabled={unavailable || draft.submitting}
            onClick={(event) => {
              anchor(event.currentTarget.closest(".ql-header"));
              updateQuestionnaire(product, { enabled: true, expanded: true });
            }}
          >
            {backend === "loading"
              ? "Проверяем доступность…"
              : unavailable
                ? "Онлайн-заполнение недоступно"
                : "Заполнить онлайн →"}
          </button>
        )}
      </div>
      <div className="ql-mobile">
        <QuestionnaireSwitch product={product} beforeChange={anchor} />
        <button
          type="button"
          className="ql-expand"
          aria-label={q.expanded ? "Свернуть опросный лист" : "Раскрыть опросный лист"}
          aria-expanded={q.expanded}
          disabled={draft.submitting || unavailable}
          onClick={(event) => {
            anchor(event.currentTarget.closest(".ql-header"));
            updateQuestionnaire(product, { expanded: !q.expanded }, { content: false });
          }}
        >
          <span className="faq__chevron" aria-hidden="true" />
        </button>
      </div>
      {!!document?.files.length && (
        <div className="ql-downloads">
          <span className="ql-downloads__desktop">Или скачать:</span>
          <span className="ql-downloads__mobile">Или скачать бланк:</span>{" "}
          {document.files.map((file, index) => {
            const label = file.format === "xlsx" ? "Excel" : file.format.toUpperCase();
            const opens = file.behavior === "open";
            return (
              <span key={file.url}>
                {index > 0 && <span aria-hidden="true"> · </span>}
                <a
                  href={file.url}
                  download={opens ? undefined : ""}
                  target={opens ? "_blank" : undefined}
                  rel={opens ? "noopener noreferrer" : undefined}
                  aria-label={`${opens ? "Открыть" : "Скачать"} бланк ${definition.title} — ${label}`}
                >
                  {label}
                </a>
              </span>
            );
          })}
        </div>
      )}
    </header>
  );
}
