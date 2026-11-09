# Проверки интеграции аналитики 9 ноября 2026

Ветка feat/ee-analytics-calltouch-forms от main 7e94ca54522928cf817b359449b9ea13cc76d789.
Скрипт Calltouch q0fhtb2e сохранён. Оформление баннера и CSS не менялись.
Меняется автозапуск до выбора, главный документ Метрики/Вебвизор, защита форм,
передача метаданных Calltouch и серверная очередь. Политика и раскрытый текст
баннера приведены в соответствие с поведением.

## Выполнено

- Frontend: npm test — 71 успешно; npm run lint — успешно.
- Production build с VITE_EE_ANALYTICS_ENABLED=true и
  VITE_EE_CALLTOUCH_ENABLED=true — успешно, 20 страниц + 404.
- npm run test:prerender с теми же флагами — 11 успешно.
- Django config.settings.test: 148 тестов, 147 успешно, 1 пропущен существующей suite.
  В их числе 15 тестов Calltouch: API, минимальный payload, first-write-wins,
  повтор, rollback, таймаут, invalid response, изоляция ошибки queue,
  разные направления, ручной requeue, статус, фиксированный проект.
- Django check и makemigrations --check --dry-run — без замечаний.
- Транспорт Calltouch в тестах подменён; production-заявки не создавались.

## Не подтверждено

Попытка запуска Chromium через Playwright завершилась до открытия страницы:
chrome/browser/process_singleton_posix.cc: socket() failed: Operation not permitted.
Поэтому scripts/analytics-browser.mjs и cookie-banner-browser.mjs обновлены,
но их успешное выполнение в этом окружении НЕ заявляется.
Проверка Вебвизора с реальным tag.js/кабинетом, подмены номеров и приёма API
Calltouch остаётся отдельным этапом с владельцем/подрядчиком.

## Перед приёмкой

1. Проверить ветку локально: баннер desktop/mobile, «Подробнее/Скрыть»,
   «Принять» не меняет положение кнопки и не создаёт повторных init/hit.
2. На production-host тестовом сценарии: свежий браузер запускает оба скрипта;
   после «Без аналитики» и reload оба не запускаются, формы доступны.
3. В контролируемом браузерном сценарии подтвердить lead_success только после
   201/подтверждённого duplicate 200, отсутствие calltouch_tracking после отказа.
4. В кабинете Метрики включить Вебвизор и проверить отсутствие содержимого форм.
5. При публикации backend требуется новая миграция и настройка worker;
   одного обновления frontend недостаточно. См. ../../backend/docs/calltouch-delivery.md.

main, production-конфигурация, реальные кабинеты, почта и production-база
в ходе разработки не менялись. Email-трекинг через технический ящик настраивается отдельно.
