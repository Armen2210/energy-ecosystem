import { dismissCookies } from "./cookie-browser-helpers.mjs";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const out =
  process.env.QUESTIONNAIRE_OUTPUT || "/tmp/ee-questionnaires-browser";
await mkdir(out, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
});
const page = await ctx.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await ctx.route("**/*", (r) => {
  const u = new URL(r.request().url());
  return ["http://127.0.0.1:5173", "http://127.0.0.1:8000"].includes(u.origin)
    ? r.continue()
    : r.abort();
});
async function switchOn() {
  await page
    .getByRole("switch", { name: "Электронный опросный лист", exact: true })
    .filter({ visible: true })
    .click();
}
async function topic(name) {
  await page.locator(".topic-select__button").click();
  await page
    .getByRole("listbox")
    .getByRole("button", { name, exact: true })
    .click();
}
async function capture(name) {
  await page.screenshot({ path: out + "/" + name + ".png" });
}
try {
  await page.goto("http://127.0.0.1:5173/solutions/vns");
  await dismissCookies(page);
  await page.getByRole("switch").filter({ visible: true }).waitFor();
  await page.locator("#lead-form").scrollIntoViewIfNeeded();
  await capture("desktop-off-1440");
  await switchOn();
  await page
    .getByLabel("Суммарная подача установки при работе основных насосов")
    .fill("12,5");
  await page.getByLabel("Требуемый напор").fill("40");
  await page.getByLabel("Количество резервных насосов").fill("0");
  await page.locator("input[type=file]").setInputFiles({
    name: "synthetic.txt",
    mimeType: "text/plain",
    buffer: Buffer.from("Synthetic test attachment"),
  });
  await topic("Пожарные насосные станции");
  await switchOn();
  await page
    .getByLabel("Суммарная подача установки при работе основных насосов")
    .fill("10");
  await page.getByLabel("Требуемый напор", { exact: false }).first().fill("30");
  await page.getByLabel("Жокей-насос нужен?").selectOption("Да");
  await page.getByLabel("Подача жокей-насоса").fill("1");
  await page.getByLabel("Требуемый напор жокей-насоса").fill("20");
  await page.getByLabel("Жокей-насос нужен?").selectOption("Нет");
  assert.equal(await page.getByLabel("Подача жокей-насоса").count(), 0);
  await page.getByLabel("Жокей-насос нужен?").selectOption("Да");
  assert.equal(await page.getByLabel("Подача жокей-насоса").inputValue(), "1");
  assert.equal(await page.locator(".ql-summary button").count(), 2);
  await capture("desktop-pumps-multi");
  await topic("Шкафы управления и автоматизации");
  assert.equal(await page.locator(".ql-panel").count(), 0);
  await page.locator(".ql-summary button").filter({ hasText: "ВНС" }).click();
  assert.equal(
    await page
      .getByLabel("Суммарная подача установки при работе основных насосов")
      .inputValue(),
    "12,5",
  );
  await switchOn();
  assert.equal(await page.locator(".ql-summary button").count(), 1);
  await switchOn();
  for (const width of [360, 390, 640, 641, 768, 960, 961, 1280, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    await page.locator(".ql-header").scrollIntoViewIfNeeded();
    assert.ok(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
      "overflow " + width,
    );
    if (width > 960) {
      const l = await page.locator(".questionnaire-column").boundingBox(),
        r = await page.locator(".lead-form").boundingBox();
      assert.ok(
        Math.abs(l.y + l.height - (r.y + r.height)) < 2,
        "bottom alignment " + width,
      );
    } else
      assert.equal(
        await page
          .locator(".ql-body")
          .evaluate((e) => getComputedStyle(e).overflowY),
        "visible",
      );
  }
  await page.setViewportSize({ width: 390, height: 900 });
  await page
    .locator(".ql-header")
    .evaluate((e) => e.scrollIntoView({ block: "start" }));
  await capture("mobile-on-390");
  await page.getByRole("button", { name: "Свернуть опросный лист" }).click();
  await capture("mobile-collapsed-390");
  assert.equal(await page.locator(".ql-body").isVisible(), false);
  await page.reload();
  await page.getByRole("switch").filter({ visible: true }).waitFor();
  assert.equal(await page.locator(".ql-summary button").count(), 2);
  assert.equal(await page.locator("input[type=file]").inputValue(), "");
  assert.ok(
    await page.getByText(/Восстановлен черновик этой вкладки/).isVisible(),
  );
  await page.setViewportSize({ width: 1440, height: 1100 });
  await page.locator(".ql-summary button").filter({ hasText: "ПНС" }).click();
  await page.getByLabel("Требуемый напор", { exact: false }).first().fill("");
  await page.locator(".ql-summary button").filter({ hasText: "ВНС" }).click();
  await page.locator("input[name=name]").fill("Browser synthetic pumps");
  await page.locator("input[name=phone]").fill("+70000000000");
  await page.locator("input[name=consent]").check();
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await page.getByRole("alert").first().waitFor();
  assert.equal(
    await page.locator(".ql-header strong").textContent(),
    "Опросный лист ПНС",
  );
  await capture("hidden-pns-error");
  await page.getByLabel("Требуемый напор", { exact: false }).first().fill("30");
  const responsePromise = page.waitForResponse(
    (r) =>
      r.url() === "http://127.0.0.1:8000/api/leads/" &&
      r.request().method() === "POST",
  );
  await page
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  const response = await responsePromise;
  assert.equal(response.status(), 201);
  console.log("Real browser POST", await response.json());
  await page.getByText("Заявка отправлена.", { exact: false }).waitFor();
  assert.equal(await page.locator(".ql-summary").count(), 0);
  assert.deepEqual(errors, []);
  console.log(
    "Browser checks passed: pumps, conditional drafts, multi-summary, 9 widths, storage, hidden errors, real HTTP",
  );
  await writeFile(
    out + "/results.json",
    JSON.stringify(
      {
        passed: true,
        widths: [360, 390, 640, 641, 768, 960, 961, 1280, 1440],
        errors,
      },
      null,
      2,
    ),
  );
} finally {
  await browser.close();
}
