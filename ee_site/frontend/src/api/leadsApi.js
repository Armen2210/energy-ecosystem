// =========================================================
// LEADS API / API ДЛЯ ЗАЯВОК
// Отвечает за отправку формы заявки на backend.
//
// Backend endpoint:
// POST /api/leads/
// =========================================================

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

function getReadableApiError(errorData) {
  if (!errorData) {
    return "Не удалось отправить заявку.";
  }

  if (typeof errorData === "string") {
    return errorData;
  }

  if (errorData.detail) {
    return errorData.detail;
  }

  const fieldErrors = Object.entries(errorData)
    .map(([field, messages]) => {
      const messageText = Array.isArray(messages)
        ? messages.join(", ")
        : String(messages);

      return `${field}: ${messageText}`;
    })
    .join("; ");

  return fieldErrors || "Не удалось отправить заявку.";
}

export async function createLead(formData) {
  const response = await fetch(`${API_BASE_URL}/api/leads/`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    const message = getReadableApiError(errorData);

    throw new Error(message);
  }

  return response.json();
}