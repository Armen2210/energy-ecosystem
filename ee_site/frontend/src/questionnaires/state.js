import { leadDraft } from "../api/leadDraft.js";
import {
  initialQuestionnaire,
  validateQuestionnaires,
  contract,
} from "./domain.js";
export function updateQuestionnaire(product, patch, { content = true } = {}) {
  const d = leadDraft.get();
  if (!Object.hasOwn(contract.products, product)) return;
  if (d.submitting) return;
  const q = d.questionnaires[product] || initialQuestionnaire();
  const questionnaires = { ...d.questionnaires, [product]: { ...q, ...patch } };
  const questionnaireErrors =
    content && Object.keys(d.questionnaireErrors).length
      ? validateQuestionnaires(questionnaires)
      : d.questionnaireErrors;
  leadDraft.update({ questionnaires, questionnaireErrors }, { content });
}
export function openQuestionnaire(product, products) {
  const d = leadDraft.get();
  if (!Object.hasOwn(contract.products, product)) return;
  if (d.submitting) return;
  const item = products.find((p) => p.slug === product);
  if (item)
    leadDraft.update(
      { started: true, topic: item.formTitle || item.title },
      { content: false },
    );
  updateQuestionnaire(product, { expanded: true }, { content: false });
}
export function openFirstError(errors, products) {
  const key = Object.keys(errors)[0];
  if (!key) return;
  const [product, sheet] = key.split(".");
  if (!Object.hasOwn(contract.products, product)) {
    leadDraft.update({ questionnaireErrors: errors }, { content: false });
    return;
  }
  openQuestionnaire(product, products);
  updateQuestionnaire(product, { sheet, expanded: true }, { content: false });
  leadDraft.update(
    { questionnaireErrors: errors, questionnaireFocus: key },
    { content: false },
  );
}

export function selectedProduct(draft, products, initialTopic) {
  const topic = draft.started ? draft.topic : initialTopic;
  return products.find((p) => (p.formTitle || p.title) === topic)?.slug;
}
