import { permittedEnvironment, safePath } from './policy.js';

export const CALLTOUCH_MODULE = 'q0fhtb2e'; // Project file Скрипт.txt, not a sample ID.
export function registrationBody(sessionId, path) {
  const body = new URLSearchParams({ subject: 'Заявка с сайта Энергоэффект', requestUrl: 'https://www.energoeffekt-rostov.ru' + safePath(path) });
  if (typeof sessionId === 'string' && /^[A-Za-z0-9_-]{1,200}$/.test(sessionId)) body.set('sessionId', sessionId);
  return body;
}

// Browser registration deliberately has no retry queue. Only a new, confirmed
// Lead (not an API duplicate) can reach this adapter. No form DOM/data is read.
export function createCalltouch({ window: win, document: doc, production, enabled,
  configurationApproved, registrationEnabled, fieldsApproved, siteId, fetch: send = globalThis.fetch,
  startTracker, stopTracker, readSession } = {}) {
  let choice = 'unknown', generation = 0, frame = null;
  const attempts = new Set(), controllers = new Set();
  const eligible = permittedEnvironment(production, enabled, win?.location) && configurationApproved === 'true';
  const allowed = () => eligible && choice === 'allowed';
  function stop() {
    for (const controller of controllers) controller.abort();
    controllers.clear();
    try { stopTracker?.(); frame?.remove(); } catch { /* optional service */ }
    frame = null;
  }
  const api = {
    sync(next) {
      if (next === choice) return;
      choice = next; generation++;
      if (!allowed()) { stop(); return; }
      try {
        if (startTracker) { startTracker(); return; }
        frame = doc.createElement('iframe');
        frame.hidden = true; frame.title = 'Служебная аналитика Calltouch';
        frame.setAttribute('aria-hidden', 'true'); frame.setAttribute('tabindex', '-1');
        frame.referrerPolicy = 'no-referrer';
        const token = generation;
        frame.onload = () => {
          if (allowed() && token === generation) frame?.contentWindow?.postMessage({ eeCalltouch: true, type: 'start' }, win.location.origin);
        };
        frame.src = '/calltouch-frame.html#' + encodeURIComponent(safePath(win.location.pathname));
        doc.body.append(frame);
      } catch { stop(); }
    },
    snapshot() {
      if (!allowed()) return null;
      let sessionId = null;
      try { sessionId = readSession ? readSession() : frame?.contentWindow?.eeCalltouchSession?.(); } catch { /* blocker/slow script: no session */ }
      return { generation, sessionId, path: safePath(win.location.pathname) };
    },
    confirmed(result, submissionId, snapshot) {
      if (!allowed() || !snapshot || snapshot.generation !== generation || !result?.id || result.duplicate === true
        || !/^[a-f0-9-]{36}$/.test(submissionId || '') || attempts.has(submissionId)
        || attempts.size >= 200 || registrationEnabled !== 'true' || fieldsApproved !== 'true' || !/^[1-9][0-9]{0,15}$/.test(siteId || '')) return false;
      // The library may become ready while Django is saving the Lead.
      if (!snapshot.sessionId) {
        try { snapshot = { ...snapshot, sessionId: readSession ? readSession() : frame?.contentWindow?.eeCalltouchSession?.() }; } catch { /* no session */ }
      }
      // Record before issuing the request: an ambiguous timeout must not retry.
      attempts.add(submissionId);
      const controller = new AbortController(); controllers.add(controller);
      const timer = win.setTimeout(() => controller.abort(), 5000);
      const cleanup = () => { win.clearTimeout(timer); controllers.delete(controller); };
      try {
        Promise.resolve(send(`https://api.calltouch.ru/calls-service/RestAPI/requests/${siteId}/register/`, {
          method: 'POST', mode: 'cors', credentials: 'omit', referrerPolicy: 'no-referrer',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: registrationBody(snapshot.sessionId, snapshot.path), signal: controller.signal,
        })).then(cleanup, cleanup);
      } catch { cleanup(); }
      return true; // Attempt scheduled, never a claim of remote delivery.
    },
    stop() { choice = 'unknown'; generation++; stop(); },
  };
  return api;
}

export const calltouch = createCalltouch({
  window: typeof window === 'undefined' ? undefined : window,
  document: typeof document === 'undefined' ? undefined : document,
  production: import.meta.env?.PROD === true,
  enabled: import.meta.env?.VITE_CALLTOUCH_ENABLED,
  configurationApproved: import.meta.env?.VITE_CALLTOUCH_CONFIGURATION_APPROVED,
  registrationEnabled: import.meta.env?.VITE_CALLTOUCH_REGISTRATION_ENABLED,
  fieldsApproved: import.meta.env?.VITE_CALLTOUCH_FIELDS_APPROVED,
  siteId: import.meta.env?.VITE_CALLTOUCH_SITE_ID,
});
