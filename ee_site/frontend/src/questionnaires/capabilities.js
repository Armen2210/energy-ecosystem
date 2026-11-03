import { useCallback, useSyncExternalStore } from "react";
const base = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");
let state = "loading",
  started = false;
const listeners = new Set();
export async function verifyQuestionnaireBackend() {
  const response = await fetch(
    base + "/api/leads/questionnaire-capabilities/",
    { signal: AbortSignal.timeout(8000) },
  );
  const data = await response.json();
  if (
    !response.ok ||
    data.version !== 1 ||
    !data.enabled ||
    !["vns", "pns", "bmk", "btp"].every((p) => data.products?.includes(p))
  )
    throw Error(
      "Электронные опросные листы временно недоступны. Данные сохранены; повторите позже.",
    );
  return data;
}
function subscribe(listener) {
  listeners.add(listener);
  if (!started) {
    started = true;
    verifyQuestionnaireBackend().then(
      () => {
        state = "ready";
        for (const l of listeners) l();
      },
      () => {
        state = "unavailable";
        for (const l of listeners) l();
      },
    );
  }
  return () => listeners.delete(listener);
}
export function useQuestionnaireBackend(active = true) {
  const listen = useCallback(
    (listener) => (active ? subscribe(listener) : () => {}),
    [active],
  );
  return useSyncExternalStore(
    listen,
    () => state,
    () => "loading",
  );
}
