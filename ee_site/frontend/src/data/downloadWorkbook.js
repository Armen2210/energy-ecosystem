// Both document lists use the same XLSX download flow. PDF links stay native.
export async function downloadWorkbook(event, file) {
  if (file.format !== "xlsx" || file.behavior !== "download") return;
  event.preventDefault();
  try {
    const response = await fetch(file.url);
    if (!response.ok) throw new Error("Workbook unavailable");
    const workbook = await response.blob();
    const signature = new Uint8Array(await workbook.slice(0, 4).arrayBuffer());
    if (signature.join(",") !== "80,75,3,4") throw new Error("Expected an XLSX archive");

    const url = URL.createObjectURL(new Blob([workbook], { type: "application/octet-stream" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = file.url.split("/").at(-1);
    document.body.append(link);
    try {
      link.click();
    } finally {
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    }
  } catch {
    window.alert("Не удалось скачать файл Excel. Попробуйте ещё раз.");
  }
}
