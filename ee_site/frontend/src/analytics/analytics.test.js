import { test } from 'node:test';
import assert from 'node:assert/strict';
import { campaign, safePath, safeReferrer, safeParams, permittedEnvironment, KEYS, DAY, ATTRIBUTION_DAYS, CONSENT_DAYS } from './policy.js';
import { createPending, PENDING_KEY } from './pending.js';
import { createStore } from './store.js';
import { createAnalytics } from './runtime.js';
import { createLead, createSubmissionSignature } from '../api/leadsApi.js';

function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) || null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key), key: i => [...data.keys()][i], get length() { return data.size; } };
}
function platform({ saved, failStorage = false, production = true, enabled = 'true', hostname = 'www.energoeffekt-rostov.ru' } = {}) {
  const events = {}, commands = [], frames = [], timers = new Map(), delays = new Map();
  let timerId = 0, time = 1800000000000;
  const localStorage = saved || storage();
  const win = { location: { protocol: 'https:', hostname, origin: `https://${hostname}`, search: '?utm_source=yandex&utm_medium=cpc' },
    localStorage, addEventListener: (name, fn) => { events[name] = fn; },
    setTimeout(fn, delay) { timers.set(++timerId, fn); delays.set(timerId, delay); return timerId; }, clearTimeout: id => timers.delete(id) };
  if (failStorage) Object.defineProperty(win, 'localStorage', { get() { throw Error('denied'); } });
  const doc = { referrer: 'https://google.com/search?email=secret', cookie: '', body: { append: f => frames.push(f) }, createElement() {
    return { setAttribute() {}, contentWindow: { postMessage: data => commands.push(data), eeAnalyticsStop: () => commands.push({ type: 'destruct' }) }, remove() { this.removed = true; } };
  } };
  const app = createAnalytics({ window: win, document: doc, production, enabled, now: () => time });
  return { app, win, events, commands, frames, localStorage, setTime: t => { time = t; }, time: () => time,
    fireTimers(delay) { for (const [id, fn] of [...timers]) if (delays.get(id) === delay) { timers.delete(id); fn(); } },
    ready(frame = frames.at(-1), token = Number(frame.src.split('=')[1])) { events.message({ source: frame.contentWindow, origin: win.location.origin, data: { eeAnalytics: true, generation: token, type: 'ready' } }); },
    visit(path = '/', extras = {}) { app.visit({ path, title: path === '/' ? 'Home' : 'BTP', search: win.location.search, key: path, ...extras }); } };
}

test('strict production + HTTPS + exact host + explicit flag gate', () => {
  for (const host of ['localhost', 'preview.example.com', 'www.energoeffekt-rostov.ru.evil']) assert.equal(permittedEnvironment(true, 'true', { protocol: 'https:', hostname: host }), false);
  assert.equal(permittedEnvironment(false, 'true', { protocol: 'https:', hostname: 'energoeffekt-rostov.ru' }), false);
  assert.equal(permittedEnvironment(true, 'true', { protocol: 'http:', hostname: 'energoeffekt-rostov.ru' }), false);
  for (const config of [{ production: false }, { enabled: 'false' }, { hostname: 'localhost' }]) {
    const p = platform(config); p.visit(); p.app.choose('allowed'); assert.equal(p.frames.length, 0);
  }
});
test('URL, referrer and event parameter allowlists reject personal/freeform values', () => {
  assert.equal(safePath('/solutions/btp'), '/solutions/btp');
  for (const path of ['/solutions/private-person', '/user@example.com', '/solutions/btp/extra', '/services/unknown']) assert.equal(safePath(path), '/404');
  assert.equal(safePath('/contacts'), '/');
  assert.equal(safeReferrer('https://evil.test/personal?name=secret'), '');
  assert.equal(safeReferrer('https://yandex.ru/search?text=private'), 'https://yandex.ru/');
  assert.deepEqual(safeParams({ product: 'btp', name: 'private', submission_id: 'secret', placement: 'arbitrary' }), { product: 'btp' });
  assert.deepEqual(campaign('?utm_source=yandex&yclid=123456789012345678&email=private'), { utm_source: 'yandex', yclid: '123456789012345678' });
  for (const query of ['?utm_source=a@b.ru', '?utm_source=ivan%20ivanov', '?utm_source=a&ut m_medium=cpc&utm_term=+79999999999', '?utm_source=' + 'a'.repeat(65), '?utm_source=abc1234567', '?yclid=abc', '?utm_source=x&utm_source=y']) assert.equal(campaign(query), null);
});
test('consent legacy value, corrupt value, version and expiry fail closed', () => {
  const s = storage(); s.setItem('ee_cookie_consent', 'accepted');
  const store = createStore(s, () => 1800000000000);
  assert.equal(store.consent(), 'unknown');
  for (const raw of ['{', JSON.stringify({ version: 2, choice: 'allowed', at: 1800000000000 }), JSON.stringify({ version: 1, choice: 'allowed', at: 1800000000000 - CONSENT_DAYS * DAY })]) {
    s.setItem(KEYS.consent, raw); assert.equal(store.consent(), 'unknown');
  }
  store.choose('allowed'); assert.equal(store.consent(), 'allowed');
});
test('first and last marked touch, internal transitions, new entry, expiry', () => {
  let time = 1800000000000;
  const s = storage(), store = createStore(s, () => time);
  const first = store.capture('?utm_source=yandex');
  time += DAY;
  assert.deepEqual(store.capture('').first, first.first);
  const last = store.capture('?utm_source=contractor');
  assert.deepEqual(last.first, first.first);
  assert.equal(last.last.tags.utm_source, 'contractor');
  assert.deepEqual(store.capture('?utm_source=contractor'), last);
  const reload = createStore(s, () => time + 1);
  assert.equal(reload.capture('?utm_source=contractor').last.at, time + 1);
  time += ATTRIBUTION_DAYS * DAY;
  assert.equal(store.capture(''), null);
  assert.equal(s.getItem(KEYS.attribution), null);
});
test('no attribution, script or events before permission / after denial', () => {
  const p = platform(); p.visit(); p.app.goal('contact_phone_click');
  assert.equal(p.localStorage.getItem(KEYS.attribution), null);
  assert.equal(p.frames.length, 0);
  p.app.choose('denied'); p.visit('/solutions/btp');
  assert.equal(p.frames.length, 0); assert.equal(p.commands.length, 0);
});
test('one init context and page hit, anchors/rerenders do not duplicate; Back/Forward count', () => {
  const p = platform(); p.visit(); p.app.choose('allowed'); p.ready();
  p.visit('/', { key: 'rerender' }); p.visit('/', { key: 'anchor' });
  assert.equal(p.frames.length, 1); assert.equal(p.commands.filter(c => c.type === 'hit').length, 1);
  p.visit('/solutions/btp', { search: '' }); p.visit('/', { search: '' }); p.visit('/solutions/btp', { search: '' });
  const hits = p.commands.filter(c => c.type === 'hit');
  assert.equal(hits.length, 4);
  assert.match(hits[0].url, /utm_source=yandex/);
  assert.equal(hits[1].url, 'https://www.energoeffekt-rostov.ru/solutions/btp');
  assert.equal(hits[0].referrer, 'https://www.google.com/');
  assert.equal(hits[1].title, 'BTP');
});
test('modal case emits one goal, direct case has hit, closing modal has no extra hit', () => {
  const p = platform(); p.visit('/cases', { search: '' }); p.app.choose('allowed'); p.ready();
  p.visit('/cases', { key: 'modal', modal: 'btp-food-production' });
  p.visit('/cases', { key: 'modal', modal: 'btp-food-production' });
  p.visit('/cases', { key: 'closing' });
  assert.equal(p.commands.filter(c => c.type === 'goal').length, 1);
  assert.equal(p.commands.filter(c => c.type === 'hit').length, 1);
  p.visit('/cases/btp-food-production');
  assert.equal(p.commands.filter(c => c.type === 'hit').length, 2);
});
test('loading/revoke/late callback/reallow destroys old context and no event backlog', () => {
  const p = platform(); p.visit(); p.app.choose('allowed'); const old = p.frames[0];
  p.app.goal('lead_form_start'); p.app.choose('denied'); p.ready(old);
  assert.equal(old.removed, true); assert.equal(p.commands.filter(c => c.type === 'hit').length, 0);
  p.app.choose('allowed'); p.ready(old); p.ready();
  assert.equal(p.frames.length, 2); assert.equal(p.commands.filter(c => c.type === 'hit').length, 1);
  assert.equal(p.commands.filter(c => c.type === 'goal').length, 0);
});
test('storage event revoke stops and clears snapshots; corrupted cross-tab data fails closed', () => {
  const p = platform(); p.visit(); p.app.choose('allowed'); p.ready();
  const snapshot = p.app.snapshot({ product: 'btp' });
  assert.ok(p.app.payload(snapshot));
  p.localStorage.setItem(KEYS.consent, 'broken'); p.events.storage({ key: KEYS.consent });
  assert.equal(p.app.getChoice(), 'unknown'); assert.equal(p.app.payload(snapshot), null);
  assert.equal(p.frames[0].removed, true);
  p.app.choose('allowed'); p.ready();
  assert.equal(p.app.payload(snapshot), null);
  p.app.success('11111111-1111-4111-8111-111111111111', snapshot);
  assert.equal(p.commands.filter(c => c.name === 'lead_success').length, 0);
});
test('storage failure allows current session only; blocked/throwing adapter does not throw', () => {
  const p = platform({ failStorage: true }); p.visit(); p.app.choose('allowed'); p.ready();
  assert.equal(p.app.getChoice(), 'allowed');
  p.frames[0].contentWindow.postMessage = () => { throw Error('blocked'); };
  assert.doesNotThrow(() => p.app.goal('lead_success', { product: 'btp' }));
  assert.doesNotThrow(() => p.app.choose('denied'));
});
test('lead success dedup same id across reload/tab, new id separate; denial never queued', () => {
  const p = platform(); p.visit(); p.app.choose('allowed'); p.ready();
  const id = '11111111-1111-4111-8111-111111111111';
  const snapshot = p.app.snapshot({ product: 'btp' });
  p.app.success(id, snapshot); p.app.success(id, snapshot); p.app.success(id, p.app.snapshot({ product: 'btp' }));
  assert.equal(p.commands.filter(c => c.name === 'lead_success').length, 1);
  const reload = platform({ saved: p.localStorage }); reload.visit(); reload.ready(); reload.app.success(id, reload.app.snapshot());
  assert.equal(reload.commands.filter(c => c.name === 'lead_success').length, 0);
  p.app.success('22222222-2222-4222-8222-222222222222', p.app.snapshot());
  assert.equal(p.commands.filter(c => c.name === 'lead_success').length, 2);
  p.app.choose('denied'); const deniedSnapshot = p.app.snapshot(); p.app.success(id, deniedSnapshot);
  p.app.choose('allowed'); p.ready(); p.app.success(id, deniedSnapshot);
  assert.equal(p.commands.filter(c => c.name === 'lead_success').length, 2);
  assert.equal(JSON.stringify(p.commands).includes(id), false);
});
test('snapshot stable on campaign change, discarded on expiry, legacy content signature stable', async () => {
  const p = platform(); p.visit(); p.app.choose('allowed'); p.ready();
  const snapshot = p.app.snapshot({ product: 'btp' }); const first = p.app.payload(snapshot);
  p.visit('/services/design', { search: '?utm_source=other' });
  assert.deepEqual(p.app.payload(snapshot), first);
  p.setTime(p.time() + 31 * DAY); assert.equal(p.app.payload(snapshot), null);
  const form = new FormData(); form.set('name', 'synthetic'); form.set('phone', '+70000000000');
  const signature = await createSubmissionSignature(form);
  form.set('campaign_attribution', JSON.stringify(first)); form.set('direction_type', 'product'); form.set('direction_slug', 'btp');
  assert.equal(await createSubmissionSignature(form), signature);
  form.set('name', 'edited'); assert.notEqual(await createSubmissionSignature(form), signature);
});
test('API accepts only confirmed positive ids; error status / HTML / network not conversion', async () => {
  const original = globalThis.fetch;
  try {
    for (const id of [null, '', 'secret@example.com', 0, -1, 1.5, {}, true]) {
      globalThis.fetch = async () => new Response(JSON.stringify({ id }), { status: 201, headers: { 'content-type': 'application/json' } });
      await assert.rejects(createLead(new FormData()));
    }
    for (const status of [400, 409, 413, 429, 500]) {
      globalThis.fetch = async () => new Response(JSON.stringify({ id: 1 }), { status, headers: { 'content-type': 'application/json' } });
      await assert.rejects(createLead(new FormData()));
    }
    globalThis.fetch = async () => new Response('<html>ok</html>', { status: 201 }); await assert.rejects(createLead(new FormData()));
    globalThis.fetch = async () => { throw Error('lost'); }; await assert.rejects(createLead(new FormData()));
    globalThis.fetch = async () => new Response(JSON.stringify({ id: 1, duplicate: true }), { status: 200, headers: { 'content-type': 'application/json' } });
    assert.equal((await createLead(new FormData())).id, 1);
  } finally { globalThis.fetch = original; }
});

test('pending retry survives reload with original direction/campaign and clears optional data', async () => {
  const { createPending } = await import('./pending.js');
  const s = storage(); let time = 1800000000000;
  const submission = { id: '11111111-1111-4111-8111-111111111111', signature: 'a'.repeat(64) };
  const snapshot = { direction: { product:'btp' }, attribution: { version:1, first:{at:time,tags:{utm_source:'yandex'}}, last:{at:time,tags:{utm_source:'yandex'}} } };
  const pending = createPending(s,()=>time); pending.save(submission,snapshot,time);
  const reload = createPending(s,()=>time); assert.equal(reload.get(submission.signature).id,submission.id); assert.deepEqual(reload.get(submission.signature).attribution,snapshot.attribution);
  reload.clearOptional(); const deniedReload=createPending(s,()=>time);
  assert.equal(deniedReload.get(submission.signature).attribution,null); assert.deepEqual(deniedReload.get(submission.signature).direction,{product:'btp'});
  time += DAY; assert.equal(createPending(s,()=>time).get(submission.signature),null);
});
test('view queue starts at consent and is cleared by revoke, includes initial safe campaign', () => {
  const p=platform(); p.visit(); p.app.choose('allowed'); p.visit('/about',{search:''});
  p.visit('/solutions/btp',{search:''}); p.ready();
  assert.deepEqual(p.commands.filter(c=>c.type==='hit').map(c=>new URL(c.url).pathname),['/','/about','/solutions/btp']);
  assert.match(p.commands.find(c=>c.type==='hit').url,/utm_source=yandex/);
  assert.equal(p.commands.filter(c=>c.type==='hit').length,3);
});
test('readable storage with failed writes retains explicit session choice on focus', () => {
  const s=storage(); s.setItem(KEYS.consent,JSON.stringify({version:1,choice:'denied',at:1800000000000})); s.setItem=()=>{throw Error('quota');};
  const p=platform({saved:s}); p.visit(); p.app.choose('allowed'); p.ready(); p.events.focus(); assert.equal(p.app.getChoice(),'allowed');
});

test('unexpected optional adapter exception preserves operational direction and no analytics', () => {
  const p=platform(); p.visit(); p.app.choose('allowed'); p.ready();
  const original=globalThis.structuredClone;
  try {
    globalThis.structuredClone=()=>{throw Error('unexpected browser failure');};
    const snapshot=p.app.snapshot({service:'design'});
    assert.deepEqual(snapshot.direction,{service:'design'}); assert.equal(snapshot.attribution,null);
    assert.doesNotThrow(()=>p.app.success('11111111-1111-4111-8111-111111111111',snapshot));
    assert.equal(p.commands.filter(c=>c.name==='lead_success').length,0);
  } finally { globalThis.structuredClone=original; }
});

const successId = '11111111-1111-4111-8111-111111111111';
test('confirmed success waits for ready once, without a premature sent marker', () => {
  const p = platform(); p.visit(); p.app.choose('allowed');
  const snapshot = p.app.snapshot({ product: 'btp' });
  p.app.success(successId, snapshot);
  assert.equal(p.localStorage.getItem(KEYS.successes), null);
  p.app.success(successId, p.app.snapshot()); p.ready();
  p.app.success(successId, snapshot); p.app.success(successId, p.app.snapshot());
  assert.equal(p.commands.filter(c => c.name === 'lead_success').length, 1);
  assert.equal(JSON.parse(p.localStorage.getItem(KEYS.successes))[0].id, successId);
});
test('pending successes cleared on revoke, consent expiry, load timeout and generation change', () => {
  for (const reason of ['revoke', 'expiry', 'timeout']) {
    const p = platform(); p.visit(); p.app.choose('allowed'); const old = p.frames[0];
    p.app.success(successId, p.app.snapshot());
    if (reason === 'revoke') p.app.choose('denied');
    if (reason === 'expiry') { p.setTime(p.time() + CONSENT_DAYS * DAY); p.events.focus(); }
    if (reason === 'timeout') p.fireTimers(10000);
    p.ready(old); p.app.choose('denied'); p.app.choose('allowed'); p.ready();
    assert.equal(p.commands.filter(c => c.name === 'lead_success').length, 0, reason);
    assert.equal(p.localStorage.getItem(KEYS.successes), null);
  }
});
test('success queue is bounded and expired successes never flush', () => {
  const p = platform(); p.visit(); p.app.choose('allowed');
  for (let i = 0; i < 25; i++) p.app.success(`${String(i).padStart(8, '0')}-1111-4111-8111-111111111111`, p.app.snapshot());
  p.ready(); assert.equal(p.commands.filter(c => c.name === 'lead_success').length, 20);
  const late = platform(); late.visit(); late.app.choose('allowed'); late.app.success(successId, late.app.snapshot());
  late.setTime(late.time() + 10000); late.ready();
  assert.equal(late.commands.filter(c => c.name === 'lead_success').length, 0);
});
test('failed postMessage does not mark sent and repeated success can try local transfer again', () => {
  const p = platform(); p.visit(); p.app.choose('allowed');
  const snapshot = p.app.snapshot(); p.app.success(successId, snapshot);
  const original = p.frames[0].contentWindow.postMessage;
  p.frames[0].contentWindow.postMessage = () => { throw Error('blocked'); };
  p.ready(); assert.equal(p.localStorage.getItem(KEYS.successes), null);
  p.frames[0].contentWindow.postMessage = original;
  p.app.success(successId, snapshot); p.app.success(successId, snapshot);
  assert.equal(p.commands.filter(c => c.name === 'lead_success').length, 1);
});
test('failed decision write removes old allowed: revoke, reload, reallow and other tab', () => {
  const s = storage(); const first = platform({ saved: s }); first.visit(); first.app.choose('allowed'); first.ready();
  const other = platform({ saved: s }); other.visit(); other.ready();
  const original = s.setItem; s.setItem = () => { throw Error('quota'); };
  first.app.choose('denied'); assert.equal(s.getItem(KEYS.consent), null);
  other.events.storage({ key: KEYS.consent }); assert.equal(other.frames[0].removed, true);
  const reload = platform({ saved: s }); reload.visit(); assert.equal(reload.frames.length, 0);
  reload.app.choose('allowed'); reload.ready(); assert.equal(reload.frames.length, 1);
  assert.equal(s.getItem(KEYS.consent), null); reload.events.focus(); assert.equal(reload.app.getChoice(), 'allowed');
  s.setItem = original; reload.app.choose('denied'); reload.app.choose('allowed');
  const savedAgain = platform({ saved: s }); savedAgain.visit(); assert.equal(savedAgain.frames.length, 1);
});
test('failed write and delete keeps current document denied, but old allowed can survive reload', () => {
  const s = storage(); const p = platform({ saved: s }); p.visit(); p.app.choose('allowed'); p.ready();
  s.setItem = s.removeItem = () => { throw Error('denied'); };
  p.app.choose('denied'); p.events.focus();
  const read = s.getItem; s.getItem = () => null; p.events.storage({ key: KEYS.consent });
  s.getItem = read; p.events.storage({ key: KEYS.consent }); p.visit();
  assert.equal(p.app.getChoice(), 'denied'); assert.equal(p.frames.length, 1); assert.equal(p.frames[0].removed, true);
  const reload = platform({ saved: s }); reload.visit(); assert.equal(reload.frames.length, 1);
  reload.app.choose('denied'); reload.app.choose('allowed'); reload.ready(); assert.equal(reload.frames.length, 2);
});
test('failed optional retry rewrite removes stale advertising but retains technical memory', () => {
  const s = storage(), time = 1800000000000;
  const submission = { id: successId, signature: 'a'.repeat(64) };
  const snapshot = { direction: { product: 'btp' }, attribution: createStore(storage(), () => time).capture('?utm_source=yandex') };
  const pending = createPending(s, () => time); pending.save(submission, snapshot, time);
  s.setItem = () => { throw Error('quota'); };
  pending.clearOptional(); assert.equal(s.getItem(PENDING_KEY), null);
  assert.equal(pending.get(submission.signature).id, successId); assert.equal(pending.get(submission.signature).attribution, null);
  assert.equal(createPending(s, () => time).get(submission.signature), null);
});
test('retry optional cleanup with write/delete blocked remains sanitized in memory only', () => {
  const s = storage(), time = 1800000000000;
  const submission = { id: successId, signature: 'a'.repeat(64) };
  const snapshot = { direction: { service: 'design' }, attribution: createStore(storage(), () => time).capture('?utm_source=yandex') };
  const pending = createPending(s, () => time); pending.save(submission, snapshot, time);
  s.setItem = s.removeItem = () => { throw Error('denied'); };
  pending.clearOptional(); assert.equal(pending.get(submission.signature).attribution, null);
  assert.ok(createPending(s, () => time).get(submission.signature).attribution);
});

test('privacy form entry marker never enters analytics URLs, attribution or params', () => {
  const p = platform();
  p.win.location.search = '?from=lead-form';
  p.visit('/privacy');
  p.app.choose('allowed');
  p.ready();
  const hit = p.commands.find(command => command.type === 'hit');
  assert.equal(hit.url, 'https://www.energoeffekt-rostov.ru/privacy');
  assert.deepEqual(campaign('?from=lead-form'), null);
  assert.deepEqual(safeParams({ from: 'lead-form', page_category: 'privacy' }), { page_category: 'privacy' });
  assert.ok(!JSON.stringify(p.commands).includes('lead-form'));
});
