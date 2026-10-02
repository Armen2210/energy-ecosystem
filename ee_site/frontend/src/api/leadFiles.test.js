import assert from "node:assert/strict";
import test from "node:test";

import {
  LEAD_FILE_LIMITS,
  appendSelectedFiles,
  setLeadAttachments,
} from "./leadFiles.js";

function file(name, size, content = "x") {
  return new File([content.repeat(size)], name);
}

function idFactory() {
  let id = 0;
  return () => `file-${++id}`;
}

test("adds files in multiple batches and preserves order and duplicate names", () => {
  const createId = idFactory();
  const firstFile = file("drawing.dwg", 1, "a");
  const sameNameDifferentFile = file("drawing.dwg", 1, "b");
  const first = appendSelectedFiles([], [firstFile], createId);
  const second = appendSelectedFiles(first.files, [sameNameDifferentFile], createId);

  assert.deepEqual(second.files.map(({ file: selected }) => selected), [
    firstFile,
    sameNameDifferentFile,
  ]);
  assert.notEqual(second.files[0].id, second.files[1].id);
});

test("supports removing and adding the same File object again", () => {
  const createId = idFactory();
  const selected = file("repeat.zip", 1);
  const first = appendSelectedFiles([], [selected], createId);
  const afterRemoval = first.files.filter(({ id }) => id !== first.files[0].id);
  const addedAgain = appendSelectedFiles(afterRemoval, [selected], createId);

  assert.equal(addedAgain.files.length, 1);
  assert.notEqual(addedAgain.files[0].id, first.files[0].id);
});

test("accepts exact limits and rejects an entire invalid new batch", () => {
  const createId = idFactory();
  const tenFiles = Array.from({ length: 10 }, (_, index) =>
    file(`file-${index}.bin`, 1),
  );
  const acceptedCount = appendSelectedFiles([], tenFiles, createId);
  assert.equal(acceptedCount.files.length, 10);

  const existing = appendSelectedFiles([], [file("kept.bin", 1)], createId).files;
  const tooMany = appendSelectedFiles(
    existing,
    Array.from({ length: 10 }, (_, index) => file(`new-${index}.bin`, 1)),
    createId,
  );
  assert.equal(tooMany.files, existing);

  const exactFile = appendSelectedFiles(
    [],
    [file("exact.bin", LEAD_FILE_LIMITS.maxFileSize)],
    createId,
  );
  assert.equal(exactFile.error, "");
  const oversized = appendSelectedFiles(
    existing,
    [file("large.bin", LEAD_FILE_LIMITS.maxFileSize + 1)],
    createId,
  );
  assert.equal(oversized.files, existing);
  assert.match(oversized.error, /large\.bin/);

  const exactTotal = appendSelectedFiles(
    [],
    [
      file("ten-a.bin", 10 * 1024 * 1024),
      file("ten-b.bin", 10 * 1024 * 1024),
      file("five.bin", 5 * 1024 * 1024),
    ],
    createId,
  );
  assert.equal(exactTotal.error, "");
  const overTotal = appendSelectedFiles(
    [],
    [
      file("ten-a.bin", 10 * 1024 * 1024),
      file("ten-b.bin", 10 * 1024 * 1024),
      file("over-five.bin", 5 * 1024 * 1024 + 1),
    ],
    createId,
  );
  assert.equal(overTotal.files.length, 0);
  assert.match(overTotal.error, /25 МиБ/);

  const empty = appendSelectedFiles(existing, [file("empty.txt", 0)], createId);
  assert.equal(empty.files, existing);
  assert.match(empty.error, /empty\.txt/);
});

test("replaces native file fields with ordered repeated attachments", () => {
  const legacy = file("legacy.txt", 1);
  const accidental = file("accidental.txt", 1);
  const first = file("first.txt", 1, "a");
  const second = file("second.txt", 1, "b");
  const formData = new FormData();
  formData.append("attachment", legacy);
  formData.append("attachments", accidental);

  setLeadAttachments(formData, [
    { id: "first", file: first },
    { id: "second", file: second },
  ]);

  assert.equal(formData.has("attachment"), false);
  assert.deepEqual(formData.getAll("attachments"), [first, second]);
});

test("sends an ordinary form without file fields when no files are selected", () => {
  const formData = new FormData();
  formData.append("attachment", file("native-legacy.txt", 1));
  formData.append("attachments", file("native-multiple.txt", 1));

  setLeadAttachments(formData, []);

  assert.equal(formData.has("attachment"), false);
  assert.equal(formData.has("attachments"), false);
});
