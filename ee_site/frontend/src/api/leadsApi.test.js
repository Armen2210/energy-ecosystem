import assert from "node:assert/strict";
import test from "node:test";

import {
  LeadApiError,
  createLead,
  createSubmissionSignature,
  submissionForSignature,
} from "./leadsApi.js";

test("signature includes file content, not only its name", async () => {
  const first = new FormData();
  first.set("attachment", new File(["first"], "same.txt"));
  const second = new FormData();
  second.set("attachment", new File(["different"], "same.txt"));

  assert.notEqual(
    await createSubmissionSignature(first),
    await createSubmissionSignature(second),
  );
});

test("reuses an id for unchanged content and rotates it after a change", () => {
  let counter = 0;
  const randomUUID = () => `uuid-${++counter}`;
  const first = submissionForSignature(null, "signature-a", randomUUID);
  const retry = submissionForSignature(first, "signature-a", randomUUID);
  const changed = submissionForSignature(retry, "signature-b", randomUUID);

  assert.equal(retry.id, first.id);
  assert.notEqual(changed.id, first.id);
});

test("keeps attachment order in the signature and rotates the id after a set change", async () => {
  const first = new File(["first"], "first.txt");
  const second = new File(["second"], "second.txt");
  const ordered = new FormData();
  ordered.append("attachments", first);
  ordered.append("attachments", second);
  const sameOrder = new FormData();
  sameOrder.append("attachments", first);
  sameOrder.append("attachments", second);
  const reversed = new FormData();
  reversed.append("attachments", second);
  reversed.append("attachments", first);

  const orderedSignature = await createSubmissionSignature(ordered);
  const sameSignature = await createSubmissionSignature(sameOrder);
  const reversedSignature = await createSubmissionSignature(reversed);
  let counter = 0;
  const randomUUID = () => `uuid-${++counter}`;
  const initial = submissionForSignature(null, orderedSignature, randomUUID);
  const retry = submissionForSignature(initial, sameSignature, randomUUID);
  const changed = submissionForSignature(retry, reversedSignature, randomUUID);

  assert.equal(retry.id, initial.id);
  assert.notEqual(reversedSignature, orderedSignature);
  assert.notEqual(changed.id, initial.id);
});

test("accepts created and duplicate confirmations and normalizes URL", async () => {
  const originalFetch = globalThis.fetch;
  try {
    let calls = 0;
    globalThis.fetch = async (url) => {
      assert.equal(url, "/api/leads/");
      calls += 1;
      const body = calls === 1 ? { id: 1 } : { id: 1, duplicate: true };
      return new Response(JSON.stringify(body), {
        status: calls === 1 ? 201 : 200,
        headers: { "content-type": "application/json" },
      });
    };
    assert.deepEqual(await createLead(new FormData()), { id: 1 });
    assert.deepEqual(await createLead(new FormData()), { id: 1, duplicate: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("keeps an indeterminate result retryable", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () => new Response("<html>proxy error</html>", { status: 200 });
    await assert.rejects(createLead(new FormData()), (error) => {
      assert.ok(error instanceof LeadApiError);
      assert.equal(error.indeterminate, true);
      return true;
    });

    globalThis.fetch = async () => {
      throw new TypeError("network down");
    };
    await assert.rejects(createLead(new FormData()), {
      indeterminate: true,
      message:
        "Ответ сервера не получен. Данные сохранены в форме. Попробуйте отправить её ещё раз",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("surfaces validation and conflict statuses", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const status of [400, 409]) {
      globalThis.fetch = async () =>
        new Response(JSON.stringify({ detail: "synthetic error" }), {
          status,
          headers: { "content-type": "application/json" },
        });
      await assert.rejects(createLead(new FormData()), { status });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("reports HTTP 413 even when a proxy returns HTML", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async () =>
      new Response("<html>request too large</html>", {
        status: 413,
        headers: { "content-type": "text/html" },
      });
    await assert.rejects(createLead(new FormData()), {
      status: 413,
      message:
        "Сервер отклонил файлы из-за размера запроса. Уменьшите количество или размер файлов.",
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
