import { useSyncExternalStore } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { leadDraft } from "../api/leadDraft.js";
import { contract, validateQuestionnaires } from "./domain.js";
import { updateQuestionnaire, openQuestionnaire } from "./state.js";
import { useQuestionnaireBackend } from "./capabilities.js";
import "./QuestionnaireEditor.css";
export function QuestionnaireSwitch({ product }) {
  const backend = useQuestionnaireBackend(
    Object.hasOwn(contract.products, product),
  );
  const draft = useSyncExternalStore(
    leadDraft.subscribe,
    leadDraft.get,
    leadDraft.getServerSnapshot,
  );
  if (backend !== "ready" || !contract.products[product]) return null;
  const enabled = !!draft.questionnaires[product]?.enabled;
  return (
    <button
      type="button"
      className="ql-switch"
      role="switch"
      aria-label="Электронный опросный лист"
      aria-checked={enabled}
      disabled={draft.submitting}
      onClick={() =>
        updateQuestionnaire(product, {
          enabled: !enabled,
          expanded: !enabled,
        })
      }
    >
      <span className="ql-switch__track" aria-hidden="true">
        <span />
      </span>
      <span>
        Электронный опросный лист
        <small>{enabled ? "Включён" : "Выключен"}</small>
      </span>
    </button>
  );
}
export function QuestionnaireSummary({ products }) {
  const navigate = useNavigate();
  const location = useLocation();
  const d = useSyncExternalStore(
    leadDraft.subscribe,
    leadDraft.get,
    leadDraft.getServerSnapshot,
  );
  const included = Object.entries(d.questionnaires).filter(
    ([, q]) => q.enabled,
  );
  if (!included.length) return null;
  const errors = validateQuestionnaires(d.questionnaires);
  return (
    <div className="ql-summary">
      <strong>ОЛ в заявке:</strong>
      <div>
        {included.map(([p]) => (
          <button
            key={p}
            type="button"
            disabled={d.submitting}
            title={"Редактировать опросный лист " + contract.products[p].title}
            onClick={() => {
              openQuestionnaire(p, products);
              if (!/^\/solutions\/[^/]+$/.test(location.pathname))
                navigate(`/solutions/${p}#lead-form`);
            }}
          >
            {contract.products[p].title} ·{" "}
            {Object.keys(errors).some((k) => k.startsWith(p + "."))
              ? "Не заполнен"
              : "Заполнен"}
          </button>
        ))}
      </div>
    </div>
  );
}
