import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  contract,
  changeUnit,
  serializeQuestionnaires,
  validateQuestionnaires,
  numberValue,
} from "./domain.js";
import {
  saveDraft,
  readDraft,
  DRAFT_TTL,
  DRAFT_KEY,
} from "../api/leadDraftStorage.js";
const example = JSON.parse(
  readFileSync(
    new URL(
      "../../../../contracts/questionnaires/v1/examples/all-four.json",
      import.meta.url,
    ),
  ),
);
const drafts = () =>
  Object.fromEntries(
    example.items.map((i) => [
      i.product,
      { enabled: true, answers: structuredClone(i.answers) },
    ]),
  );
test("all four and 300 collector outlets validate; hidden enabled sheets still checked", () => {
  const d = drafts();
  assert.deepEqual(validateQuestionnaires(d), {});
  assert.equal(serializeQuestionnaires(d).items.length, 4);
  d.pns.answers.technical.jockey_flow = "";
  assert.ok(validateQuestionnaires(d)["pns.technical.jockey_flow"]);
  d.pns.enabled = false;
  assert.deepEqual(validateQuestionnaires(d), {});
});
test("conditional answers retained in draft but excluded from submitted payload", () => {
  const d = drafts();
  d.pns.answers.technical.jockey = "Нет";
  const payload = serializeQuestionnaires(d);
  assert.equal(
    payload.items.find((i) => i.product === "pns").answers.technical
      .jockey_flow,
    undefined,
  );
  assert.equal(d.pns.answers.technical.jockey_flow, "10");
});
test("quantity conversion retains physical value through repeated toggles, blank and zero", () => {
  // NIST SP 811 cal_IT=4.1868 J; exact rational arithmetic, not the contract.
  const numerator = 41868n * 1000000000n;
  const denominator = 10000n * 3600n * 1000n;
  assert.equal(numerator % denominator, 0n);
  const expectedKW = Number(numerator / denominator);
  assert.equal(expectedKW, 1163);
  assert.equal(Number(contract.units.power["Гкал/ч"]), expectedKW);
  let v = { value: "1", unit: "Гкал/ч" };
  for (let i = 0; i < 100; i++) {
    v = changeUnit(v, "кВт", "power");
    assert.ok(Math.abs(Number(v.value) - expectedKW) < 1e-10);
    v = changeUnit(v, "Гкал/ч", "power");
    assert.equal(v.value, "1");
  }
  assert.equal(
    changeUnit({ value: "1000", unit: "л" }, "м³", "volume").value,
    "1",
  );
  assert.equal(
    changeUnit({ value: "0", unit: "л" }, "м³", "volume").value,
    "0",
  );
  assert.equal(changeUnit({ value: "", unit: "л" }, "м³", "volume").value, "");
  assert.equal(changeUnit({ value: "-", unit: "л" }, "м³", "volume"), null);
  assert.equal(numberValue("-12,5"), -12.5);
  assert.equal(numberValue("Infinity"), null);
});
test("BTP composition, conditional reserves and individual outlet settings", () => {
  const d = drafts();
  d.btp.answers.selectedSections = [];
  assert.ok(validateQuestionnaires(d)["btp.common.selectedSections"]);
  d.btp.answers.selectedSections = ["collector_heating"];
  assert.deepEqual(validateQuestionnaires(d), {});
  d.btp.answers.collector_heating.outlets.unshift({ id: "empty" });
  assert.equal(
    serializeQuestionnaires(d).items.find((i) => i.product === "btp").answers
      .collector_heating.outlets.length,
    100,
  );
});
test("tab storage keeps contacts and OL, omits bytes; TTL is from content edit time", () => {
  const map = new Map();
  const storage = {
    setItem: (k, v) => map.set(k, v),
    getItem: (k) => map.get(k),
    removeItem: (k) => map.delete(k),
  };
  const d = {
    fields: {
      name: "Test",
      phone: "000",
      email: "",
      company_name: "",
      description: "",
      consent: true,
    },
    topic: "Test",
    sourcePage: "/solutions/vns",
    started: true,
    questionnaires: drafts(),
    changedAt: 1000,
    files: [{ bytes: "never serialize" }],
  };
  saveDraft(storage, d, 1100);
  assert.equal(readDraft(storage, 1200).hadFiles, true);
  assert.ok(!storage.getItem(DRAFT_KEY).includes("never serialize"));
  saveDraft(storage, d, 2000);
  assert.equal(readDraft(storage, 1000 + DRAFT_TTL), null);
  storage.setItem(DRAFT_KEY, "broken");
  assert.throws(() => readDraft(storage, 2000));
});

test("unit toggles serialize exact source pairs in fields and outlets, including reload", () => {
  const d = drafts();
  const original = { value: "123456789012345.678901234567", unit: "кВт" };
  d.bmk.answers.loads.heating = { ...original };
  const row = d.btp.answers.collector_heating.outlets[0];
  row.power = { ...original };
  const baseline = serializeQuestionnaires(d);
  for (let i = 0; i < 12; i++) {
    d.bmk.answers.loads.heating = changeUnit(
      d.bmk.answers.loads.heating,
      i % 2 ? "кВт" : "Гкал/ч",
      "power",
    );
    row.power = changeUnit(row.power, i % 2 ? "кВт" : "Гкал/ч", "power");
    assert.deepEqual(serializeQuestionnaires(d), baseline);
  }
  d.bmk.answers.loads.heating = changeUnit(
    d.bmk.answers.loads.heating,
    "Гкал/ч",
    "power",
  );
  row.power = changeUnit(row.power, "Гкал/ч", "power");
  const map = new Map();
  const storage = {
    setItem: (k, v) => map.set(k, v),
    getItem: (k) => map.get(k),
  };
  saveDraft(
    storage,
    {
      fields: {
        name: "Test",
        company_name: "",
        phone: "000",
        email: "",
        description: "",
      },
      topic: "Test",
      questionnaires: d,
      files: [],
      changedAt: 1000,
    },
    1000,
  );
  const restored = readDraft(storage, 1100).questionnaires;
  assert.deepEqual(serializeQuestionnaires(restored), baseline);
  assert.equal(
    changeUnit(restored.bmk.answers.loads.heating, "кВт", "power").value,
    original.value,
  );
  // The real input handler creates a fresh pair when a visitor edits the number.
  restored.bmk.answers.loads.heating = { value: "2,5", unit: "Гкал/ч" };
  restored.btp.answers.collector_heating.outlets[0].power = {
    value: "3.5",
    unit: "Гкал/ч",
  };
  const changed = serializeQuestionnaires(restored);
  assert.deepEqual(
    changed.items.find((i) => i.product === "bmk").answers.loads.heating,
    { value: "2,5", unit: "Гкал/ч" },
  );
  assert.deepEqual(
    changed.items.find((i) => i.product === "btp").answers.collector_heating
      .outlets[0].power,
    { value: "3.5", unit: "Гкал/ч" },
  );
  assert.notDeepEqual(changed, baseline);
});
