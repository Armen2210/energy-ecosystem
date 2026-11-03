# Внешние артефакты передачи, 03.11.2026

Полные исходные материалы сохранены вне checkout: `/workspace/release-handoff-artifacts/2026-11-03/original-docs/`. Это локальный каталог облачной среды, **он не попадёт в Git и не появится после clone**. Получать отдельно у подготовившего передачу; срок хранения среды не гарантирован. Manifest с SHA-256: `excluded-manifest.json` рядом с каталогом.

В Git оставлены отчёты, security disposition, протокол поиска и компактные результаты. Исключены полный patch (8,2 MB), screenshots, одноразовые диагностические runners/локальные settings, старые снимки git status, крупные ответы advisory. Большие логи оставлены сокращёнными с явной отметкой; оригиналы сохранены. Никакие ранее tracked файлы не удалены.

Отчёты аудита описывают историческую проверку; перенаправление ссылок при упаковке не меняет её выводов. Ниже — внешний каталог исключённых материалов, а не ссылки на файлы в Git.

- `original-docs/release-readiness-evidence/a11y.mjs`
- `original-docs/release-readiness-evidence/about-1440.png`
- `original-docs/release-readiness-evidence/about-360.png`
- `original-docs/release-readiness-evidence/audit_local.py`
- `original-docs/release-readiness-evidence/audit_pg.py`
- `original-docs/release-readiness-evidence/browser-review.mjs`
- `original-docs/release-readiness-evidence/btp-generated-page.png`
- `original-docs/release-readiness-evidence/clear-questionnaire.mjs`
- `original-docs/release-readiness-evidence/documents-1440.png`
- `original-docs/release-readiness-evidence/documents-360.png`
- `original-docs/release-readiness-evidence/form-1440.png`
- `original-docs/release-readiness-evidence/form-360.png`
- `original-docs/release-readiness-evidence/form-390.png`
- `original-docs/release-readiness-evidence/form-640.png`
- `original-docs/release-readiness-evidence/form-768.png`
- `original-docs/release-readiness-evidence/form-960.png`
- `original-docs/release-readiness-evidence/home-1440.png`
- `original-docs/release-readiness-evidence/home-360.png`
- `original-docs/release-readiness-evidence/integration.py`
- `original-docs/release-readiness-evidence/motion.mjs`
- `original-docs/release-readiness-evidence/performance.mjs`
- `original-docs/release-readiness-evidence/python-advisories.json`
- `original-docs/release-readiness-evidence/questionnaire-1440.png`
- `original-docs/release-readiness-evidence/questionnaire-390.png`
- `original-docs/release-readiness-evidence/working-tree-status.txt`
- `original-docs/release-readiness-fixes-evidence/a11y.mjs`
- `original-docs/release-readiness-fixes-evidence/baseline_pg.py`
- `original-docs/release-readiness-fixes-evidence/fixes_local.py`
- `original-docs/release-readiness-fixes-evidence/fixes_pg.py`
- `original-docs/release-readiness-fixes-evidence/integration.py`
- `original-docs/release-readiness-fixes-evidence/performance-comparison.mjs`
- `original-docs/release-readiness-fixes-evidence/pypi-baseline-advisories.json`
- `original-docs/release-readiness-fixes-evidence/states-error-1440.png`
- `original-docs/release-readiness-fixes-evidence/states-error-360.png`
- `original-docs/release-readiness-fixes-evidence/states-focus-1440.png`
- `original-docs/release-readiness-fixes-evidence/states-focus-360.png`
- `original-docs/release-readiness-fixes-evidence/states-hover-1440.png`
- `original-docs/release-readiness-fixes-evidence/states-hover-360.png`
- `original-docs/release-readiness-fixes-evidence/states-submitting-1440.png`
- `original-docs/release-readiness-fixes-evidence/states-submitting-360.png`
- `original-docs/release-readiness-fixes-evidence/states.mjs`
- `original-docs/release-readiness-fixes-evidence/targeted-design-1440.png`
- `original-docs/release-readiness-fixes-evidence/targeted-design-360.png`
- `original-docs/release-readiness-fixes-evidence/targeted-design-page-1440.png`
- `original-docs/release-readiness-fixes-evidence/targeted-design-page-360.png`
- `original-docs/release-readiness-fixes-evidence/visual-form-1440.png`
- `original-docs/release-readiness-fixes-evidence/visual-form-360.png`
- `original-docs/release-readiness-fixes-evidence/visual-form-390.png`
- `original-docs/release-readiness-fixes-evidence/visual-form-640.png`
- `original-docs/release-readiness-fixes-evidence/visual-form-768.png`
- `original-docs/release-readiness-fixes-evidence/visual-form-960.png`
- `original-docs/release-readiness-fixes-evidence/visual-home-1440.png`
- `original-docs/release-readiness-fixes-evidence/visual-home-360.png`
- `original-docs/release-readiness-fixes-evidence/visual-questionnaire-1440.png`
- `original-docs/release-readiness-fixes-evidence/visual-questionnaire-390.png`
- `original-docs/release-readiness-fixes-evidence/working-tree-status.txt`
- `original-docs/release-readiness-fixes.diff`

При упаковке в текстовых логах удалены только хвостовые пробелы/пустые строки, чтобы пройти `git diff --cached --check`; исходные bytes сохранены во внешней копии.
