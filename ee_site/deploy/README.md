# Будущее внедрение prerender ЭЭ

Это инструкция и nginx-фрагмент для отдельного согласованного внедрения.
Действующий сервер, TLS, база и production migrate этим этапом не менялись.

1. Сохранить текущий vhost и полный предыдущий dist. Проверить реальные root,
   HTTPS/www redirects, server headers, WAF/CDN, API/admin/static/media,
   private storage, JSON-ошибки и Retry-After. Не подменять полный vhost примером.
2. В чистой frontend-сборке на Node 22.13+ либо 24 выполнить `npm ci`,
   `npm test`, `npm run lint`, `npm run build`, `npm run test:prerender`.
   Production .env сборка не читает. Нужные VITE_* задавать явно процессу;
   аналитика выключена по умолчанию. При изменении её флага проверить consent
   и hostname gate отдельно; наличие prerender не включает счётчик.
3. Подготовить отдельный versioned каталог полного dist: assets, все 19 HTML,
   404, sitemap, robots, analytics-frame и `prerender-routes.conf`. Не копировать
   только index.html, не смешивать старые и новые hashed assets. Manifest служит
   для проверки полноты, nginx не выдаёт его и конфигурационный include публично.
4. Встроить `nginx_technical_seo.conf.example` в действующий server, заменив
   `__EE_DIST__` абсолютным путём к этому versioned каталогу. Убрать прежний
   blanket SPA fallback и конфликтующий ручной allowlist. Сгенерированный include
   и server root должны указывать на одну версию dist. Имена HTML — плоские
   `/about.html`, `/solutions/bmk.html`; не добавлять `$uri/` или общий index
   fallback к неизвестным URL. Публичные URL остаются без trailing slash.
5. До reload выполнить `nginx -t`. На staging/целевом сервере проверить все
   canonical URL (200 и собственный HTML), unknown entity URLs (404 без redirect
   или canonical), contacts/index/known trailing slash (301 с query), assets,
   frame/discovery files, inherited headers, API/admin JSON и Retry-After.
   Проверить no-JS и delayed-JS форму, SPA/Back/Forward, черновик, документы,
   policy tab, modal/gallery/focus и consent. Настройки API не перехватывать
   `proxy_intercept_errors`; production POST только в отдельно согласованном тесте.
6. Переключить root/include согласованно и выполнить reload только после
   отдельного разрешения. Проверить public read-only HTML/status, затем сценарии
   браузера, логи и кеши. Изменения контента/slugs требуют полной новой сборки.

Откат: при неизвестных 200, пропавших известных страницах/assets, hydration
ошибках, потере черновика или изменении API/headers вернуть предыдущий **полный**
dist и vhost/root/include вместе, выполнить `nginx -t`, затем согласованный
reload. Учитывать кеширование старых вкладок: сохранить доступность предыдущих
hashed assets на время перехода по принятой политике сервера. Этот этап не
меняет backend и не требует миграции БД; откат не должен затрагивать заявки.

Локальное подтверждение и таблица маршрутов:
[prerender-validation.md](../frontend/docs/prerender-validation.md).
