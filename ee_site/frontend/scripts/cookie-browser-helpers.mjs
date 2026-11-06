export async function openCookieSettings(page, fromBanner = false) {
  await page.getByRole("link", {
    name: fromBanner ? "Подробнее и настройки" : "Настройки cookies",
    exact: true,
  }).click();
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
