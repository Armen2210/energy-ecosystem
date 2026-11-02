import test from "node:test";
import assert from "node:assert/strict";
import { readFile, stat } from "node:fs/promises";
import { parse } from "parse5";
const read = (path) => readFile(new URL("../" + path, import.meta.url), "utf8");
function nodes(html) {
  const result = [];
  function walk(n) {
    result.push(n);
    for (const c of n.childNodes || []) walk(c);
  }
  walk(parse(html));
  return result;
}
const attr = (node, name) => node.attrs?.find((a) => a.name === name)?.value;
test("catalog HTML and detail breadcrumbs preserve distinct header/footer/home returns", async () => {
  for (const [catalog, section, count] of [
    ["solutions", "products", 5],
    ["services", "services", 3],
  ]) {
    const html = await read(`dist/${catalog}.html`),
      all = nodes(html);
    assert.ok(
      all.some(
        (n) =>
          n.tagName === "link" &&
          attr(n, "rel") === "canonical" &&
          attr(n, "href") === `https://www.energoeffekt-rostov.ru/${catalog}`,
      ),
    );
    assert.equal(
      all.filter(
        (n) =>
          n.tagName === "a" &&
          (attr(n, "class") || "")
            .split(" ")
            .includes(
              catalog === "solutions" ? "product-card" : "service-card",
            ),
      ).length,
      count,
    );
    assert.match(html, new RegExp(`href="/#${section}"`));
    assert.match(html, new RegExp(`href="/${catalog}"`));
    const detail = await read(
      `dist/${catalog}/${catalog === "solutions" ? "bmk" : "design"}.html`,
    );
    assert.match(detail, new RegExp(`breadcrumb-link" href="/${catalog}"`));
    assert.match(detail, new RegExp(`href="/#${section}"`));
    assert.match(
      await read("dist/sitemap.xml"),
      new RegExp(`<loc>https://www.energoeffekt-rostov.ru/${catalog}</loc>`),
    );
  }
  const home = await read("dist/index.html");
  assert.doesNotMatch(
    home,
    /Все продуктовые направления|Все инженерные услуги/,
  );
});
test("27 ordered images have optimized responsive assets and no old hidden content/viewer", async () => {
  const html = await read("dist/about.html"),
    all = nodes(html);
  assert.deepEqual(
    all
      .filter((n) => attr(n, "data-photo"))
      .map((n) => Number(attr(n, "data-photo"))),
    Array.from({ length: 27 }, (_, i) => i + 1),
  );
  const photos = all.filter(
    (n) => n.tagName === "img" && attr(n, "src")?.match(/\/[0-9]{2}-[0-9]+-/),
  );
  assert.equal(photos.length, 27);
  for (const img of photos) {
    assert.equal(attr(img, "loading"), "lazy");
    assert.ok(Number(attr(img, "width")) > 0);
    assert.ok(Number(attr(img, "height")) > 0);
    assert.ok(attr(img, "alt").length > 15);
    assert.equal(attr(img, "srcset").split(",").length, 3);
    assert.ok(attr(img, "sizes"));
  }
  assert.doesNotMatch(
    html,
    /Иван Иваныч|Увеличить|about-photo__open|about-viewer|Кто работает над вашим проектом|На нашем производстве|Нам 12 лет|gallery-source/,
  );
  assert.match(html, /Давайте познакомимся/);
  assert.match(html, /Расскажите, что планируете/);
  const manifest = JSON.parse(
    await read("src/assets/about/gallery/manifest.json"),
  );
  assert.deepEqual(
    manifest.map((p) => p.number),
    Array.from({ length: 27 }, (_, i) => i + 1),
  );
  for (const photo of manifest)
    for (const v of photo.variants) {
      const path = new URL(
        "../src/assets/about/gallery/" + v.file,
        import.meta.url,
      );
      assert.equal((await stat(path)).size, v.bytes);
      assert.ok(v.width <= photo.width);
      assert.ok(
        Math.abs(v.width / v.height - photo.width / photo.height) < 0.005,
      );
    }
});

test("product prerender includes registry downloads in the lightweight questionnaire header", async () => {
  const { documents } = await import("../src/data/documents.js");
  for (const document of documents.filter(d => d.categoryId === "questionnaires")) {
    const all = nodes(await read(`dist/solutions/${document.productSlug}.html`));
    const header = all.find(n => (attr(n, "class") || "").split(" ").includes("ql-header"));
    assert.ok(header, `${document.productSlug}: initial header required`);
    const descendants = [];
    function visit(n) { descendants.push(n); for (const child of n.childNodes || []) visit(child); }
    visit(header);
    const links = descendants.filter(n => n.tagName === "a");
    assert.deepEqual(links.map(n => attr(n, "href")), document.files.map(f => f.url));
    for (const link of links) {
      assert.equal(attr(link, "download"), "");
      assert.match(attr(link, "aria-label"), /Скачать бланк .+ — (Excel|PDF)/);
    }
    assert.ok(descendants.some(n => n.tagName === "button" && attr(n, "disabled") !== undefined), "online control waits for backend");
    assert.equal(all.some(n => (attr(n, "class") || "").split(" ").includes("ql-fields")), false, "heavy fields remain deferred");
  }
  assert.equal(nodes(await read("dist/solutions/automation-cabinets.html")).some(n =>
    (attr(n, "class") || "").split(" ").includes("ql-downloads")), false);
});
