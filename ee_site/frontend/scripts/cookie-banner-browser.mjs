// Production bundle test; all requests are intercepted. No real counters/leads.
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";

const { chromium } = await import(process.env.PLAYWRIGHT_MODULE
  ? pathToFileURL(process.env.PLAYWRIGHT_MODULE).href : "playwright");
const dist = path.resolve(process.env.ANALYTICS_DIST || "dist");
const origin = "https://www.energoeffekt-rostov.ru";
const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || undefined,
  args: ["--no-sandbox", "--disable-dev-shm-usage"],
});
try {
  for (const width of [320, 360, 390, 1440]) {
    const context = await browser.newContext({ viewport: { width, height: 844 } });
    let calltouchRequests = 0;
    const requests = [];
    await context.route("**/*", async route => {
      const url = new URL(route.request().url());
      requests.push(url.href);
      if (url.hostname === "mod.calltouch.ru") {
        calltouchRequests++;
        return route.fulfill({ contentType: "text/javascript", body: "window.ct.loaded = true;" });
      }
      if (url.origin !== origin) return route.abort();
      const file = path.resolve(dist, "." + (url.pathname === "/" ? "/index.html" :
        url.pathname === "/privacy" ? "/privacy.html" : url.pathname));
      if (!file.startsWith(dist + path.sep)) return route.abort();
      try {
        assert.ok((await stat(file)).isFile());
        return route.fulfill({ path: file, body: await readFile(file) });
      } catch {
        return route.fulfill({ status: 404, body: "" });
      }
    });
    const page = await context.newPage();
    try {
      await page.goto(origin);
      const accept = page.getByRole("button", { name: "Принять", exact: true });
      await accept.waitFor();
      await page.waitForFunction(() => window.ct?.loaded === true);
      assert.equal(calltouchRequests, 1);
      const content = await page.locator(".cookie-banner__content").boundingBox();
      const button = await accept.boundingBox();
      assert.ok(Math.abs(button.x + button.width - (content.x + content.width - 21)) < 2);
      assert.ok(content.x >= 0 && content.x + content.width <= width);
      const summary = page.locator(".cookie-banner__details summary");
      await summary.click();
      assert.equal(await summary.innerText(), "Скрыть");
      assert.equal(page.url(), origin + "/");
      assert.equal(calltouchRequests, 1);
      assert.equal(await page.locator(".cookie-banner").getByRole("button").count(), 1);
      const policy = page.getByRole("link", { name: "Политика обработки данных", exact: true });
      await policy.click();
      await page.waitForURL("**/privacy#cookies");
      await page.getByRole("button", { name: "Без аналитики", exact: true }).click();
      await page.getByRole("status").filter({ hasText: "Аналитика отключена" }).waitFor();
      await page.goBack();
      assert.equal(await page.locator(".cookie-banner").count(), 0);
      await page.reload();
      assert.equal(calltouchRequests, 1);
      await page.getByRole("link", { name: "Настройки cookies", exact: true }).click();
      await page.getByRole("button", { name: "Включить аналитику", exact: true }).click();
      await page.goBack();
      await page.waitForFunction(() => window.ct?.loaded === true);
      assert.equal(calltouchRequests, 2);
      await page.reload();
      await page.waitForFunction(() => window.ct?.loaded === true);
      assert.equal(calltouchRequests, 3);
      assert.equal(await page.locator(".cookie-banner").count(), 0);
      assert.equal(requests.some(url => url.endsWith("/api/leads/")), false);
      console.log(`PASS ${width}px: layout, details, policy refusal, persistence, autostart and tools stopped after refusal`);
    } finally {
      await context.close();
    }
  }
} finally {
  await browser.close();
}
