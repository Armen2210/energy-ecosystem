// One memory-only draft per document. Never serialize fields or File objects.
const empty = () => ({
  fields: { name: '', company_name: '', phone: '', email: '', description: '', consent: false },
  topic: '', sourcePage: '', started: false, files: [], fileError: '',
  successToken: null, hiding: false, submitting: false, status: 'idle', message: '', submission: null, snapshot: null, retryIds: [],
});
let draft = empty();
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
  subscribe(listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  update(patch) {
    if (Object.hasOwn(patch, 'status') || Object.hasOwn(patch, 'message')) patch = messagePatch(patch);
    draft = { ...draft, ...patch };
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
    notify();
  },
};
