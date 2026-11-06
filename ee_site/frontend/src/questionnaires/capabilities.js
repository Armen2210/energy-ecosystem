import { useCallback, useSyncExternalStore } from "react";
const base = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");
let state = "loading",
  started = false;
const listeners = new Set();
export async function verifyQuestionnaireBackend() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  let response, data;
  try {
    response = await fetch(base + "/api/leads/questionnaire-capabilities/", {
      signal: controller.signal,
    });
    data = await response.json();
  } finally {
    clearTimeout(timeout);
  }
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
function publish(next) {
  state = next;
  for (const listener of listeners) listener();
}
function check() {
  started = true;
  verifyQuestionnaireBackend().then(
    () => publish("ready"),
    () => publish("unavailable"),
  );
}
export function retryQuestionnaireBackend() {
  if (state !== "unavailable") return;
  publish("loading");
  check();
}
function subscribe(listener) {
  listeners.add(listener);
  if (!started) check();
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
