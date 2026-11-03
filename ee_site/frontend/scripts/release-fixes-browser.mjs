import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { pathToFileURL } from "node:url";
import process from "node:process";

const origin = process.env.FIXES_TEST_ORIGIN;
assert.match(origin || "", /^http:\/\/127\.0\.0\.1:\d+$/);
const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href);
const output = process.env.FIXES_OUTPUT || "/tmp/ee-release-fixes-browser";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH, headless: true,
  args: ["--no-sandbox", "--disable-dev-shm-usage"] });
const report = { checks: [], errors: [], blocked: [] };
const pass = text => { report.checks.push(text); console.log("PASS", text); };
async function context(width, saved) {
  const ctx = await browser.newContext({ viewport: { width, height: 900 }, reducedMotion: "reduce" });
  await ctx.route("**/*", route => {
    const req = route.request();
    if (new URL(req.url()).origin !== origin || !["GET", "HEAD"].includes(req.method())) {
      report.blocked.push(req.method() + " " + new URL(req.url()).pathname);
      return route.abort();
    }
    return route.continue();
  });
  if (saved) await ctx.addInitScript(saved => {
    if (!sessionStorage.getItem("fixture")) {
      sessionStorage.setItem("fixture", "1");
      sessionStorage.setItem("ee-lead-draft-v1", JSON.stringify(saved));
    }
  }, saved);
  const page = await ctx.newPage();
  page.on("pageerror", e => report.errors.push(e.message));
  await page.goto(origin + "/solutions/vns");
  await page.getByRole("button", { name: "Без аналитики", exact: true }).click();
  await page.locator("#lead-form").scrollIntoViewIfNeeded();
  await page.getByRole("switch", { name: "Электронный опросный лист", exact: true }).filter({ visible: true }).waitFor();
  return { ctx, page };
}
const savedDraft = questionnaires => ({ version: 1, changedAt: Date.now(), started: false,
  fields: { name: "", company_name: "", phone: "", email: "", description: "", consent: false },
  questionnaires, topic: "", topicPage: "", sourcePage: "", submission: null, hadFiles: false, indeterminate: false });
try {
  for (const width of [360, 1440]) {
    for (const mode of ["empty", "enabled", "disabled-answers", "mixed-retry"]) {
      const q = mode === "empty" ? undefined : savedDraft({ vns: {
        enabled: mode !== "disabled-answers", expanded: false, sheet: "technical", scroll: {},
        answers: mode === "enabled" ? {} : { technical: { flow: "12", head: "40" } },
      } });
      if (mode === "mixed-retry") {
        q.fields.name = "Synthetic";
        q.fields.phone = "+70000000000";
        q.started = true;
        q.topic = "Водопроводные насосные станции";
        q.submission = { id: "33333333-3333-4333-8333-333333333333", signature: "a".repeat(64) };
        q.indeterminate = true;
      }
      const { ctx, page } = await context(width, q);
      const form = page.locator(".lead-form");
      assert.equal(await page.getByLabel("Документы к заявке", { exact: true }).count(), 1);
      if (mode === "mixed-retry") await form.locator("input[type=file]").setInputFiles({
        name: "synthetic.txt", mimeType: "text/plain", buffer: Buffer.from("synthetic attachment"),
      });
      const before = await page.evaluate(() => sessionStorage.getItem("ee-lead-draft-v1"));
      let dialogs = 0;
      const cancel = async dialog => { dialogs++; assert.match(dialog.message(), /Очистить форму/); await dialog.dismiss(); };
      page.on("dialog", cancel);
      await form.getByRole("button", { name: "Очистить форму", exact: true }).click();
      if (mode === "empty") {
        assert.equal(dialogs, 0);
      } else {
        assert.equal(dialogs, 1);
        assert.equal(await page.evaluate(() => sessionStorage.getItem("ee-lead-draft-v1")), before);
        if (mode === "mixed-retry") {
          assert.equal(await form.locator("[name=name]").inputValue(), "Synthetic");
          await form.locator(".file-select__toggle").click();
          assert.equal(await form.locator(".file-select__name").innerText(), "synthetic.txt");
          await page.keyboard.press("Escape");
        }
        page.off("dialog", cancel);
        page.once("dialog", dialog => dialog.accept());
        await form.getByRole("button", { name: "Очистить форму", exact: true }).click();
      }
      assert.equal(await page.evaluate(() => sessionStorage.getItem("ee-lead-draft-v1")), null);
      assert.equal(await form.locator("[name=name]").inputValue(), "");
      assert.equal(await form.locator(".file-select__value").innerText(), "Прикрепить файл");
      assert.equal(await page.locator(".ql-summary button").count(), 0);
      pass(`${width}: ${mode} clear/cancel/confirm preserves draft/files/retry until confirmation`);
      await ctx.close();
    }
    const { ctx, page } = await context(width);
    await page.goto(origin + "/");
    const card = page.locator('a.product-card[href="/solutions/bmk"]').filter({ visible: true }).first();
    await card.scrollIntoViewIfNeeded();
    await page.evaluate(() => {
      window.__motion = [];
      const until = performance.now() + 2800;
      function sample() {
        // History changes before React commits the new page. Its canonical is
        // the existing committed-page signal, so don't sample the old home DOM.
        window.__motion.push({ path: location.pathname,
          canonical: document.querySelector('link[rel="canonical"]')?.getAttribute("href"), y: scrollY });
        if (performance.now() < until) requestAnimationFrame(sample);
      }
      requestAnimationFrame(sample);
    });
    await card.click();
    await page.waitForTimeout(2900);
    const positions = await page.evaluate(() => window.__motion.filter(x =>
      x.path === "/solutions/bmk" && x.canonical?.endsWith("/solutions/bmk")).map(x => Math.round(x.y)));
    assert.ok(positions.length > 10);
    assert.deepEqual([...new Set(positions)], [0], "reduce must not jump to the form then animate to the hero");
    pass(`${width}: reduced-motion entryScroll stays at top without animated frames`);
    await page.goto(origin + "/services/design");
    const drawing = page.locator(".product-hero__visual img");
    await drawing.screenshot({ path: `${output}/design-${width}.png` });
    const image = await drawing.evaluate(img => ({ src: img.currentSrc, complete: img.complete,
      width: img.naturalWidth, height: img.naturalHeight, sizes: img.sizes }));
    assert.equal(image.complete, true);
    assert.match(image.src, /design-(480|960|1536)-.*\.webp$/);
    assert.ok(image.sizes);
    await page.screenshot({ path: `${output}/design-page-${width}.png` });
    pass(`${width}: responsive WebP drawing loads with intrinsic dimensions`);
    await ctx.close();
  }
  assert.deepEqual(report.errors, []);
  assert.deepEqual(report.blocked, []);
} finally {
  await fs.writeFile(output + "/results.json", JSON.stringify(report, null, 2));
  await browser.close();
}
