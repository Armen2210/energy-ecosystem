# Доказательства аудита 03.11.2026

Проверен точный снимок `feature/ee-documents@8514af5d0bbf4f77176b804b0d2445385e0f5082`, а не исходный checkout `work@413ff414c1f5a9ec08fb517095ec6f4029a66fc4`. Команды, exit codes, интерпретация и ограничения — в [основном отчёте](../release-readiness-audit.md).

- `*-tests.txt`, `lint.txt`, `build.txt`, `backend-check.txt`, `migrations-check.txt`: новые запуски текущего аудита.
- `postgres-suite.txt`: полный **неуспешный** PostgreSQL run, 1 failure / 23 errors. `postgres-worker-test-isolated.txt` воспроизводит harness-проблему отдельно; `postgres-worker-integration.txt` показывает успешный runtime вне TestCase. `postgres-questionnaires.txt`: 25 passed на PostgreSQL.
- `seo-http-browser.txt`: реальный локальный nginx и четыре browser suite, 8 passed. Sentinel upstream не является production API.
- `questionnaires-refinement.txt`, `questionnaire-scroll.txt`, `draft-browser.txt`, `analytics-browser.txt`: browser regressions с synthetic API/локальным API/перехватами; настоящий SMTP и цели не отправлялись.
- `integration.json`: четыре принятых ОЛ, повтор/конфликт, private PDFs, одно locmem-письмо. `btp-generated-page.png`: визуальная проверка первой страницы синтетического PDF.
- `results.json`: 48 route/width проверок; PNG — снимки текущей production-сборки на локальном nginx. Снимки не являются историческими картинками из репозитория.
- `accessibility.json`: обнаруженные axe violations/incomplete. Exit 0 диагностического runner **не означает отсутствие нарушений**.
- `questionnaire-clear.json`, `reduced-motion.json`: воспроизведённые A02/A03; диагностические runners специально сохраняют наблюдение, не исправляют код и не заменяют тесты приложения.
- `performance.json`: 9 cold-cache прогонов, параметры и resource entries; `bundle.json`: полный перечень артефактов/размеров/gzip, не объём одной загрузки.
- `npm-audit.json`, `python-advisories.json`: advisory ответы на дату проверки. Python ID дедуплицированы; совпадение версии не доказывает эксплуатацию в конкретном deployment.
- `external-access.json`: CONNECT 403 политики среды, не ответ публичного сайта.
- `snapshot-integrity.json`: 707 blobs совпали с зафиксированным Git SHA.

Диагностические `.mjs`/`.py` и `audit_*.py` скопированы для прозрачности методики. В них указаны **временные пути конкретного аудита**; перед повторением на другом компьютере адаптировать пути и создать отдельные БД/storage. Не применять `audit_local.py` на production: он наследует test-only settings и включает локальные синтетические приёмки. Зависимости Playwright/axe/nginx/PostgreSQL находятся вне проекта. Эти файлы не подключены к приложению.

Не включены `.env`, ключи, credentials, реальные клиентские файлы/БД или приватная история аккаунтов. Полные синтетические PDFs/БД оставлены во временном каталоге; в приложении — только один безопасный снимок страницы и агрегированные результаты.

## Упаковка для Git

Screenshots, одноразовые runners/settings и старые working-tree snapshots сохранены [как внешние артефакты](../release-handoff-external-artifacts.md), не включены в Git. Упомянутые выше имена таких файлов — историческое описание методики. Крупные логи сокращены с явной отметкой; полные оригиналы также вне checkout.
