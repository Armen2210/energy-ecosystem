// Run against Vite dev: uses the existing draft module to inspect in-memory File
// and retry identity, without adding any test hooks to the application bundle.
import { dismissCookies } from "./cookie-browser-helpers.mjs";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import process from "node:process";
import { documents } from "../src/data/documents.js";
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const origin = process.env.QUESTIONNAIRE_TEST_ORIGIN;
assert.match(origin || "", /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const output = process.env.QUESTIONNAIRE_OUTPUT || "/tmp/ee-scroll-downloads";
await mkdir(output, { recursive: true });
const example = JSON.parse(await readFile(new URL("../../../contracts/questionnaires/v1/examples/all-four.json", import.meta.url)));
const titles = {
  bmk: "Блочно-модульные котельные", btp: "Блочные тепловые пункты",
  vns: "Водопроводные насосные станции", pns: "Пожарные насосные станции",
};
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || undefined,
  headless: true, args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const results = [], errors = [];
const moduleUrls = new WeakMap();
function moduleUrl(page, path) {
  const url = moduleUrls.get(page).get(path);
  assert.ok(url, `App module was not loaded: ${path}`);
  return url;
}
async function context(width, height, { restored = false, product = "bmk", unavailable = false, delayEditor = false, failEditor = false } = {}) {
  const c = await browser.newContext({ viewport: { width, height }, hasTouch: width < 961, reducedMotion: "reduce" });
  let release, requested = false;
  const gate = new Promise(resolve => { release = resolve; });
  await c.route("**/*", async r => {
    const url = new URL(r.request().url());
    if (url.pathname === "/api/leads/questionnaire-capabilities/" && /^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(url.origin)) return r.fulfill({
      status: unavailable ? 503 : 200,
      json: unavailable ? {} : { version: 1, enabled: true, products: Object.keys(titles) },
    });
    if (url.origin !== origin) return r.abort();
    if (url.pathname === "/src/questionnaires/QuestionnaireEditor.jsx") {
      requested = true;
      if (failEditor) return r.abort();
      if (delayEditor) await gate;
    }
    assert.equal(r.request().method(), "GET", "browser suite must not send mail or create real leads");
    return r.continue();
  });
  if (restored) await c.addInitScript(({ example, product, titles }) => {
    if (sessionStorage.getItem("scroll-suite-seeded")) return;
    sessionStorage.setItem("scroll-suite-seeded", "1");
    sessionStorage.setItem("ee-lead-draft-v1", JSON.stringify({
      version: 1, changedAt: Date.now(), started: true,
      topic: titles[product], topicPage: `/solutions/${product}`, sourcePage: `/solutions/${product}`,
      fields: { name: "Synthetic scroll test", company_name: "", phone: "+70000000000", email: "", description: "", consent: false },
      questionnaires: Object.fromEntries(example.items.map(item => [item.product, {
        enabled: true, expanded: true, sheet: item.product === "bmk" ? "loads" : "common", answers: item.answers, scroll: {},
        pageScroll: { common: 240, loads: 600, technical: 330 },
      }])),
    }));
  }, { example, product, titles });
  const p = await c.newPage();
  const modules = new Map();
  moduleUrls.set(p, modules);
  p.on("request", request => { const url = new URL(request.url()); modules.set(url.pathname, url.href); });
  p.on("pageerror", e => { if (!failEditor) errors.push(e.message); });
  return { c, p, release, requested: () => requested };
}
async function open(p, product) {
  await p.goto(`${origin}/solutions/${product}`);
  await dismissCookies(p);
}
async function routeCommitted(p, product) {
  await p.waitForFunction(index => document.querySelectorAll(".entity-switcher__item")[index]?.getAttribute("aria-current") === "page", Object.keys(titles).indexOf(product));
  await settle(p);
}
async function settle(p) { await p.evaluate(() => new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))); }
async function place(p, selector, top = 180) {
  await p.locator(selector).evaluate((e, top) => window.scrollTo({ top: e.getBoundingClientRect().top + scrollY - top, behavior: "instant" }), top);
  await settle(p);
}
async function anchored(p, selector, action, label) {
  const before = await p.locator(selector).boundingBox();
  const scrollBefore = await p.evaluate(() => scrollY);
  await action();
  await settle(p);
  const after = await p.locator(selector).boundingBox();
  const state = await p.evaluate(() => ({ y: scrollY, max: document.documentElement.scrollHeight - innerHeight }));
  const delta = Math.abs(after.y - before.y);
  // Shrinking the document may naturally clamp the scroll position at either end.
  assert.ok(delta <= 1 || state.y <= 1 || Math.abs(state.y - state.max) <= 1,
    `${label}: anchor moved ${delta}px, scroll ${scrollBefore} -> ${state.y}`);
  results.push({ label, before: before.y, after: after.y, delta, ...state });
}
async function downloads(p, product, nativeDownload = false) {
  const doc = documents.find(d => d.categoryId === "questionnaires" && d.productSlug === product);
  const links = p.locator(".ql-header a");
  assert.equal(await links.count(), doc.files.length);
  for (const file of doc.files) {
    const link = links.filter({ hasText: file.format === "xlsx" ? "Excel" : "PDF" });
    assert.equal(await link.getAttribute("href"), file.url);
    assert.equal(await link.getAttribute("download"), "");
    assert.match(await link.getAttribute("aria-label"), new RegExp(product.toUpperCase().replace("VNS", "ВНС").replace("PNS", "ПНС").replace("BMK", "БМК").replace("BTP", "БТП")));
    const response = await p.request.get(origin + file.url);
    assert.equal(response.status(), 200);
    const bytes = await response.body();
    assert.equal(bytes.length, file.sizeBytes);
    const { createHash } = await import("node:crypto");
    assert.equal(createHash("sha256").update(bytes).digest("hex"), file.sha256);
    if (nativeDownload) {
      const event = p.waitForEvent("download");
      await link.click();
      const download = await event;
      assert.equal(await download.failure(), null);
      assert.equal(download.suggestedFilename(), file.url.split("/").at(-1));
      assert.equal(createHash("sha256").update(await readFile(await download.path())).digest("hex"), file.sha256);
      assert.equal(await p.getByRole("switch").filter({ visible: true }).getAttribute("aria-checked"), "false");
      assert.equal(await p.locator(".ql-body").isVisible(), false);
    }
  }
}
try {
  for (const width of [390, 1440]) {
    const { c, p } = await context(width, 844);
    try {
      await open(p, "bmk");
      await p.getByRole("button", { name: "Заполнить онлайн", exact: false }).click();
      const opener = p.getByRole("button", { name: "На весь экран" });
      await opener.click();
      const workspace = p.getByRole("dialog", { name: /Опросный лист/ });
      const section = workspace.getByRole("combobox", { name: "Раздел опросного листа" });
      const initial = await section.inputValue();
      const field = workspace.locator(".ql-fields input").first();
      await field.fill("17");
      await workspace.getByRole("button", { name: "Следующий лист" }).click();
      assert.notEqual(await section.inputValue(), initial);
      await workspace.getByRole("button", { name: "Предыдущий лист" }).click();
      assert.equal(await field.inputValue(), "17");
      if (width < 961) await workspace.getByRole("button", { name: "Свернуть опросный лист" }).click();
      else await p.keyboard.press("Escape");
      await workspace.waitFor({ state: "hidden" });
      assert.equal(await p.locator(".ql-fields input").first().inputValue(), "17");
      assert.equal(await opener.evaluate(button => document.activeElement === button), true);
    } finally {
      await c.close();
    }
  }
  for (const width of [360, 390]) for (const restored of [false, true]) for (const product of Object.keys(titles)) {
    console.log(`Checking ${width}/${product}/restored=${restored}`);
    const { c, p } = await context(width, 844, { restored, product });
    await open(p, product);
    if (restored) { await settle(p); assert.equal(await p.evaluate(() => scrollY), 0, `${product}: restored page must start at top`); }
    await p.locator(".ql-header").scrollIntoViewIfNeeded();
    await p.locator(".ql-nav").waitFor({ state: "attached" });
    await downloads(p, product, width === 360 && !restored);
    if (!restored) {
      assert.equal(await p.locator(".ql-body").isVisible(), false);
      await p.getByRole("button", { name: "Заполнить онлайн →", exact: true }).click();
      assert.equal(await p.getByRole("switch").filter({ visible: true }).getAttribute("aria-checked"), "true");
      if (product === "btp") for (const checkbox of await p.locator(".ql-composition input").all()) await checkbox.check();
    }
    const select = p.getByLabel("Раздел опросного листа", { exact: true });
    const sheets = await select.locator("option").evaluateAll(options => options.map(o => o.value));
    for (let i = 1; i < sheets.length; i++) {
      await place(p, ".ql-nav", 180 + (i % 2) * 55);
      await anchored(p, ".ql-nav", () => p.getByRole("button", { name: "Следующий лист", exact: true }).click(), `${width}/${product}/${restored}/next-${i}`);
      await place(p, ".ql-nav", 210);
      await anchored(p, ".ql-nav", () => p.getByRole("button", { name: "Предыдущий лист", exact: true }).click(), `${width}/${product}/${restored}/back-${i}`);
      await place(p, ".ql-nav", 170);
      await anchored(p, ".ql-nav", () => select.selectOption(sheets[i]), `${width}/${product}/${restored}/select-${i}`);
    }
    await place(p, ".ql-nav");
    if (sheets.length > 1) {
      await select.selectOption(sheets[0]);
      await anchored(p, ".ql-nav", () => p.locator(".ql-body").evaluate(e => {
        e.dispatchEvent(new TouchEvent("touchstart", { bubbles: true, touches: [new Touch({ identifier: 1, target: e, clientX: 280, clientY: 320 })] }));
        e.dispatchEvent(new TouchEvent("touchend", { bubbles: true, changedTouches: [new Touch({ identifier: 1, target: e, clientX: 100, clientY: 325 })] }));
      }), `${width}/${product}/${restored}/swipe`);
      assert.equal(await select.inputValue(), sheets[1]);
    }
    await place(p, ".ql-header", 170);
    await anchored(p, ".ql-header", () => p.getByRole("button", { name: "Свернуть опросный лист", exact: true }).click(), `${width}/${product}/${restored}/collapse`);
    await downloads(p, product);
    await anchored(p, ".ql-header", () => p.getByRole("button", { name: "Раскрыть опросный лист", exact: true }).click(), `${width}/${product}/${restored}/expand`);
    // A keyboard-like viewport resize must not reinstate an old pageScroll.
    await p.setViewportSize({ width, height: 510 });
    await place(p, ".ql-nav", 150);
    await anchored(p, ".ql-nav", () => select.selectOption(sheets[0]), `${width}/${product}/${restored}/keyboard-height`);
    await p.setViewportSize({ width, height: 844 });
    // Sticky navigation follows the measured header, including enlarged text.
    await p.addStyleTag({ content: ".header { padding-bottom: 19px !important; }" });
    await p.locator(".ql-body").evaluate(e => window.scrollTo({ top: e.getBoundingClientRect().top + scrollY + 100, behavior: "instant" }));
    await settle(p);
    const sticky = await p.evaluate(() => ({ nav: document.querySelector(".ql-nav").getBoundingClientRect().top, header: document.querySelector(".header").getBoundingClientRect().bottom }));
    assert.ok(Math.abs(sticky.nav - sticky.header) <= 1, JSON.stringify(sticky));
    // Ordinary switcher entry, then Back/Forward, must not restore legacy offsets.
    const destination = product === "bmk" ? "btp" : "bmk";
    await p.locator(".entity-switcher__item").nth(Object.keys(titles).indexOf(destination)).click();
    const historyPosition = await p.evaluate(() => scrollY);
    await p.waitForURL(`${origin}/solutions/${destination}`);
    await routeCommitted(p, destination);
    assert.equal(await p.evaluate(() => scrollY), 0, `${width}/${product}/switcher`);
    await p.goBack(); await routeCommitted(p, product);
    await p.waitForFunction(y => Math.abs(scrollY - y) <= 1, historyPosition);
    await p.goForward(); await routeCommitted(p, destination);
    await p.waitForFunction(() => scrollY <= 1);
    await c.close();
  }
  // Header links survive unavailable backend and delayed/failed editor imports.
  for (const mode of ["unavailable", "delayEditor", "failEditor"]) {
    const test = await context(390, 844, { [mode]: true });
    const { c, p } = test;
    await open(p, "bmk");
    if (mode === "delayEditor") assert.equal(test.requested(), false, "heavy editor must be deferred above the fold");
    await p.locator(".ql-header").scrollIntoViewIfNeeded();
    await downloads(p, "bmk");
    if (mode === "unavailable") assert.equal(await p.locator(".ql-online-action").isDisabled(), true);
    if (mode === "delayEditor") {
      const before = await p.evaluate(() => scrollY);
      test.release();
      await p.locator(".ql-nav").waitFor({ state: "attached" });
      await settle(p);
      assert.equal(await p.evaluate(() => scrollY), before, "late editor must not move the page");
    }
    if (mode === "failEditor") await p.getByRole("button", { name: "Повторить загрузку" }).waitFor();
    await p.screenshot({ path: `${output}/mobile-${mode}.png` });
    test.release(); await c.close();
  }
  // Downloads preserve all in-memory data, including File identity and retry state.
  for (const restored of [false, true]) {
    const { c, p } = await context(390, 844, { restored });
    await open(p, "bmk"); await p.locator(".ql-header").scrollIntoViewIfNeeded();
    await p.locator(".ql-nav").waitFor({ state: "attached" });
    await p.evaluate(async draftUrl => {
      const { leadDraft } = await import(draftUrl);
      window.scrollTestFile = new File(["synthetic"], "synthetic.txt", { type: "text/plain" });
      leadDraft.update({ files: [{ id: "synthetic-file", file: window.scrollTestFile }],
        submission: { id: "bd587f65-e49d-4977-8f57-ec30eb400e29", signature: "synthetic" }, indeterminate: true }, { content: false });
      window.scrollTestDraft = leadDraft.get();
    }, moduleUrl(p, "/src/api/leadDraft.js"));
    const downloadEvent = p.waitForEvent("download");
    await p.locator(".ql-header a").first().click();
    const download = await downloadEvent; assert.equal(await download.failure(), null);
    assert.equal(await p.evaluate(async draftUrl => {
      const { leadDraft } = await import(draftUrl);
      const d = leadDraft.get(), before = window.scrollTestDraft;
      return d.questionnaires === before.questionnaires && d.fields === before.fields && d.files === before.files &&
        d.files[0].file === window.scrollTestFile && d.submission === before.submission && d.indeterminate;
    }, moduleUrl(p, "/src/api/leadDraft.js")), true);
    await p.evaluate(async draftUrl => { const { leadDraft } = await import(draftUrl); leadDraft.update({ submitting: true }, { content: false }); }, moduleUrl(p, "/src/api/leadDraft.js"));
    await p.waitForFunction(() => document.querySelector(".ql-expand")?.disabled);
    assert.equal(await p.locator(".ql-expand").isDisabled(), true);
    assert.equal(await p.getByRole("switch").filter({ visible: true }).isDisabled(), true);
    await downloads(p, "bmk");
    if (!restored) assert.equal(await p.locator(".ql-online-action").isDisabled(), true);
    await c.close();
  }
  // Manual direction changes and restored manual choice use the same registry.
  {
    const { c, p } = await context(390, 844, { restored: true });
    await open(p, "bmk");
    await p.locator(".ql-header").scrollIntoViewIfNeeded();
    await p.locator(".ql-nav").waitFor({ state: "attached" });
    for (const product of ["vns", "pns", "btp", "bmk"]) {
      await p.locator(".topic-select__button").click();
      await p.locator(".topic-select__menu").getByRole("button", { name: titles[product], exact: true }).click();
      await p.waitForFunction(title => document.querySelector(".ql-header strong")?.textContent === title, "Опросный лист " + ({ bmk: "БМК", btp: "БТП", vns: "ВНС", pns: "ПНС" })[product]);
      await downloads(p, product);
    }
    await p.locator(".topic-select__button").click();
    const unsupported = p.locator(".topic-select__menu button").filter({ hasText: "Шкафы" });
    await unsupported.click(); await settle(p);
    assert.equal(await p.locator(".ql-downloads").count(), 0);
    await p.locator(".topic-select__button").click();
    await p.locator(".topic-select__menu").getByRole("button", { name: titles.pns, exact: true }).click();
    await p.reload();
    await p.locator(".ql-header").scrollIntoViewIfNeeded();
    await p.waitForFunction(() => document.querySelector(".ql-header strong")?.textContent === "Опросный лист ПНС");
    await downloads(p, "pns");
    // Explicit summary navigation still reveals an OL, rather than restoring a saved page offset.
    await p.locator(".ql-summary button").filter({ hasText: "БМК" }).click();
    await p.waitForFunction(() => document.querySelector(".ql-header strong")?.textContent === "Опросный лист БМК");
    await settle(p);
    const visible = await p.evaluate(() => ({ panel: document.querySelector(".ql-header").getBoundingClientRect().top, header: document.querySelector(".header").getBoundingClientRect().bottom }));
    assert.ok(visible.panel >= visible.header && visible.panel < visible.header + 20, JSON.stringify(visible));
    // Validation is a separate, intentional scroll and focus operation.
    await p.evaluate(async ({ stateUrl, productsUrl }) => {
      const { openFirstError } = await import(stateUrl);
      const { products } = await import(productsUrl);
      openFirstError({ "bmk.loads.heating": "Synthetic validation error" }, products);
    }, { stateUrl: moduleUrl(p, "/src/questionnaires/state.js"), productsUrl: moduleUrl(p, "/src/data/products.js") });
    await p.waitForFunction(() => document.activeElement?.getAttribute("aria-invalid") === "true");
    const focus = await p.evaluate(() => ({ top: document.activeElement.getBoundingClientRect().top, bottom: document.activeElement.getBoundingClientRect().bottom,
      sticky: document.querySelector(".header").getBoundingClientRect().height + document.querySelector(".ql-nav").getBoundingClientRect().height }));
    assert.ok(focus.top >= focus.sticky && focus.bottom < 844, JSON.stringify(focus));
    await place(p, ".ql-nav", 200);
    await anchored(p, ".ql-nav", () => p.getByRole("button", { name: "Следующий лист", exact: true }).click(), "after-validation/next");
    await place(p, ".ql-nav", 240);
    await anchored(p, ".ql-nav", () => p.getByRole("button", { name: "Предыдущий лист", exact: true }).click(), "after-validation/back-no-replay");
    await c.close();
  }
  assert.deepEqual(errors, []);
  await writeFile(`${output}/scroll-results.json`, JSON.stringify(results, null, 2));
  console.log(`Passed ${results.length} viewport-anchor checks, 16 product/draft/mobile combinations, downloads and availability checks.`);
} finally { await browser.close(); }
