import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { ESLint } from "eslint";

test("scoped minimatch security overrides retain ESLint traversal APIs", () => {
  const require = createRequire(import.meta.url);
  for (const consumer of ["eslint", "@eslint/config-array"]) {
    const fromConsumer = createRequire(require.resolve(consumer));
    const { Minimatch } = fromConsumer("minimatch");
    const match = new Minimatch("**/*.{js,jsx}", { dot: true });
    assert.equal(match.match("src/api/leadDraftContent.js"), true);
    assert.equal(match.match("src/components/LeadForm/LeadForm.jsx"), true);
    assert.equal(match.match("src/components/LeadForm/LeadForm.css"), false);
    assert.equal(match.match("src/components", true), true, "directory traversal");
    assert.equal(new Minimatch("**/.vite/**", { dot: true }).match("node_modules/.vite/cache.js"), true);
  }
});

test("ESLint config still includes application/tests and ignores generated output", async () => {
  const lint = new ESLint();
  for (const path of ["src/App.jsx", "src/api/leadDraftContent.test.js", "src/questionnaires/domain.test.js"]) {
    assert.ok(await lint.calculateConfigForFile(path), path);
    assert.equal(await lint.isPathIgnored(path), false, path);
  }
  for (const path of ["dist/assets/main.js", "node_modules/.vite/deps/react.js"]) {
    assert.equal(await lint.isPathIgnored(path), true, path);
  }
});
