import { CONSENT_DAYS, DAY, GOALS, KEYS, ORIGIN, campaign, pageParams, permittedEnvironment, safeParams, safePath, safeReferrer, validTouch } from "./policy.js";
import { createStore } from "./store.js";
import { installCalltouch } from "./calltouch.js";
import { installMetrika } from "./metrika.js";
import { createPending } from "./pending.js";

export function createAnalytics({ window: win, document: doc, production, enabled, calltouchEnabled, now = Date.now, trackerFactory = installMetrika }) {
  let storage;
  try { storage = win?.localStorage; } catch { /* fail closed */ }
  const store = createStore(storage, now);
  let sessionStorage;
  try { sessionStorage = win?.sessionStorage; } catch { /* memory-only retry */ }
  const pending = createPending(sessionStorage, now);
  let choice = store.consent();
  let choiceExpires = store.consentExpiresAt() || now() + CONSENT_DAYS * DAY;
  let expiryTimer;
  let sessionOnly = false;
  let tracker = null, ready = false, generation = 0, timeout = null;
  const pendingSuccesses = new Map();
  const SUCCESS_LIMIT = 20, SUCCESS_TTL = 10000;
  let successTimer;
  let currentPage = null, previousPath = null, previousModal = null, initial = true;
  let pendingPages = [], lastScheduledPath = null;
  const listeners = new Set(), snapshots = new Set();
  const eligible = permittedEnvironment(production, enabled, win?.location);
  const calltouchAvailable = eligible && calltouchEnabled === "true";
  let calltouchStarted = false;
  let metrikaStarted = false;
  const blockedKeyAll = "ee_analytics_blocked";
  try {
    if (sessionStorage?.getItem(blockedKeyAll) === "1" || sessionStorage?.getItem("ee_calltouch_blocked") === "1") {
      choice = "denied";
      sessionOnly = true;
    }
  } catch { /* memory choice */ }
  function calltouchAllowed() { return calltouchAvailable && allowed(); }
  function syncCalltouch() {
    if (!calltouchAllowed()) {
      // Removing a script element cannot stop code already running in this page.
      if (calltouchStarted) win.location.reload();
      return;
    }
    if (calltouchStarted || !currentPage) return;
    try { installCalltouch(win, doc); calltouchStarted = true; }
    catch { /* Optional script must not interrupt the site. */ }
  }
  const notify = () => { for (const fn of listeners) { try { fn(); } catch { /* isolated subscriber */ } } };
  const allowed = () => eligible && choice !== "denied";
  const post = data => {
    if (!allowed() || !ready || !tracker) return false;
    try { return tracker.send(data); }
    catch { return false; }
  };
  function scheduleSuccessExpiry() {
    win?.clearTimeout(successTimer);
    if (!pendingSuccesses.size) return;
    const expires = Math.min(...Array.from(pendingSuccesses.values(), item => item.expires));
    successTimer = win.setTimeout(() => {
      for (const [id, item] of pendingSuccesses) if (item.expires <= now()) pendingSuccesses.delete(id);
      scheduleSuccessExpiry();
    }, Math.max(0, expires - now()));
  }
  function flushSuccesses() {
    if (!allowed() || !ready) return;
    for (const [id, item] of pendingSuccesses) {
      if (item.generation === generation && item.expires > now() && !store.hasSuccess(id)) {
        // Local stage only: vendor API returned without throwing, NOT delivery ACK.
        if (post({ type: "goal", name: "lead_success", params: item.params })) store.markSuccess(id);
        else item.snapshot.successSeen = false;
      }
      pendingSuccesses.delete(id);
    }
    scheduleSuccessExpiry();
  }
  function stop() {
    ready = false;
    pendingSuccesses.clear(); win?.clearTimeout(successTimer);
    generation++;
    win?.clearTimeout(timeout);
    // Destruct stops the counter; explicit refusal also reloads the vendor context.
    try { tracker?.stop(); } catch { /* denial also reloads the document */ }
    tracker = null;
    previousPath = null; previousModal = null; initial = true;
    pendingPages = []; lastScheduledPath = null;
  }
  function clearLibraryData() {
    // Host cookies/storage only. Third-party and HttpOnly cookies are inaccessible.
    try {
      for (const part of doc.cookie.split(";")) {
        const name = part.split("=")[0].trim();
        if (!/^(_ym_|_ct(?:_|$)|cted$|call_s$)/.test(name)) continue;
        for (const domain of ["", win.location.hostname, "energoeffekt-rostov.ru"]) {
          doc.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax; Secure${domain ? `; Domain=${domain}` : ""}`;
        }
      }
      for (let i = (storage?.length || 0) - 1; i >= 0; i--) {
        const key = storage.key(i);
        if (/^_+ym[_:]/.test(key)) storage.removeItem(key);
      }
    } catch { /* browser controls inaccessible data */ }
  }
  function flushPage() {
    if (!ready || !allowed()) return;
    for (const { path, title, search } of pendingPages) {
      const tags = initial ? campaign(search) : null;
      const query = tags ? `?${new URLSearchParams(tags)}` : "";
      if (post({ type: "hit", url: ORIGIN + path + query, title,
        referrer: initial ? safeReferrer(doc.referrer) : ORIGIN + (previousPath || "/") })) {
        initial = false; previousPath = path;
      }
    }
    pendingPages = [];
  }
  function schedulePage() {
    if (!currentPage || currentPage.path === lastScheduledPath || !allowed()) return;
    lastScheduledPath = currentPage.path;
    // Views observed during this consent generation only; bounded and cleared
    // on timeout/revoke. Interaction goals are never queued while loading.
    if (pendingPages.length < 25) pendingPages.push({ ...currentPage });
    flushPage();
  }
  function start() {
    if (!allowed() || tracker || !currentPage) return;
    const token = ++generation;
    try {
      tracker = trackerFactory(win, doc, {
        generation: token,
        ready() {
          if (!allowed() || token !== generation) return;
          ready = true; win.clearTimeout(timeout); flushPage(); flushSuccesses();
        },
        failed() { if (token === generation) stop(); },
      });
      metrikaStarted = true;
      timeout = win.setTimeout(() => { if (generation === token && !ready) stop(); }, 10000);
    } catch { stop(); }
  }
  function setChoice(next, persist = true) {
    if (!["allowed", "denied", "unknown"].includes(next)) next = "unknown";
    const wasAllowed = allowed();
    const changed = choice !== next;
    choice = next;
    choiceExpires = persist ? now() + CONSENT_DAYS * DAY : store.consentExpiresAt() || 0;
    sessionOnly = persist && !store.choose(next);
    if (persist) {
      try {
        if (next === "denied" && sessionOnly) sessionStorage?.setItem(blockedKeyAll, "1");
        else sessionStorage?.removeItem(blockedKeyAll);
        sessionStorage?.removeItem("ee_calltouch_blocked");
      } catch { /* localStorage remains primary */ }
    }
    if (!allowed()) {
      stop(); store.clearOptional(); pending.clearOptional(); clearLibraryData();
      for (const snapshot of snapshots) { snapshot.attribution = null; snapshot.consentAt = null; snapshot.trackingEligible = false; }
    } else if (changed && !wasAllowed) {
      if (currentPage) currentPage.search = win.location.search;
      store.capture(win.location.search); start(); schedulePage();
    }
    notify();
    scheduleExpiry();
    if (!allowed() && metrikaStarted && !calltouchStarted) win.location.reload();
    syncCalltouch();
  }
  function scheduleExpiry() {
    win?.clearTimeout(expiryTimer);
    if (choice === "unknown" || !win) return;
    expiryTimer = win.setTimeout(() => {
      if (now() >= choiceExpires) setChoice("unknown", false);
      else scheduleExpiry();
    }, Math.min(DAY, Math.max(0, choiceExpires - now())));
  }
  win?.addEventListener("storage", event => {
    if (event.key === KEYS.consent || event.key === null) {
      const persisted = store.consent();
      // A failed local denial remains authoritative in this document even if
      // an undeletable old permission is still visible through another event.
      if (sessionOnly && choice !== "allowed") return;
      if (persisted !== choice) {
        try { sessionStorage?.removeItem(blockedKeyAll); } catch { /* memory */ }
        setChoice(persisted, false);
      }
    }
  });
  win?.addEventListener("focus", () => {
    // Reconcile persisted choices/expiry, without undoing a session-only choice.
    try { if (!sessionOnly) setChoice(store.consent(), false); } catch { /* session only */ }
  });
  if (!allowed()) { store.clearOptional(); pending.clearOptional(); clearLibraryData(); }
  scheduleExpiry();
  const api = {
    subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    getChoice: () => choice,
    calltouchAvailable: () => calltouchAvailable,
    choose: setChoice,
    calltouchMetadata(snapshot) {
      if (!calltouchAllowed() || !snapshot?.trackingEligible || snapshot.generation !== generation) return null;
      let sessionId = "";
      try {
        const value = win.ct?.("calltracking_params", "q0fhtb2e")?.sessionId;
        if ((typeof value === "string" || Number.isSafeInteger(value)) && /^[1-9][0-9]{0,19}$/.test(String(value))) sessionId = String(value);
      } catch { /* missing/blocked vendor session: journal entry has unknown source */ }
      return { enabled: true, session_id: sessionId };
    },
    visit({ path, search = "", title, modal = null, key }) {
      if (modal && previousModal !== key && allowed()) this.goal("case_open", { ...pageParams(path), case: modal });
      previousModal = modal ? key : null;
      currentPage = { path: safePath(path), search, title: String(title).slice(0, 200) };
      if (!allowed()) return;
      store.capture(search); start(); schedulePage(); syncCalltouch();
    },
    goal(name, params) { return GOALS.includes(name) && post({ type: "goal", name, params: safeParams(params) }); },
    recoverSubmission(signature) { return pending.get(signature); },
    rememberSubmission(submission, snapshot) { pending.save(submission, snapshot, allowed() && snapshot.generation === generation && snapshot.trackingEligible ? snapshot.consentAt : null); },
    forgetSubmission(id) { pending.remove(id); },
    snapshot(direction = {}, recovered = null) {
      const sameConsent = allowed() && recovered?.consentAt && recovered.consentAt === store.consentAt();
      const attribution = recovered
        ? (sameConsent ? recovered.attribution : null)
        : (allowed() ? store.capture("") : null);
      const snapshot = { direction: safeParams(recovered?.direction || direction), attribution, generation, successSeen: false,
        trackingEligible: recovered ? Boolean(sameConsent) : allowed(), consentAt: allowed() && !sessionOnly ? store.consentAt() : null };
      snapshots.add(snapshot); return snapshot;
    },
    release(snapshot) { snapshots.delete(snapshot); },
    payload(snapshot) {
      // Consent generation binds a request snapshot; revoke/re-allow cannot resurrect it.
      if (!allowed() || snapshot.generation !== generation || snapshot.attribution && (!validTouch(snapshot.attribution.first, now()) || !validTouch(snapshot.attribution.last, now()))) snapshot.attribution = null;
      return snapshot.attribution;
    },
    success(id, snapshot) {
      if (snapshot.successSeen) return;
      snapshot.successSeen = true;
      if (!allowed() || snapshot.generation !== generation || !snapshot.trackingEligible) return;
      if (store.hasSuccess(id) || pendingSuccesses.has(id) || pendingSuccesses.size >= SUCCESS_LIMIT) return;
      pendingSuccesses.set(id, { params: safeParams(snapshot.direction), generation,
        expires: now() + SUCCESS_TTL, snapshot });
      scheduleSuccessExpiry(); flushSuccesses();
    },
  };
  // Failures anywhere in the optional adapter cannot turn a confirmed Lead into
  // a UI error or stop the operational form. Fallbacks never queue analytics.
  const safeApi = {};
  for (const [name, method] of Object.entries(api)) {
    safeApi[name] = (...args) => {
      try { return method.apply(safeApi, args); }
      catch {
        if (name === "snapshot") {
          let direction = {};
          try { direction = safeParams(args[1]?.direction || args[0]); } catch { /* invalid optional data */ }
          return { direction, attribution: null, generation, trackingEligible: false, successSeen: false, consentAt: null };
        }
        if (name === "subscribe") return () => {};
        if (name === "getChoice") return "unknown";
        if (name === "recoverSubmission" || name === "payload") return null;
        return false;
      }
    };
  }
  return safeApi;
}

export const analytics = createAnalytics({
  window: typeof window === "undefined" ? undefined : window,
  document: typeof document === "undefined" ? undefined : document,
  production: import.meta.env?.PROD === true,
  enabled: import.meta.env?.VITE_EE_ANALYTICS_ENABLED,
  calltouchEnabled: import.meta.env?.VITE_EE_CALLTOUCH_ENABLED,
});
