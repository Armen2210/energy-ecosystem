# Доказательства исправлений A01–A07

Дата: 03.11.2026. База: feature/ee-documents@8514af5d0bbf4f77176b804b0d2445385e0f5082 плюс рабочие изменения. Команды, условия и ограничения приведены в ../release-readiness-fixes.md.

Все заявки синтетические; PostgreSQL, файлы и почта изолированы в /tmp/ee-fixes; SMTP locmem, внешние браузерные запросы блокированы. Реальный сервер и кабинеты не проверялись. Конфигурации fixes_*.py и baseline_pg.py содержат только локальные тестовые настройки. Старый audit сохранён отдельно.

*-final.txt — окончательные проверки; postgres-baseline-reproduced.txt — ожидаемый провал неизменённой базы; npm/pip JSON — результаты сканеров. performance-comparison.* — шесть лабораторных прогонов, runner и условия; accessibility.* — ограниченная axe-проверка. targeted-*, visual-* и states-* — локальные screenshots/результаты; это не полная сертификация доступности. states.txt подтверждает окончательный успешный запуск states.mjs.

changed-code-manifest.json перечисляет все 38 изменённых/новых файлов кода, тестов, зависимостей, README/runbooks и изображений с SHA-256. working-tree-status.txt фиксирует конечный HEAD, branch, git status и отсутствие staged изменений. Полный patch расположен рядом с отчётом; сам себя он не включает.

## Упаковка для Git

Screenshots, одноразовые runners/settings и старые working-tree snapshots сохранены [как внешние артефакты](../release-handoff-external-artifacts.md), не включены в Git. Упомянутые выше имена таких файлов — историческое описание методики. Крупные логи сокращены с явной отметкой; полные оригиналы также вне checkout.
