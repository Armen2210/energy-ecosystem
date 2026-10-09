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

test("429/413 JSON and HTML preserve documents and submission for a manual retry", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const status of [429, 413]) {
      for (const contentType of ["application/json", "text/html"]) {
        const form = new FormData();
        form.set("name", "Synthetic visitor");
        form.set("description", "Keep this text");
        form.append("attachments", new File(["document"], "request.txt"));
        const signature = await createSubmissionSignature(form);
        const submission = submissionForSignature(null, signature, () => "fixed-key");
        form.set("submission_id", submission.id);
        let calls = 0;
        globalThis.fetch = async (_url, options) => {
          calls += 1;
          assert.equal(options.body, form);
          return new Response(
            contentType === "application/json"
              ? JSON.stringify({ code: "lead_rate_limited", retry_after: 12 })
              : "<html>nginx rejection</html>",
            { status, headers: { "content-type": contentType } },
          );
        };
        await assert.rejects(createLead(form), (error) => {
          assert.equal(error.status, status);
          if (status === 429) {
            assert.match(error.message, /подождите|Подождите/);
            assert.equal(error.retryAfter, contentType === "application/json" ? 12 : null);
          }
          return true;
        });
        assert.equal(calls, 1, "no automatic POST retry");
        assert.equal(form.get("name"), "Synthetic visitor");
        assert.equal(form.get("description"), "Keep this text");
        assert.equal(await form.get("attachments").text(), "document");
        assert.equal(form.get("submission_id"), "fixed-key");
        const retry = submissionForSignature(
          submission, await createSubmissionSignature(form), () => "unexpected-new-key",
        );
        assert.equal(retry, submission);
        globalThis.fetch = async () => new Response(JSON.stringify({ id: 7, duplicate: true }), {
          status: 200, headers: { "content-type": "application/json" },
        });
        assert.deepEqual(await createLead(form), { id: 7, duplicate: true });
      }
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("429 Retry-After takes precedence and invalid values have a safe fallback", async () => {
  const originalFetch = globalThis.fetch;
  try {
    for (const [header, expected] of [["30", 30], ["not-a-delay", null], ["-1", null]]) {
      globalThis.fetch = async () => new Response("<html>limited</html>", {
        status: 429,
        headers: { "content-type": "text/html", "retry-after": header },
      });
      await assert.rejects(createLead(new FormData()), { status: 429, retryAfter: expected });
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});
