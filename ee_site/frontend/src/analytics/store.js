import { ATTRIBUTION_DAYS, CONSENT_DAYS, DAY, KEYS, VERSION, campaign, validAttribution } from "./policy.js";

export function createStore(storage, now = Date.now) {
  const read = key => { try { const raw = storage?.getItem(key); return raw && raw.length <= 20000 ? JSON.parse(raw) : null; } catch { return null; } };
  const write = (key, value) => { try { if (!storage) return false; storage.setItem(key, JSON.stringify(value)); return true; } catch { return false; } };
  const remove = key => { try { storage?.removeItem(key); } catch { /* inaccessible storage */ } };
  let attribution = null;
  let lastMarkedSearch = null;
  const successes = new Map();
  return {
    consent() {
      const value = read(KEYS.consent);
      return value?.version === VERSION && ["allowed", "denied"].includes(value.choice)
        && Number.isSafeInteger(value.at) && value.at <= now() && value.at > now() - CONSENT_DAYS * DAY ? value.choice : "unknown";
    },
    consentExpiresAt() { const value = read(KEYS.consent); return value?.at ? value.at + CONSENT_DAYS * DAY : null; },
    consentAt() { return read(KEYS.consent)?.at || null; },
    choose(choice) {
      const saved = write(KEYS.consent, { version: VERSION, choice, at: now() });
      // Never retain an older persisted permission after a failed new decision.
      if (!saved) remove(KEYS.consent);
      return saved;
    },
    capture(search) {
      const time = now();
      if (!attribution) {
        const saved = read(KEYS.attribution);
        if (validAttribution(saved, time)) attribution = saved;
      }
      if (attribution && !validAttribution(attribution, time)) attribution = null;
      const tags = campaign(search);
      if (tags) {
        // Same URL/effect does not extend the storage lifetime.
        if (!attribution || lastMarkedSearch !== search || JSON.stringify(attribution.last.tags) !== JSON.stringify(tags)) {
          const touch = { tags, at: time };
          attribution = { version: VERSION, first: attribution?.first || touch, last: touch };
        }
      }
      if (search) lastMarkedSearch = search;
      if (attribution) write(KEYS.attribution, attribution); else remove(KEYS.attribution);
      return attribution ? structuredClone(attribution) : null;
    },
    clearOptional() {
      attribution = null;
      lastMarkedSearch = null;
      successes.clear();
      remove(KEYS.attribution); remove(KEYS.successes);
    },
    hasSuccess(id) {
      // Bounded, best-effort cross-tab/reload dedup. No user payload is stored.
      const time = now();
      const saved = read(KEYS.successes);
      if (Array.isArray(saved)) for (const item of saved.slice(-200)) {
        if (typeof item?.id === "string" && /^[a-f0-9-]{36}$/.test(item.id) && Number.isSafeInteger(item.at) && item.at <= time && item.at > time - ATTRIBUTION_DAYS * DAY) successes.set(item.id, item.at);
      }
      for (const [key, at] of successes) if (at <= time - ATTRIBUTION_DAYS * DAY) successes.delete(key);
      return successes.has(id);
    },
    markSuccess(id) {
      if (this.hasSuccess(id)) return false;
      const time = now();
      successes.set(id, time);
      while (successes.size > 200) successes.delete(successes.keys().next().value);
      write(KEYS.successes, Array.from(successes, ([key, at]) => ({ id: key, at })));
      return true;
    },
  };
}
