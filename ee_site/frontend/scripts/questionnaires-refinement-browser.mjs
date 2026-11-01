import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { serializeQuestionnaires } from "../src/questionnaires/domain.js";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const origin = process.env.QUESTIONNAIRE_TEST_ORIGIN,
  apiOrigin = process.env.QUESTIONNAIRE_TEST_API_ORIGIN;
for (const url of [origin, apiOrigin])
  assert.match(url || "", /^http:\/\/(?:127\.0\.0\.1|localhost):[0-9]+$/);
const output = process.env.QUESTIONNAIRE_OUTPUT || "/tmp/ee-refinement";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 390, height: 900 },
  hasTouch: true,
  reducedMotion: "reduce",
  permissions: ["clipboard-read", "clipboard-write"],
});
const page = await context.newPage(),
  errors = [],
  requests = [];
page.on("pageerror", (e) => errors.push(e.message));
let gateway = true;
const draft = () =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem("ee-lead-draft-v1")));
await context.route("**/*", async (route) => {
  const request = route.request(),
    url = new URL(request.url());
  if (![origin, apiOrigin].includes(url.origin)) return route.abort();
  if (url.pathname === "/api/leads/" && request.method() === "POST") {
    const raw = request.postDataBuffer(),
      text = raw.toString();
    const match = text.match(/name="questionnaires"\r\n\r\n([^\r]+)/);
    assert.ok(match, "actual multipart must contain questionnaires");
    const payload = JSON.parse(match[1]);
    assert.deepEqual(
      payload.items.map((i) => i.product),
      ["pns", "vns"],
    );
    assert.equal(
      payload.items.find((i) => i.product === "vns").answers.technical.flow,
      "12,5",
    );
    const key = text.match(/name="submission_id"\r\n\r\n([^\r]+)/)[1];
    const response = await route.fetch(),
      data = await response.json();
    assert.ok([200, 201].includes(response.status()), JSON.stringify(data));
    assert.deepEqual(data.questionnaires, {
      version: 1,
      products: ["pns", "vns"],
    });
    requests.push({ key, status: response.status(), data, payload });
    await writeFile(output + "/multipart.bin", raw);
    await writeFile(
      output + "/packet.json",
      JSON.stringify(
        {
          id: data.id,
          submission_id: key,
          payload,
          enabled: Object.fromEntries(
            Object.entries((await draft()).questionnaires).map(([k, q]) => [
              k,
              q.enabled,
            ]),
          ),
        },
        null,
        2,
      ),
    );
    if (gateway) {
      gateway = false;
      return route.fulfill({
        status: 502,
        contentType: "text/html",
        body: "Synthetic lost response after commit",
      });
    }
    return route.fulfill({ response });
  }
  return route.continue();
});
const toggle = () => page.getByRole("switch").filter({ visible: true }),
  panel = () => page.locator(".ql-panel");
async function shot(name) {
  await page
    .locator(".ql-header")
    .evaluate((e) => e.scrollIntoView({ block: "start" }));
  await page.screenshot({ path: output + "/" + name + ".png" });
}
try {
  await page.goto(origin + "/solutions/vns");
  await page
    .getByRole("button", { name: "Без аналитики", exact: true })
    .click();
  await toggle().waitFor();
  assert.equal(await panel().locator(".ql-body").isVisible(), false);
  await toggle().click();
  const count = page.getByLabel("Количество резервных насосов");
  await count.fill("123");
  await count.evaluate((e) => e.setSelectionRange(1, 2));
  await page.keyboard.type("9");
  assert.equal(await count.inputValue(), "193");
  const caret = await count.evaluate((e) => e.selectionStart);
  await page.keyboard.type("x");
  assert.equal(await count.inputValue(), "193");
  assert.equal(await count.evaluate((e) => e.selectionStart), caret);
  await count.selectText();
  await page.evaluate(() => navigator.clipboard.writeText("7kg"));
  await page.keyboard.press("Control+V");
  assert.equal(await count.inputValue(), "193");
  await count.fill("2.5");
  assert.equal(await count.inputValue(), "193");
  await count.fill("");
  await count.fill("0");
  await page
    .getByLabel("Суммарная подача установки при работе основных насосов")
    .fill("12,5");
  await page.getByLabel("Требуемый напор").fill("40");
  await page.getByRole("button", { name: "Свернуть опросный лист" }).click();
  assert.equal(await toggle().getAttribute("aria-checked"), "true");
  await shot("mobile-enabled-collapsed");
  await page.reload();
  await toggle().waitFor();
  assert.equal(await toggle().getAttribute("aria-checked"), "true");
  assert.equal(await panel().locator(".ql-body").isVisible(), false);
  await page.getByRole("button", { name: "Раскрыть опросный лист" }).click();
  await toggle().click();
  assert.equal(await panel().locator(".ql-body").isVisible(), false);
  assert.equal(
    (await draft()).questionnaires.vns.answers.technical.flow,
    "12,5",
  );
  await toggle().click();
  await page.locator("input[name=name]").fill("Synthetic two OL refinement");
  await page.locator("input[name=phone]").fill("+70000000000");
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "synthetic.txt",
      mimeType: "text/plain",
      buffer: Buffer.from("Synthetic attachment"),
    });
  const fileCaption = await page.locator(".file-select__value").innerText();
  await page
    .locator(".entity-switcher__item")
    .filter({ visible: true })
    .nth(3)
    .click();
  await page.waitForURL("**/solutions/pns");
  await page.waitForFunction(
    () =>
      document.querySelector("[name=description_topic]").value ===
      "Пожарные насосные станции",
  );
  await page.locator(".topic-select__button").click();
  await page
    .getByRole("listbox")
    .getByRole("button", { name: "Блочно-модульные котельные", exact: true })
    .click();
  await page.locator("input[name=company_name]").fill("Synthetic company");
  assert.equal(
    await page.locator("[name=description_topic]").inputValue(),
    "Блочно-модульные котельные",
  );
  await page.goBack();
  await page.waitForURL("**/solutions/vns");
  await page.waitForFunction(
    () =>
      document.querySelector("[name=description_topic]").value ===
      "Водопроводные насосные станции",
  );
  await page.goForward();
  await page.waitForURL("**/solutions/pns");
  await page.waitForFunction(
    () =>
      document.querySelector("[name=description_topic]").value ===
      "Пожарные насосные станции",
  );
  assert.equal(
    await page.locator(".file-select__value").innerText(),
    fileCaption,
  );
  await toggle().click();
  await page
    .getByLabel("Суммарная подача установки при работе основных насосов")
    .fill("10");
  await page.getByLabel("Требуемый напор", { exact: false }).first().fill("30");
  await page.getByLabel("Жокей-насос нужен?").selectOption("Нет");
  assert.equal(await page.locator(".ql-summary button").count(), 2);
  await shot("mobile-pns-expanded");
  const geometry = await page.locator(".ql-nav").evaluate((nav) => {
    const a = nav.querySelector("select").getBoundingClientRect(),
      b = nav.querySelector(".ql-paging").getBoundingClientRect();
    return { selectBottom: a.bottom, pagingTop: b.top };
  });
  assert.ok(
    geometry.pagingTop >= geometry.selectBottom - 1,
    JSON.stringify(geometry),
  );
  assert.ok(
    await page
      .getByRole("button", { name: "Следующий лист" })
      .getByText("Далее")
      .isVisible(),
  );
  await page.locator(".ql-summary button").filter({ hasText: "ВНС" }).click();
  await toggle().click();
  let state = await draft();
  assert.equal(state.questionnaires.vns.enabled, false);
  assert.deepEqual(
    serializeQuestionnaires(state.questionnaires).items.map((i) => i.product),
    ["pns"],
  );
  assert.equal(state.questionnaires.vns.answers.technical.flow, "12,5");
  await toggle().click();
  await page.locator(".ql-summary button").filter({ hasText: "ПНС" }).click();
  assert.equal(
    await page.locator(".file-select__value").innerText(),
    fileCaption,
  );
  state = await draft();
  assert.equal(state.questionnaires.vns.enabled, true);
  assert.equal(state.questionnaires.pns.enabled, true);
  await writeFile(
    output + "/before-submit.json",
    JSON.stringify(state, null, 2),
  );
  await page.locator("input[name=consent]").check();
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await page.locator(".lead-form__status--error").waitFor();
  assert.equal((await draft()).indeterminate, true);
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await page.locator(".lead-form__status--success").waitFor();
  assert.equal(requests.length, 2);
  assert.equal(requests[0].key, requests[1].key);
  assert.equal(requests[0].data.id, requests[1].data.id);
  assert.equal(requests[1].status, 200);
  assert.deepEqual(errors, []);
  console.log(
    "PASS numeric keyboard/paste/mobile fallback/caret; mobile state/reload; route topic/Back/Forward; real multipart 2 OL + file; same-id retry",
  );
} finally {
  await browser.close();
}
