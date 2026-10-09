const API_BASE_URL = (import.meta.env?.VITE_API_BASE_URL || "").replace(/\/+$/, "");

export class LeadApiError extends Error {
  constructor(message, { status = null, indeterminate = false, retryAfter = null } = {}) {
    super(message);
    this.name = "LeadApiError";
    this.status = status;
    this.indeterminate = indeterminate;
    this.retryAfter = retryAfter;
  }
}

function getReadableApiError(errorData) {
  if (!errorData) return "Не удалось отправить заявку.";
  if (typeof errorData === "string") return errorData;
  if (errorData.detail) return errorData.detail;

  return (
    Object.entries(errorData)
      .map(([field, messages]) => {
        const text = Array.isArray(messages) ? messages.join(", ") : String(messages);
        return `${field}: ${text}`;
      })
      .join("; ") || "Не удалось отправить заявку."
  );
}

async function readJson(response) {
  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) return null;
  return response.json().catch(() => null);
}

function isConfirmedSuccess(response, data) {
  if (!data || !(Number.isSafeInteger(data.id) && data.id > 0 || typeof data.id === "string" && /^[1-9][0-9]{0,18}$/.test(data.id))) {
    return false;
  }
  if (response.status === 201) return true;
  return response.status === 200 && data.duplicate === true;
}

export async function createLead(formData) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/leads/`, {
      method: "POST",
      body: formData,
    });
  } catch {
    throw new LeadApiError(
      "Ответ сервера не получен. Данные сохранены в форме. Попробуйте отправить её ещё раз",
      { indeterminate: true },
    );
  }

  const data = await readJson(response);
  if (!response.ok) {
    if (response.status === 429) {
      const rawWait = response.headers.get("retry-after") ?? data?.retry_after;
      const wait = Number(rawWait);
      const retryAfter = rawWait != null && Number.isFinite(wait) && wait > 0
        ? Math.ceil(wait)
        : null;
      throw new LeadApiError(
        retryAfter
          ? `Слишком много запросов. Подождите ${retryAfter} сек. и отправьте заявку ещё раз. Данные и документы сохранены в форме.`
          : "Слишком много запросов. Немного подождите и отправьте заявку ещё раз. Данные и документы сохранены в форме.",
        { status: response.status, retryAfter },
      );
    }
    if (response.status === 413) {
      throw new LeadApiError(
        "Сервер отклонил файлы из-за размера запроса. Уменьшите количество или размер файлов.",
        { status: response.status },
      );
    }
    throw new LeadApiError(getReadableApiError(data), { status: response.status });
  }
  if (!isConfirmedSuccess(response, data)) {
    throw new LeadApiError(
      "Сервер не подтвердил сохранение заявки. Повторите отправку.",
      { status: response.status, indeterminate: true },
    );
  }
  return data;
}

async function sha256Hex(value) {
  const digest = await crypto.subtle.digest("SHA-256", value);
  return Array.from(new Uint8Array(digest), (byte) =>
    byte.toString(16).padStart(2, "0"),
  ).join("");
}

export async function createSubmissionSignature(formData) {
  const fields = [];
  for (const [name, value] of formData.entries()) {
    if (["submission_id", "campaign_attribution", "direction_type", "direction_slug"].includes(name)) continue;
    if (value instanceof File) {
      fields.push([
        name,
        {
          name: value.name,
          size: value.size,
          type: value.type,
          sha256: await sha256Hex(await value.arrayBuffer()),
        },
      ]);
    } else {
      fields.push([name, String(value)]);
    }
  }
  fields.sort(([left], [right]) => left.localeCompare(right));
  return sha256Hex(new TextEncoder().encode(JSON.stringify(fields)));
}

export function submissionForSignature(previous, signature, randomUUID) {
  if (previous?.signature === signature) return previous;
  return { signature, id: randomUUID() };
}
