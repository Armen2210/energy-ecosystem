import { DRAFT_KEY, readDraft, saveDraft } from "./leadDraftStorage.js";
// One shared draft. Only serializable answers/contact fields are persisted in this tab.
const empty = () => ({
  fields: { name: '', company_name: '', phone: '', email: '', description: '', consent: false },
  questionnaires: {}, questionnaireErrors: {}, questionnaireFocus: '', changedAt: null, storageNotice: '', indeterminate: false,
  topicPage: '', restoredTopic: false,
  topic: '', sourcePage: '', started: false, files: [], fileError: '',
  successToken: null, hiding: false, submitting: false, status: 'idle', message: '', submission: null, snapshot: null, retryIds: [],
});
let restored = false;
let draft = empty();
function persist() {
  if (typeof window === "undefined" || !draft.changedAt) return;
  try { saveDraft(window.sessionStorage, draft); if (!draft.storageNotice) draft = { ...draft, storageNotice: "Черновик этой вкладки сохраняется на 24 часа без изменений. Файлы после перезагрузки нужно выбрать повторно." }; }
  catch { draft = { ...draft, storageNotice: "Сохранение черновика недоступно. Не закрывайте вкладку до отправки." }; }
}
const serverDraft = empty();
const listeners = new Set();
const presenters = new Set();
let hideTimer, removeTimer;
let timerGeneration = 0;
const notify = () => { for (const listener of listeners) listener(); };
function cancelMessageTimers() {
  timerGeneration += 1;
  clearTimeout(hideTimer);
  clearTimeout(removeTimer);
  hideTimer = removeTimer = null;
}
function messagePatch(patch) {
  cancelMessageTimers();
  presenters.clear();
  return { ...patch, hiding: false, successToken: patch.status === 'success' ? {} : null };
}
export const leadDraft = {
  get: () => draft,
  getServerSnapshot: () => serverDraft,
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  restore() {
    if (typeof window === "undefined" || restored) return;
    restored = true;
    try {
      const saved = readDraft(window.sessionStorage);
      if (saved && !draft.started) {
        draft = { ...draft, fields: { ...saved.fields, consent: false }, topic: saved.topic, topicPage: saved.topicPage || "", restoredTopic: true, sourcePage: saved.sourcePage, started: saved.started, questionnaires: saved.questionnaires, changedAt: saved.changedAt, submission: saved.submission, indeterminate: saved.indeterminate, storageNotice: "Восстановлен черновик этой вкладки. Он удаляется через 24 часа без изменений. Согласие подтвердите заново." + (saved.hadFiles ? " Прикрепите файлы повторно." : "") };
        notify();
      }
    } catch { draft = { ...draft, storageNotice: "Не удалось восстановить черновик. Данные доступны только в открытой форме." }; notify(); }
  },
  enterProduct(topic, page) {
    if (draft.submitting || draft.indeterminate || draft.topicPage === page) return;
    const preserveRestored = draft.restoredTopic && !draft.topicPage;
    leadDraft.update({ ...(preserveRestored ? {} : { topic }), topicPage: page, restoredTopic: false }, { content: false });
  },
  update(patch, { content = true } = {}) {
    if (Object.hasOwn(patch, 'status') || Object.hasOwn(patch, 'message')) patch = messagePatch(patch);
    draft = { ...draft, ...patch };
    const meaningful = ["fields", "files", "questionnaires"].some(k => Object.hasOwn(patch, k));
    if (content && meaningful) draft.changedAt = Date.now();
    persist();
    notify();
  },
  // Register only after React commits the success message. One timer pair per
  // result; the last unmount cancels it and preserves the result for returning.
  presentSuccess(token) {
    if (!token || token !== draft.successToken) return () => {};
    const presenter = {};
    presenters.add(presenter);
    if (hideTimer == null && removeTimer == null) {
      if (draft.hiding) { draft = { ...draft, hiding: false }; notify(); }
      const generation = timerGeneration;
      const current = () => timerGeneration === generation && draft.successToken === token && presenters.size > 0;
      hideTimer = setTimeout(() => {
        if (!current()) return;
        draft = { ...draft, hiding: true };
        notify();
      }, 5000);
      removeTimer = setTimeout(() => {
        if (current()) leadDraft.update({ status: 'idle', message: '' });
      }, 5600);
    }
    return () => {
      presenters.delete(presenter);
      if (presenters.size === 0) cancelMessageTimers();
    };
  },
  reset(patch = {}) {
    draft = { ...empty(), ...messagePatch(patch) };
    try { window.sessionStorage.removeItem(DRAFT_KEY); } catch { draft.storageNotice = "Форма очищена в этой вкладке, но хранилище недоступно: удаление сохранённого черновика не подтверждено."; }
    notify();
  },
};
