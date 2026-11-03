import test from "node:test";
import assert from "node:assert/strict";
import { acceptsNumericEdit, acceptsNumericDraft, insertedNumericDraft } from "./numericInput.js";
test("numeric grammar preserves intermediate editing and contract signs", () => {
  const count = { integer: true, min: 0 };
  for (const value of ["", "0", "123", "+", "+12"])
    assert.ok(acceptsNumericDraft(value, count));
  for (const value of ["-1", "1.2", "1,2", "12kg", "1 2", "NaN", "1e3"])
    assert.equal(acceptsNumericDraft(value, count), false, value);
  const temperature = { unit: "°C" };
  for (const value of ["", "-", "-.", ".", ",", "-12,5", "12.5", "0"])
    assert.ok(acceptsNumericDraft(value, temperature), value);
  for (const value of ["12kg", "1,2.3", "--1", "1e2", "Infinity", " 12"])
    assert.equal(acceptsNumericDraft(value, temperature), false, value);
  assert.ok(acceptsNumericDraft("-2.5", {}), "no invented engineering minimum");
  assert.equal(insertedNumericDraft("12,34", 0, 2, "9"), "9,34");
  assert.equal(insertedNumericDraft("1234", 1, 3, ""), "14");
});

test("legacy invalid drafts can be corrected by deletion without allowing new invalid text", () => {
  assert.equal(
    acceptsNumericEdit("12kg", "12k", {}, "deleteContentBackward"),
    true,
  );
  assert.equal(
    acceptsNumericEdit("12k", "12", {}, "deleteContentBackward"),
    true,
  );
  assert.equal(acceptsNumericEdit("12kg", "12kX", {}, "insertText"), false);
  assert.equal(acceptsNumericEdit("12", "12x", {}, "insertText"), false);
});
