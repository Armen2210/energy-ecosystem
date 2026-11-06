import { dismissCookies } from "./cookie-browser-helpers.mjs";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const example = JSON.parse(
  await readFile(
    new URL(
      "../../../contracts/questionnaires/v1/examples/all-four.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const b = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: ["--no-sandbox"],
});
const c = await b.newContext({ viewport: { width: 1440, height: 1100 } });
const p = await c.newPage();
const errors = [];
p.on("pageerror", (e) => errors.push(e.message));
await c.route("**/*", (r) =>
  ["http://127.0.0.1:5173", "http://127.0.0.1:8000"].includes(
    new URL(r.request().url()).origin,
  )
    ? r.continue()
    : r.abort(),
);
await c.addInitScript(
  ({ example }) => {
    if (!sessionStorage.getItem("fixture-initialized")) {
      sessionStorage.setItem("fixture-initialized", "yes");
      sessionStorage.setItem(
        "ee-lead-draft-v1",
        JSON.stringify({
          version: 1,
          changedAt: Date.now(),
          fields: {
            name: "Browser all four synthetic",
            company_name: "",
            phone: "+70000000000",
            email: "smoke@example.invalid",
            description: "Synthetic four OL",
            consent: false,
          },
          topic: "Блочные тепловые пункты",
          sourcePage: "/solutions/btp",
          started: true,
          questionnaires: Object.fromEntries(
            example.items.map((i) => [
              i.product,
              {
                enabled: true,
                expanded: true,
                sheet: "common",
                answers: i.answers,
                scroll: {},
              },
            ]),
          ),
          submission: null,
          hadFiles: false,
        }),
      );
    }
  },
  { example },
);
try {
  await p.goto("http://127.0.0.1:5173/solutions/btp");
  await dismissCookies(p);
  await p.locator(".ql-panel").waitFor();
  assert.equal(await p.locator(".ql-summary button").count(), 4);
  await p.locator("#lead-form").scrollIntoViewIfNeeded();
  await p.screenshot({
    path: "/tmp/ee-questionnaires-browser/desktop-four-btp.png",
  });
  await p.getByLabel("Раздел опросного листа").selectOption("heating");
  await p.getByLabel(/^Подключение/).selectOption("Независимое");
  await p.getByLabel("Резервирование ТО", { exact: true }).selectOption("Да");
  await p.getByLabel("Доля нагрузки каждого из двух ТО").fill("49");
  await p.locator(".ql-summary button").filter({ hasText: "ВНС" }).click();
  await p.locator("input[name=consent]").check();
  await p
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  await p.getByRole("alert").first().waitFor();
  assert.equal(
    await p.getByLabel("Раздел опросного листа").inputValue(),
    "heating",
  );
  await p.screenshot({
    path: "/tmp/ee-questionnaires-browser/hidden-btp-error.png",
  });
  await p.getByLabel("Доля нагрузки каждого из двух ТО").fill("70");
  await p.getByLabel("Раздел опросного листа").selectOption("dhw");
  await p.getByLabel("Подключение ГВС").selectOption("Закрытое");
  await p.getByLabel("Давление ХВ на входе в ТО").fill("10");
  await p.getByLabel("Схема при закрытом ГВС").selectOption("Одноступенчатая");
  await p.getByLabel("Резервирование ТО", { exact: true }).selectOption("Да");
  await p.getByLabel("Доля нагрузки каждого из двух ТО").fill("100");
  await p.getByLabel("Схема при закрытом ГВС").selectOption("Двухступенчатая");
  assert.equal(
    await p.getByLabel("Резервирование ТО", { exact: true }).count(),
    0,
  );
  await p.getByLabel("Схема при закрытом ГВС").selectOption("Одноступенчатая");
  assert.equal(
    await p.getByLabel("Доля нагрузки каждого из двух ТО").inputValue(),
    "100",
  );
  await p
    .getByLabel("Раздел опросного листа")
    .selectOption("collector_heating");
  assert.equal(await p.locator(".ql-outlet").count(), 100);
  const before = await p
    .locator(".ql-outlet")
    .nth(2)
    .getByLabel("Мощность", { exact: true })
    .inputValue();
  await p
    .locator(".ql-outlet")
    .nth(1)
    .getByRole("button", { name: "Удалить выход", exact: true })
    .click();
  assert.equal(
    await p
      .locator(".ql-outlet")
      .nth(1)
      .getByLabel("Мощность", { exact: true })
      .inputValue(),
    before,
  );
  await p.getByRole("button", { name: "Добавить выход", exact: true }).click();
  assert.equal(await p.locator(".ql-outlet").count(), 100);
  await p
    .locator(".ql-outlet")
    .first()
    .getByLabel("Балансировка подачи")
    .selectOption("Нет");
  p.once("dialog", (d) => d.accept());
  await p
    .locator(".ql-outlet")
    .first()
    .getByRole("button", { name: "Применить настройки этого выхода ко всем" })
    .click();
  assert.equal(
    await p
      .locator(".ql-outlet")
      .nth(1)
      .getByLabel("Балансировка подачи")
      .inputValue(),
    "Нет",
  );
  assert.equal(
    await p
      .locator(".ql-outlet")
      .nth(1)
      .getByLabel("Мощность", { exact: true })
      .inputValue(),
    before,
  );
  // The added empty row has inherited settings; it needs a parameter, as clearly required.
  await p
    .locator(".ql-outlet")
    .last()
    .getByLabel("Ду", { exact: true })
    .fill("32");
  for (const product of ["БМК", "ПНС", "ВНС", "БТП"]) {
    await p.locator(".ql-summary button").filter({ hasText: product }).click();
    await p.locator(".ql-header").scrollIntoViewIfNeeded();
    assert.equal(
      await p.locator(".ql-header strong").textContent(),
      "Опросный лист " + product,
    );
  }
  await p
    .getByLabel("Раздел опросного листа")
    .selectOption("collector_heating");
  await p.locator(".ql-header").scrollIntoViewIfNeeded();
  await p.screenshot({
    path: "/tmp/ee-questionnaires-browser/desktop-btp-collector.png",
  });
  await p.setViewportSize({ width: 390, height: 900 });
  await p
    .locator(".ql-header")
    .evaluate((e) => e.scrollIntoView({ block: "start" }));
  await p.screenshot({
    path: "/tmp/ee-questionnaires-browser/mobile-btp-collector.png",
  });
  await p.setViewportSize({ width: 1440, height: 1100 });
  const responsePromise = p.waitForResponse(
    (r) =>
      ["http://127.0.0.1:5173", "http://127.0.0.1:8000"].includes(
        new URL(r.url()).origin,
      ) &&
      new URL(r.url()).pathname === "/api/leads/" &&
      r.request().method() === "POST",
  );
  await p
    .getByRole("button", { name: "Отправить заявку", exact: true })
    .click();
  const response = await responsePromise;
  assert.equal(response.status(), 201);
  console.log("Four-OL browser POST", await response.json());
  assert.deepEqual(errors, []);
  console.log(
    "PASS all-four restored fixture UI, hidden BTP errors, 50–100 conditions, stable collector rows, explicit settings copy, one HTTP submission",
  );
} finally {
  await b.close();
}
