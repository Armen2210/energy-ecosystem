import test from "node:test";
import assert from "node:assert/strict";
import { hasDraftContent } from "./leadDraftContent.js";

const empty = () => ({ started: false, files: [], fields: { name: "", consent: false }, questionnaires: {} });
test("empty and UI-only questionnaires need no clear confirmation", () => {
  assert.equal(hasDraftContent(empty()), false);
  assert.equal(hasDraftContent({ ...empty(), started: true }), false, "erased ordinary fields are empty");
  const d = empty();
  d.questionnaires.btp = { enabled: false, expanded: true, sheet: "common", scroll: { common: 50 }, answers: {
    selectedSections: [], common: { object: "" }, collector_heating: { outlets: [{ id: "outlet-1", power: { value: "", unit: "кВт" } }] },
  } };
  assert.equal(hasDraftContent(d), false);
});
test("enabled, disabled and collapsed OL-only drafts require confirmation", () => {
  const d = empty();
  d.questionnaires.vns = { enabled: true, answers: {} };
  assert.equal(hasDraftContent(d), true);
  for (const answer of ["12", "0", "-", "Нет"]) {
    d.questionnaires.vns = { enabled: false, expanded: false, answers: { technical: { flow: answer } } };
    assert.equal(hasDraftContent(d), true, answer);
  }
  d.questionnaires.btp = { enabled: false, answers: { selectedSections: ["heating"] } };
  assert.equal(hasDraftContent(d), true);
});
test("ordinary fields, files, topic choice and mixed drafts retain confirmation", () => {
  for (const patch of [{ started: true, topic: "Manual topic" }, { fields: { name: "Synthetic" } }, { files: [{}] }, { fields: { consent: true } }, { submission: { id: "retry" } }]) {
    assert.equal(hasDraftContent({ ...empty(), ...patch }), true);
  }
  const d = { ...empty(), files: [{}], questionnaires: { pns: { enabled: false, answers: { notes: { note: "Draft" } } } } };
  const before = structuredClone(d);
  assert.equal(hasDraftContent(d), true);
  assert.deepEqual(d, before, "predicate must not change retry, files or answers");
});
