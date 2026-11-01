import test from "node:test";
import assert from "node:assert/strict";
import { leadDraft } from "../api/leadDraft.js";
test("product route changes topic, preserving manual choice within the page and all shared data", () => {
  leadDraft.reset();
  leadDraft.enterProduct("ВНС", "/solutions/vns");
  const files = [{ id: "f", file: { name: "synthetic" } }],
    questionnaires = {
      vns: { enabled: true, answers: { technical: { flow: "12" } } },
    };
  leadDraft.update({
    started: true,
    fields: { ...leadDraft.get().fields, name: "Test" },
    files,
    questionnaires,
    topic: "Ручной выбор",
  });
  leadDraft.enterProduct("ВНС", "/solutions/vns");
  assert.equal(leadDraft.get().topic, "Ручной выбор");
  leadDraft.enterProduct("ПНС", "/solutions/pns");
  assert.equal(leadDraft.get().topic, "ПНС");
  leadDraft.enterProduct("ВНС", "/solutions/vns");
  assert.equal(leadDraft.get().topic, "ВНС");
  assert.equal(leadDraft.get().fields.name, "Test");
  assert.equal(leadDraft.get().files, files);
  assert.equal(leadDraft.get().questionnaires, questionnaires);
  leadDraft.update({
    submission: { id: "fixed", signature: "fixed" },
    indeterminate: true,
  });
  leadDraft.enterProduct("БМК", "/solutions/bmk");
  assert.equal(leadDraft.get().topic, "ВНС");
  assert.equal(leadDraft.get().submission.id, "fixed");
  leadDraft.update({ indeterminate: false, submitting: true });
  leadDraft.enterProduct("БМК", "/solutions/bmk");
  assert.equal(leadDraft.get().topic, "ВНС");
  leadDraft.reset();
});
