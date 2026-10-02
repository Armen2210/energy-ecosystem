export const LEAD_FILE_LIMITS = Object.freeze({
  maxFiles: 10,
  maxFileSize: 10 * 1024 * 1024,
  maxTotalSize: 25 * 1024 * 1024,
});

export function formatFileSize(size) {
  return `${(size / 1024 / 1024).toFixed(2)} МиБ`;
}

export function appendSelectedFiles(
  selectedFiles,
  addedFiles,
  createId = () => crypto.randomUUID(),
) {
  const additions = Array.from(addedFiles);
  if (selectedFiles.length + additions.length > LEAD_FILE_LIMITS.maxFiles) {
    return {
      files: selectedFiles,
      error: `Можно прикрепить не более ${LEAD_FILE_LIMITS.maxFiles} файлов.`,
    };
  }

  for (const file of additions) {
    if (file.size === 0) {
      return {
        files: selectedFiles,
        error: `Файл «${file.name}» пуст. Выберите непустой файл.`,
      };
    }
    if (file.size > LEAD_FILE_LIMITS.maxFileSize) {
      return {
        files: selectedFiles,
        error: `Файл «${file.name}» превышает лимит 10 МиБ.`,
      };
    }
  }

  const totalSize = [...selectedFiles.map(({ file }) => file), ...additions].reduce(
    (sum, file) => sum + file.size,
    0,
  );
  if (totalSize > LEAD_FILE_LIMITS.maxTotalSize) {
    return {
      files: selectedFiles,
      error: "Суммарный размер файлов превышает лимит 25 МиБ.",
    };
  }

  return {
    files: [
      ...selectedFiles,
      ...additions.map((file) => ({ id: createId(), file })),
    ],
    error: "",
  };
}

export function setLeadAttachments(formData, selectedFiles) {
  formData.delete("attachment");
  formData.delete("attachments");
  for (const { file } of selectedFiles) {
    formData.append("attachments", file);
  }
  return formData;
}
