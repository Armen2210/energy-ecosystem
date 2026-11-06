import { dismissCookies } from "./cookie-browser-helpers.mjs";
import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const origin = process.env.FINAL_TEST_ORIGIN,
  before = process.env.FINAL_BEFORE_ORIGIN;
for (const o of [origin, before])
  assert.match(o || "", /^http:\/\/(127\.0\.0\.1|localhost):\d+$/);
const output = process.env.FINAL_OUTPUT || "/tmp/ee-final-package";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const errors = [],
  network = [];
async function context(options = {}) {
  const c = await browser.newContext({ reducedMotion: "reduce", ...options });
  await c.route("**/*", (r) =>
    [origin, before].includes(new URL(r.request().url()).origin)
      ? r.continue()
      : r.abort(),
  );
  return c;
}
async function pageFor(c) {
  const p = await c.newPage();
  p.on("pageerror", (e) => errors.push(e.message));
  return p;
}
async function noOverflow(p) {
  assert.ok(
    await p.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
    "horizontal overflow",
  );
}
try {
  for (const o of [before, origin]) {
    const c = await context({ viewport: { width: 1440, height: 900 } }),
      p = await pageFor(c),
      requests = [];
    p.on("request", (r) => {
      if (r.resourceType() === "script")
        requests.push({ url: new URL(r.url()).pathname, time: Date.now() });
    });
    await p.goto(o + "/");
    await p.locator(".lead-form").waitFor();
    await p.waitForTimeout(200);
    network.push({
      origin: o,
      page: "home",
      phase: "initial",
      requests: [...requests],
    });
    if (o === origin)
      assert.ok(!requests.some((r) => r.url.includes("QuestionnaireEditor")));
    requests.length = 0;
    await p.goto(o + "/solutions/bmk");
    await p.waitForTimeout(200);
    network.push({
      origin: o,
      page: "product",
      phase: "initial",
      requests: [...requests],
    });
    if (o === origin)
      assert.ok(!requests.some((r) => r.url.includes("QuestionnaireEditor")));
    await p.locator(".questionnaire-column").scrollIntoViewIfNeeded();
    await p.locator(".ql-panel").waitFor();
    network.push({
      origin: o,
      page: "product",
      phase: "near-editor",
      requests: [...requests],
    });
    if (o === origin)
      assert.equal(
        requests.filter((r) => r.url.includes("QuestionnaireEditor")).length,
        1,
      );
    await c.close();
  }
  console.log(
    "PASS production initial requests and viewport-triggered deferred editor",
  );
  for (const [width, height, label] of [
    [1440, 900, "desktop"],
    [820, 1180, "tablet"],
    [390, 844, "mobile"],
  ]) {
    const c = await context({ viewport: { width, height } }),
      p = await pageFor(c);
    for (const catalog of ["solutions", "services"]) {
      await p.goto(origin + "/" + catalog);
      await p.locator("main h1").waitFor();
      await dismissCookies(p);
      await noOverflow(p);
      await p.screenshot({
        path: `${output}/${catalog}-${label}.png`,
        fullPage: true,
      });
      const card = p
        .locator(catalog === "solutions" ? ".product-card" : ".service-card")
        .first();
      await card.click();
      await p.waitForURL("**/" + catalog + "/*");
      await p
        .locator(`.page-navigation__breadcrumb-link[href="/${catalog}"]`)
        .waitFor();
      assert.equal(
        await p
          .locator(".page-navigation__breadcrumb-link")
          .last()
          .getAttribute("href"),
        "/" + catalog,
      );
      await p.goBack();
      await p.waitForURL("**/" + catalog);
      await p.goForward();
      await p.waitForURL("**/" + catalog + "/*");
    }
    await p.goto(origin + "/about");
    await p.locator(".about-page__portrait").waitFor();
    await noOverflow(p);
    assert.deepEqual(
      await p
        .locator("[data-photo]")
        .evaluateAll((items) => items.map((e) => Number(e.dataset.photo))),
      Array.from({ length: 27 }, (_, i) => i + 1),
    );
    const portrait = p.locator(".about-page__portrait");
    assert.equal(await portrait.evaluate((e) => e.closest("button,a")), null);
    assert.equal(await p.getByRole("button", { name: /Увеличить/ }).count(), 0);
    assert.equal(await p.locator("dialog").count(), 0);
    await p.screenshot({ path: `${output}/director-${label}.png` });

    // Visit every image: check decoded orientation/ratio and stable natural flow.
    let previous = { top: -1, left: -1 };
    for (const image of await p.locator(".about-page__gallery img").all()) {
      await image.scrollIntoViewIfNeeded();
      await image.evaluate((e) => e.decode());
      const box = await image.evaluate((e) => ({
        top: e.getBoundingClientRect().top + scrollY,
        left: e.getBoundingClientRect().left,
        width: e.width,
        height: e.height,
        naturalWidth: e.naturalWidth,
        naturalHeight: e.naturalHeight,
        src: e.currentSrc,
        alt: e.alt,
      }));
      assert.ok(box.top >= previous.top - 1, "visual order");
      if (Math.abs(box.top - previous.top) < 1)
        assert.ok(box.left > previous.left);
      assert.ok(
        Math.abs(
          box.width / box.height - box.naturalWidth / box.naturalHeight,
        ) < 0.02,
      );
      assert.ok(!box.src.includes("gallery-source"));
      previous = box;
    }
    await p.locator(".about-page__gallery").evaluate((e) =>
      window.scrollTo({
        top:
          e.getBoundingClientRect().top +
          scrollY -
          document.querySelector(".header").getBoundingClientRect().height -
          16,
        behavior: "instant",
      }),
    );
    await p.screenshot({ path: `${output}/gallery-${label}.png` });
    await p.getByRole("link", { name: "Обсудить проект", exact: true }).click();
    await p.waitForURL("**/#contacts");
    await noOverflow(p);
    await c.close();
  }
  console.log(
    "PASS desktop/tablet/mobile catalogs, director, 27 images, natural order, CTA, no viewer/overflow",
  );
  const c = await context({
      javaScriptEnabled: false,
      viewport: { width: 1440, height: 900 },
    }),
    p = await c.newPage();
  for (const catalog of ["solutions", "services"]) {
    const response = await p.goto(origin + "/" + catalog);
    assert.equal(response.status(), 200);
    assert.equal(new URL(p.url()).pathname, "/" + catalog);
    await p
      .locator(catalog === "solutions" ? ".product-card" : ".service-card")
      .first()
      .click();
    await p.waitForURL("**/" + catalog + "/*");
    await p.locator(".page-navigation__breadcrumb-link").last().click();
    await p.waitForURL("**/" + catalog);
    assert.equal(
      await p
        .locator(".footer__nav a")
        .filter({ hasText: catalog === "solutions" ? "Продукция" : "Услуги" })
        .getAttribute("href"),
      "/" + catalog,
    );
  }
  await c.close();
  console.log(
    "PASS direct prerendered catalogs and link navigation without JavaScript",
  );
  const fixture = JSON.parse(
    await readFile(
      new URL(
        "../../../contracts/questionnaires/v1/examples/pumps.json",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  const f = await context({ viewport: { width: 1440, height: 900 } });
  const seed = (target) =>
    target.addInitScript(
      ({ fixture }) => {
        if (sessionStorage.getItem("failure-seeded")) return;
        sessionStorage.setItem("failure-seeded", "yes");
        sessionStorage.setItem(
          "ee-lead-draft-v1",
          JSON.stringify({
            version: 1,
            changedAt: Date.now(),
            fields: {
              name: "Synthetic module failure",
              company_name: "Synthetic",
              phone: "+70000000000",
              email: "module@example.invalid",
              description: "Local test",
              consent: false,
            },
            topic: "Водопроводные насосные станции",
            topicPage: "/solutions/vns",
            sourcePage: "/solutions/vns",
            started: true,
            questionnaires: Object.fromEntries(
              fixture.items.map((i) => [
                i.product,
                {
                  enabled: true,
                  expanded: true,
                  answers: i.answers,
                  scroll: {},
                },
              ]),
            ),
          }),
        );
      },
      { fixture },
    );
  await seed(f);
  const h = await context({ viewport: { width: 1440, height: 900 } });
  await seed(h);
  const hp = await pageFor(h),
    homeScripts = [];
  hp.on("request", (request) => {
    if (request.resourceType() === "script") homeScripts.push(request.url());
  });
  await hp.goto(origin + "/");
  await hp.locator(".ql-summary button").first().waitFor();
  assert.equal(await hp.locator(".ql-summary button").count(), 2);
  assert.ok(!homeScripts.some((url) => url.includes("QuestionnaireEditor")));
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  await h.route("**/assets/QuestionnaireEditor-*.js", async (route) => {
    await gate;
    await route.continue();
  });
  await hp.locator(".ql-summary button").first().click();
  await hp
    .getByText("Загружаем редактор опросного листа…", { exact: true })
    .waitFor();
  await hp.locator("[name=company_name]").fill("Synthetic while loading");
  release();
  await hp.locator(".ql-panel").waitFor();
  assert.equal(
    await hp.locator("[name=company_name]").inputValue(),
    "Synthetic while loading",
  );
  assert.equal(await hp.locator(".ql-summary button").count(), 2);
  await h.close();
  console.log(
    "PASS restored home summary loads no editor; delayed editor keeps shared edits and sheets",
  );
  await f.route("**/assets/QuestionnaireEditor-*.js", (r) => r.abort("failed"));
  const fail = await pageFor(f);
  await fail.goto(origin + "/solutions/vns");
  await fail
    .getByText("Не удалось загрузить редактор.", { exact: false })
    .waitFor();
  await fail.locator("[type=file]").setInputFiles({
    name: "synthetic-module.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Synthetic file"),
  });
  const getDraft = () =>
    fail.evaluate(() => JSON.parse(sessionStorage.getItem("ee-lead-draft-v1")));
  assert.equal(Object.keys((await getDraft()).questionnaires).length, 2);
  await fail.getByRole("button", { name: "Повторить загрузку" }).click();
  await fail
    .getByText("Не удалось загрузить редактор.", { exact: false })
    .waitFor();
  assert.equal(
    await fail.locator("[name=name]").inputValue(),
    "Synthetic module failure",
  );
  await fail.locator("[name=consent]").check();
  const packets = [];
  await f.route("**/api/leads/", async (r) => {
    if (r.request().method() !== "POST") return r.continue();
    const text = r.request().postDataBuffer().toString();
    const q = JSON.parse(
      text.match(/name="questionnaires"\r\n\r\n([^\r]+)/)[1],
    );
    assert.ok(text.includes('filename="synthetic-module.txt"'));
    const uuid = text.match(/name="submission_id"\r\n\r\n([^\r]+)/)[1];
    assert.deepEqual(q.items.map((i) => i.product).sort(), ["pns", "vns"]);
    packets.push({ uuid, q });
    await r.fulfill({
      status: 502,
      contentType: "text/html",
      body: "Synthetic uncertain gateway",
    });
  });
  await fail
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await fail.locator(".lead-form__status--error").waitFor();
  const pending = await getDraft();
  assert.ok(pending.indeterminate);
  assert.ok(pending.submission.id);
  assert.equal(pending.questionnaires.vns.enabled, true);
  await fail
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await fail.locator(".lead-form__status--error").waitFor();
  assert.equal(packets.length, 2);
  assert.equal(packets[0].uuid, packets[1].uuid);
  assert.deepEqual(packets[0].q, packets[1].q);

  await fail.locator(".questionnaire-column").scrollIntoViewIfNeeded();
  await fail.screenshot({ path: output + "/editor-load-error.png" });
  await writeFile(
    output + "/module-failure-packets.json",
    JSON.stringify(packets, null, 2),
  );
  await f.close();
  console.log(
    "PASS failed module retains contacts/files/2 sheets/UUID and sends both on unchanged uncertain retry",
  );
  assert.deepEqual(errors, []);
  await writeFile(output + "/network.json", JSON.stringify(network, null, 2));
} finally {
  await browser.close();
}
