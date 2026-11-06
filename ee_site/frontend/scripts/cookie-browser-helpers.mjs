export async function openCookieSettings(page, fromBanner = false) {
  await page.getByRole("button", {
    name: fromBanner ? "Подробнее и настройки" : "Настройки cookies",
    exact: true,
  }).click();
  await page.getByRole("dialog", { name: "Настройки cookies" }).waitFor();
}

export async function dismissCookies(page) {
  const banner = page.locator(".cookie-banner");
  if (!(await banner.isVisible())) return;
  await openCookieSettings(page, true);
  await page.getByRole("button", { name: "Без аналитики", exact: true }).click();
  await banner.waitFor({ state: "hidden" });
}
