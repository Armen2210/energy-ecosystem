import assert from "node:assert/strict";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";
const { chromium } = await import(
  process.env.PLAYWRIGHT_MODULE
    ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href
    : "playwright"
);
const origin = process.env.QUESTIONNAIRE_TEST_ORIGIN,
  api = process.env.QUESTIONNAIRE_TEST_API_ORIGIN;
for (const value of [origin, api])
  assert.match(value || "", /^http:\/\/(?:127\.0\.0\.1|localhost):[0-9]+$/);
const example = JSON.parse(
  await readFile(
    new URL(
      "../../../contracts/questionnaires/v1/examples/all-four.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const output = process.env.QUESTIONNAIRE_OUTPUT || "/tmp/ee-refinement";
await mkdir(output, { recursive: true });
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
const results = [];
async function setup(width, height, four) {
  const context = await browser.newContext({
    viewport: { width, height },
    reducedMotion: "reduce",
  });
  await context.route("**/*", (route) => {
    assert.equal(route.request().method(), "GET");
    return [origin, api].includes(new URL(route.request().url()).origin)
      ? route.continue()
      : route.abort();
  });
  if (four)
    await context.addInitScript(
      ({ example }) => {
        if (sessionStorage.getItem("layout-seeded")) return;
        sessionStorage.setItem("layout-seeded", "yes");
        sessionStorage.setItem(
          "ee-lead-draft-v1",
          JSON.stringify({
            version: 1,
            changedAt: Date.now(),
            fields: {
              name: "Synthetic layout",
              company_name: "",
              phone: "+70000000000",
              email: "",
              description: "",
              consent: false,
            },
            topic: "Блочно-модульные котельные",
            topicPage: "/solutions/bmk",
            sourcePage: "/solutions/bmk",
            started: true,
            questionnaires: Object.fromEntries(
              example.items.map((i) => [
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
          }),
        );
      },
      { example },
    );
  return context;
}
async function position(page) {
  await page.locator(".lead-form").evaluate((form) => {
    const header = document
      .querySelector(".header")
      .getBoundingClientRect().height;
    window.scrollTo({
      top: form.getBoundingClientRect().top + scrollY - header - 16,
      behavior: "instant",
    });
  });
}
try {
  for (const four of [false, true])
    for (const [width, height] of [
      [1440, 900],
      [1366, 768],
    ])
      for (const route of ["/", "/solutions/bmk"]) {
        const context = await setup(width, height, four),
          page = await context.newPage();
        await page.goto(origin + route);
        await page
          .getByRole("button", { name: "Без аналитики", exact: true })
          .click();
        await page.waitForFunction(
          () => !document.querySelector(".lead-form [name=name]").disabled,
        );
        if (route !== "/") await page.locator(".ql-panel").waitFor();
        await position(page);
        const geometry = await page.locator(".lead-form").evaluate((form) => {
          const r = form.getBoundingClientRect(),
            h = document.querySelector(".header").getBoundingClientRect();
          return {
            top: r.top,
            bottom: r.bottom,
            height: r.height,
            header: h.bottom,
            overflow: document.documentElement.scrollWidth > innerWidth + 1,
          };
        });
        assert.ok(
          geometry.top >= geometry.header && geometry.bottom <= height - 8,
          JSON.stringify({ width, height, route, four, geometry }),
        );
        assert.equal(geometry.overflow, false);
        if (route === "/") {
          assert.equal(await page.getByRole("switch").count(), 0);
          assert.equal(await page.locator(".ql-nav").count(), 0);
        } else {
          const left = await page
              .locator(".questionnaire-column")
              .boundingBox(),
            right = await page.locator(".lead-form").boundingBox();
          assert.ok(
            Math.abs(left.y + left.height - right.y - right.height) < 2,
          );
          assert.equal(
            await page
              .locator(".ql-body")
              .evaluate((e) => getComputedStyle(e).overflowY),
            "auto",
          );
        }
        await page.screenshot({
          path: `${output}/${route === "/" ? "home" : "product"}-${width}-${four ? "four" : "plain"}.png`,
        });
        results.push({ width, height, route, four, geometry });
        if (route === "/" && four) {
          await page
            .locator(".ql-summary button")
            .filter({ hasText: "ВНС" })
            .click();
          await page.waitForURL("**/solutions/vns#lead-form");
          await page.locator(".ql-panel").waitFor();
          assert.equal(
            await page.locator(".ql-header strong").textContent(),
            "Опросный лист ВНС",
          );
          assert.equal(await page.locator(".ql-summary button").count(), 4);
        }
        await context.close();
      }
  const context = await setup(1440, 900, false),
    page = await context.newPage();
  await page.goto(origin + "/solutions/bmk");
  await page
    .getByRole("button", { name: "Без аналитики", exact: true })
    .click();
  await page.getByRole("switch").filter({ visible: true }).click();
  await page.getByLabel("Раздел опросного листа").selectOption("ov");
  const temp = page.getByLabel("Температура подачи ОВ");
  await temp.fill("-12,5");
  assert.equal(await temp.inputValue(), "-12,5");
  await temp.fill("NaN");
  assert.equal(await temp.inputValue(), "-12,5");
  await page.getByLabel("Единица: Давление подачи ОВ").selectOption("кгс/см²");
  await page.reload();
  await page.locator(".ql-panel").waitFor();
  assert.equal(
    await page.getByLabel("Температура подачи ОВ").inputValue(),
    "-12,5",
  );
  await page
    .locator("textarea[name=description]")
    .evaluate((e) => (e.style.height = "350px"));
  await page.locator("input[name=name]").fill("Synthetic large text");
  await page.evaluate(() => {
    const items = [...document.querySelectorAll("main *")].map((e) => [
      e,
      parseFloat(getComputedStyle(e).fontSize),
    ]);
    for (const [e, size] of items) e.style.fontSize = size * 2 + "px";
  });
  await position(page);
  assert.ok(
    await page
      .locator(".lead-form")
      .evaluate(
        (e) =>
          e.offsetHeight >
          innerHeight - document.querySelector(".header").offsetHeight,
      ),
  );
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth > innerWidth + 1,
    ),
    false,
  );
  await page.screenshot({ path: output + "/product-expanded-text.png" });
  await context.close();
  await writeFile(
    output + "/layout-results.json",
    JSON.stringify(results, null, 2),
  );
  console.log(
    "PASS 8 desktop layouts under header, aligned product columns, home controls/summary transition, negative temperature/reload, enlarged text/page scroll",
  );
} finally {
  await browser.close();
}
