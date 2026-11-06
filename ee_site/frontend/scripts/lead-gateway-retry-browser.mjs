import { dismissCookies } from "./cookie-browser-helpers.mjs";
import assert from "node:assert/strict";
import process from "node:process";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
// Only an isolated local backend with locmem email. The upstream really commits
// before we replace its response with 502; this is not a fake successful save.
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext();
const page = await context.newPage();
let gatewayNext = false,
  limitNext = false,
  unrecognisedConflictNext = false,
  acceptWarning = false;
const calls = [],
  warnings = [],
  pageErrors = [];
page.on("pageerror", (e) => pageErrors.push(e.message));
page.on("dialog", async (dialog) => {
  assert.match(dialog.message(), /Предыдущая отправка могла быть принята/);
  warnings.push(dialog.message());
  await (acceptWarning ? dialog.accept() : dialog.dismiss());
});
await context.route("**/*", async (route) => {
  const req = route.request(),
    url = new URL(req.url());
  if (!["http://127.0.0.1:5173", "http://127.0.0.1:8000"].includes(url.origin))
    return route.abort();
  if (url.pathname !== "/api/leads/" || req.method() !== "POST")
    return route.continue();
  const key = req
    .postDataBuffer()
    .toString()
    .match(/name="submission_id"\r\n\r\n([^\r]+)/)?.[1];
  assert.ok(key);
  if (limitNext) {
    limitNext = false;
    calls.push({ key, forwarded: false, status: 429 });
    return route.fulfill({
      status: 429,
      contentType: "application/json",
      body: JSON.stringify({ code: "lead_rate_limited", retry_after: 1 }),
    });
  }
  if (unrecognisedConflictNext) {
    unrecognisedConflictNext = false;
    calls.push({ key, forwarded: false, status: 409 });
    return route.fulfill({
      status: 409,
      contentType: "text/html",
      body: "Unrecognised proxy response",
    });
  }
  const upstream = await route.fetch(),
    data = await upstream.json();
  assert.ok([200, 201].includes(upstream.status()), JSON.stringify(data));
  calls.push({ key, forwarded: true, status: upstream.status(), data });
  if (gatewayNext) {
    gatewayNext = false;
    return route.fulfill({
      status: 502,
      contentType: "text/html",
      body: "Synthetic gateway error AFTER upstream commit",
    });
  }
  return route.fulfill({ response: upstream });
});
const form = () => page.locator(".lead-form");
const submit = () =>
  form().getByRole("button", { name: "Отправить заявку", exact: true }).click();
const state = () =>
  page.evaluate(() => JSON.parse(sessionStorage.getItem("ee-lead-draft-v1")));
async function fill(name) {
  await form().locator("[name=name]").fill(name);
  await form().locator("[name=phone]").fill("+70000000000");
  await form().locator("[name=consent]").check();
}
async function saved502(name) {
  await fill(name);
  gatewayNext = true;
  await submit();
  await form().locator(".lead-form__status--error").waitFor();
  assert.equal((await state()).indeterminate, true);
  assert.equal(calls.at(-1).status, 201);
  return calls.at(-1);
}
try {
  await page.goto("http://127.0.0.1:5173/solutions/vns");
  await dismissCookies(page);
  const first = await saved502("Gateway unchanged retry synthetic");
  await page.reload();
  await page.waitForFunction(
    () =>
      document.querySelector(".lead-form [name=name]")?.value ===
      "Gateway unchanged retry synthetic",
  );
  assert.equal((await state()).submission.id, first.key);
  assert.equal((await state()).indeterminate, true);
  await form().locator("[name=consent]").check();
  await submit();
  await form().locator(".lead-form__status--success").waitFor();
  assert.equal(calls.at(-1).key, first.key);
  assert.equal(calls.at(-1).status, 200);
  assert.equal(calls.at(-1).data.id, first.data.id);
  assert.equal(calls.at(-1).data.duplicate, true);
  assert.equal(warnings.length, 0);
  console.log(
    "PASS commit -> 502 -> reload -> unchanged retry: same UUID and DB id, duplicate 200",
  );
  const second = await saved502("Gateway changed retry synthetic");
  await form().locator("[name=company_name]").fill("Changed after 502");
  let count = calls.length;
  await submit();
  await page.waitForFunction(
    () => !document.querySelector(".lead-form button[type=submit]").disabled,
  );
  assert.equal(warnings.length, 1);
  assert.equal(calls.length, count);
  assert.equal((await state()).submission.id, second.key);
  assert.equal((await state()).indeterminate, true);
  acceptWarning = true;
  await submit();
  await form().locator(".lead-form__status--success").waitFor();
  assert.notEqual(calls.at(-1).key, second.key);
  assert.notEqual(calls.at(-1).data.id, second.data.id);
  assert.equal(warnings.length, 2);
  console.log(
    "PASS edit after saved 502: cancel sends no POST; only explicit approval permits new UUID",
  );
  acceptWarning = false;
  const third = await saved502("Gateway then limited synthetic");
  limitNext = true;
  await submit();
  await form().locator(".lead-form__status--error").waitFor();
  assert.equal((await state()).indeterminate, true);
  assert.equal(calls.at(-1).key, third.key);
  unrecognisedConflictNext = true;
  await submit();
  await form().locator(".lead-form__status--error").waitFor();
  assert.equal((await state()).indeterminate, true);
  assert.equal((await state()).submission.id, third.key);
  await form()
    .locator("[name=description]")
    .fill("Changed after uncertain retry was limited");
  count = calls.length;
  await submit();
  await page.waitForFunction(
    () => !document.querySelector(".lead-form button[type=submit]").disabled,
  );
  assert.equal(warnings.length, 3);
  assert.equal(calls.length, count);
  assert.deepEqual(pageErrors, []);
  console.log(
    "PASS later 429/unrecognised 409 do not erase prior uncertainty or bypass edit warning",
  );
} finally {
  await browser.close();
}
