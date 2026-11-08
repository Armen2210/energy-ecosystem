export async function openCookieSettings(page, fromBanner = false) {
  if (fromBanner) {
    await page.locator(".cookie-banner__details summary").click();
    await page.getByRole("link", { name: "Политика обработки данных", exact: true }).click();
  } else {
    await page.getByRole("link", { name: "Настройки cookies", exact: true }).click();
  }
  await page.waitForURL("**/privacy#cookies");
}

export async function dismissCookies(page) {
  const banner = page.locator(".cookie-banner");
  if (!(await banner.isVisible())) return;
  await openCookieSettings(page, true);
  await page.getByRole("button", { name: "Без аналитики", exact: true }).click();
  await page.goBack();
  await banner.waitFor({ state: "hidden" });
}
