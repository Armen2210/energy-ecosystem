import { DAY, safeParams, validAttribution } from './policy.js';

export const PENDING_KEY = 'ee_submission_retry_v1';
// Technical retry records, not a draft of the form. No fields/file names/content.
// A tab can recover an unchanged manually refilled submission for 24 hours.
export function createPending(storage, now = Date.now) {
  let records = [];
  try {
    const raw = storage?.getItem(PENDING_KEY);
    const saved = raw && raw.length <= 30000 ? JSON.parse(raw) : null;
    if (saved?.version === 1 && Array.isArray(saved.records)) records = saved.records.slice(-10);
  } catch { /* memory-only fallback */ }
  function valid(record) {
    return /^[a-f0-9-]{36}$/.test(record?.id) && /^[a-f0-9]{64}$/.test(record?.signature)
      && Number.isSafeInteger(record.at) && record.at <= now() && record.at > now() - DAY;
  }
  function persist() {
    records = records.filter(valid);
    try {
      if (records.length) storage?.setItem(PENDING_KEY, JSON.stringify({ version: 1, records }));
      else storage?.removeItem(PENDING_KEY);
    } catch {
      // A failed sanitized rewrite must not leave old optional data recoverable.
      // Keep technical records in memory; reload recovery may be lost.
      try { storage?.removeItem(PENDING_KEY); } catch { /* inaccessible storage */ }
    }
  }
  records = records.filter(valid).map(record => ({ id: record.id, signature: record.signature, at: record.at,
    direction: safeParams(record.direction), attribution: validAttribution(record.attribution, now()) ? record.attribution : null,
    consentAt: Number.isSafeInteger(record.consentAt) ? record.consentAt : null }));
  return {
    get(signature) { return records.find(record => valid(record) && record.signature === signature) || null; },
    save(submission, snapshot, consentAt) {
      records = records.filter(record => valid(record) && record.id !== submission.id);
      records.push({ id: submission.id, signature: submission.signature, at: now(), direction: snapshot.direction, attribution: snapshot.attribution, consentAt });
      records = records.slice(-10); persist();
    },
    clearOptional() { for (const record of records) { record.attribution = null; record.consentAt = null; } persist(); },
    remove(id) { records = records.filter(record => record.id !== id); persist(); },
  };
}
