import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import process from "node:process";
import { randomUUID } from "node:crypto";
import { pathToFileURL } from "node:url";
import { serializeQuestionnaires } from "../src/questionnaires/domain.js";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const fixture = JSON.parse(
  await readFile(
    new URL(
      "../../../contracts/questionnaires/v1/examples/all-four.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const original = { value: "123456789012345.678901234567", unit: "кВт" };
fixture.items.find((i) => i.product === "bmk").answers.loads.heating = {
  ...original,
};
fixture.items.find(
  (i) => i.product === "btp",
).answers.collector_heating.outlets[0].power = { ...original };
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const context = await browser.newContext({
  viewport: { width: 1440, height: 1100 },
});
const page = await context.newPage();
const errors = [];
page.on("pageerror", (e) => errors.push(e.message));
await context.route("**/*", (r) =>
  ["http://127.0.0.1:5173", "http://127.0.0.1:8000"].includes(
    new URL(r.request().url()).origin,
  )
    ? r.continue()
    : r.abort(),
);
await context.addInitScript(
  ({ fixture }) => {
    if (sessionStorage.getItem("unit-fixture-initialized")) return;
    sessionStorage.setItem("unit-fixture-initialized", "yes");
    sessionStorage.setItem(
      "ee-lead-draft-v1",
      JSON.stringify({
        version: 1,
        changedAt: Date.now(),
        fields: {
          name: "Unit precision synthetic",
          company_name: "",
          phone: "+70000000000",
          email: "",
          description: "",
          consent: false,
        },
        topic: "Блочно-модульные котельные",
        sourcePage: "/solutions/bmk",
        started: true,
        questionnaires: Object.fromEntries(
          fixture.items.map((i) => [
            i.product,
            {
              enabled: true,
              expanded: true,
              sheet: i.product === "bmk" ? "loads" : "common",
              answers: i.answers,
              scroll: {},
            },
          ]),
        ),
        submission: null,
        hadFiles: false,
      }),
    );
  },
  { fixture },
);
async function payload() {
  const raw = await page.evaluate(() =>
    JSON.parse(sessionStorage.getItem("ee-lead-draft-v1")),
  );
  return serializeQuestionnaires(raw.questionnaires);
}
const form = {
  name: "Unit precision API synthetic",
  phone: "+70000000000",
  submission_id: randomUUID(),
};
async function post(value) {
  return context.request.post("http://127.0.0.1:8000/api/leads/", {
    form: { ...form, questionnaires: JSON.stringify(value) },
  });
}
try {
  await page.goto("http://127.0.0.1:5173/solutions/bmk");
  await page
    .getByRole("button", { name: "Без аналитики", exact: true })
    .click();
  await page.locator(".ql-panel").waitFor();
  const before = await payload();
  const saved = await post(before);
  assert.equal(saved.status(), 201);
  const id = (await saved.json()).id;
  const unit = page.getByLabel("Единица: Отопление", { exact: true });
  for (let i = 0; i < 7; i++) await unit.selectOption(i % 2 ? "кВт" : "Гкал/ч");
  await page.locator(".ql-summary button").filter({ hasText: "БТП" }).click();
  await page
    .getByLabel("Раздел опросного листа")
    .selectOption("collector_heating");
  const row = page.locator(".ql-outlet").first(),
    rowUnit = row.getByLabel("Единица: Мощность", { exact: true });
  for (let i = 0; i < 7; i++)
    await rowUnit.selectOption(i % 2 ? "кВт" : "Гкал/ч");
  assert.deepEqual(await payload(), before);
  let retry = await post(await payload());
  assert.equal(retry.status(), 200);
  assert.equal((await retry.json()).id, id);
  await page.reload();
  await page.locator(".ql-panel").waitFor();
  assert.deepEqual(await payload(), before);
  retry = await post(await payload());
  assert.equal(retry.status(), 200);
  assert.equal((await retry.json()).id, id);
  // Real input events must discard the old source, unlike a unit-only change.
  await page
    .locator(".ql-outlet")
    .first()
    .getByRole("textbox", { name: "Мощность", exact: true })
    .fill("3.5");
  await page.locator(".ql-summary button").filter({ hasText: "БМК" }).click();
  await page
    .getByRole("textbox", { name: "Отопление", exact: true })
    .fill("2,5");
  const edited = await payload();
  assert.deepEqual(
    edited.items.find((i) => i.product === "bmk").answers.loads.heating,
    { value: "2,5", unit: "Гкал/ч" },
  );
  assert.deepEqual(
    edited.items.find((i) => i.product === "btp").answers.collector_heating
      .outlets[0].power,
    { value: "3.5", unit: "Гкал/ч" },
  );
  const changed = await post(edited);
  assert.equal(changed.status(), 409);
  assert.deepEqual(errors, []);
  console.log(
    "PASS real field/outlet toggles + reload: unchanged canonical/fingerprint and duplicate 200; manual edit: new pair and conflict 409",
  );
} finally {
  await browser.close();
}
