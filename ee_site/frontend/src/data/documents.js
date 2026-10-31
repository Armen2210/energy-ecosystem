// Sizes and hashes describe the exact published bytes. Questionnaires/certificates
// are copied unchanged; SOUT PDFs have page-rotation metadata corrected only.
export const documentCategories = [
  {
    "id": "questionnaires",
    "title": "Опросные листы",
    "order": 1,
    "description": "Скачайте опросный лист для заполнения или передачи специалисту. Excel — для заполнения на компьютере, PDF — для печати"
  },
  {
    "id": "product-certificates",
    "title": "Сертификаты на изделия",
    "order": 2
  },
  {
    "id": "partner-certificates",
    "title": "Сертификаты партнёрства",
    "order": 3
  },
  {
    "id": "letters",
    "title": "Благодарственные письма",
    "order": 4
  },
  {
    "id": "sout",
    "title": "Специальная оценка условий труда (СОУТ)",
    "order": 5
  },
  {
    "id": "manuals",
    "title": "Инструкции по эксплуатации",
    "order": 6
  },
  {
    "id": "other",
    "title": "Другие документы",
    "order": 7
  }
];

export const documents = [
  {
    "id": "bmk-questionnaire",
    "categoryId": "questionnaires",
    "title": "Блочно-модульные котельные (БМК)",
    "productSlug": "bmk",
    "order": 1,
    "files": [
      {
        "format": "xlsx",
        "purpose": "Для заполнения на компьютере",
        "url": "/documents/questionnaires/bmk/ee-bmk-questionnaire.xlsx",
        "sizeBytes": 19242,
        "behavior": "download",
        "sha256": "a780155fe1fd3306c74b6508e89d30851e9e5a9b8bb1046f4e2cc08b9d2a0c7e"
      },
      {
        "format": "pdf",
        "purpose": "Для печати и заполнения от руки",
        "url": "/documents/questionnaires/bmk/ee-bmk-questionnaire.pdf",
        "sizeBytes": 78882,
        "behavior": "download",
        "sha256": "3383be58db536b0ba6456edf730e4440c58285234ffef4801622bc622d98ded6"
      }
    ]
  },
  {
    "id": "btp-questionnaire",
    "categoryId": "questionnaires",
    "title": "Блочные тепловые пункты (БТП)",
    "productSlug": "btp",
    "order": 2,
    "files": [
      {
        "format": "xlsx",
        "purpose": "Для заполнения на компьютере",
        "url": "/documents/questionnaires/btp/ee-btp-questionnaire.xlsx",
        "sizeBytes": 72888,
        "behavior": "download",
        "sha256": "b11b3cfecf75998b5aeea82418a6d3e0af47ace8987a01f5cdafa285a9f928c6"
      },
      {
        "format": "pdf",
        "purpose": "Для печати и заполнения от руки",
        "url": "/documents/questionnaires/btp/ee-btp-questionnaire.pdf",
        "sizeBytes": 155849,
        "behavior": "download",
        "sha256": "77ed365d1512436d80634b046e901aaadf03738b4bf9f8593b13e64a7e1a7a90"
      }
    ]
  },
  {
    "id": "vns-questionnaire",
    "categoryId": "questionnaires",
    "title": "Водопроводные насосные станции (ВНС)",
    "productSlug": "vns",
    "order": 3,
    "files": [
      {
        "format": "xlsx",
        "purpose": "Для заполнения на компьютере",
        "url": "/documents/questionnaires/vns/ee-vns-questionnaire.xlsx",
        "sizeBytes": 10874,
        "behavior": "download",
        "sha256": "80d16a9c20770c32376c3e3440d33f9e3b9c9a891ed9806783595ac5fe3d3bf1"
      },
      {
        "format": "pdf",
        "purpose": "Для печати и заполнения от руки",
        "url": "/documents/questionnaires/vns/ee-vns-questionnaire.pdf",
        "sizeBytes": 46537,
        "behavior": "download",
        "sha256": "35df838cc1505d08b038c599e3bd74429a8f14fb6b139cd1e12d2d60e78c2517"
      }
    ]
  },
  {
    "id": "pns-questionnaire",
    "categoryId": "questionnaires",
    "title": "Пожарные насосные станции (ПНС)",
    "productSlug": "pns",
    "order": 4,
    "files": [
      {
        "format": "xlsx",
        "purpose": "Для заполнения на компьютере",
        "url": "/documents/questionnaires/pns/ee-pns-questionnaire.xlsx",
        "sizeBytes": 11837,
        "behavior": "download",
        "sha256": "43d69ac0557ce693a25cb727e1058d46f2dd07c10ab1f4c724f9ded99d12b83e"
      },
      {
        "format": "pdf",
        "purpose": "Для печати и заполнения от руки",
        "url": "/documents/questionnaires/pns/ee-pns-questionnaire.pdf",
        "sizeBytes": 48561,
        "behavior": "download",
        "sha256": "39a93cd83d53be85352143fcdb6d8f901026732cb11ccb874a904cb0e825621d"
      }
    ]
  },
  {
    "id": "vzlet-partner",
    "categoryId": "partner-certificates",
    "title": "Свидетельство официального партнёра «Взлёт»",
    "order": 1,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/partners/ee-vzlet-partner.pdf",
        "sizeBytes": 159312,
        "behavior": "open",
        "sha256": "73a8f693ac86fbaddbcb0f280b4257aa3ec470fcde456c74c84a1457c19ccf2f"
      }
    ]
  },
  {
    "id": "termotronic-partner",
    "categoryId": "partner-certificates",
    "title": "Свидетельство партнёра «ТЕРМОТРОНИК»",
    "order": 2,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/partners/ee-termotronic-partner.pdf",
        "sizeBytes": 525180,
        "behavior": "open",
        "sha256": "6cd9149ca1c0648b8773dd1691828740bd926d2bf026dd8c988fa3cdae46912e"
      }
    ]
  },
  {
    "id": "tess-dealer",
    "categoryId": "partner-certificates",
    "title": "Сертификат дилера «ТЕСС-инжиниринг»",
    "order": 3,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/partners/ee-tess-dealer.pdf",
        "sizeBytes": 2085873,
        "behavior": "open",
        "sha256": "8708edbe9837a5207520a2defb2b717a6280d70aded423b13412debcc0493a3a"
      }
    ]
  },
  {
    "id": "teplosila-dealer",
    "categoryId": "partner-certificates",
    "title": "Сертификат дилера ГК «ТЕПЛОСИЛА»",
    "order": 4,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/partners/ee-teplosila-dealer.pdf",
        "sizeBytes": 346020,
        "behavior": "open",
        "sha256": "0b9b4b367cfa8735b1f1da658f9dbe68b28eb297b4c8bea419928e0eb54c1d61"
      }
    ]
  },
  {
    "id": "sout-2026",
    "categoryId": "sout",
    "title": "Результаты СОУТ — 2026",
    "order": 1,
    "description": "Сводная ведомость результатов и перечень рекомендуемых мероприятий",
    "files": [
      {
        "format": "pdf",
        "url": "/documents/sout/ee-sout-2026.pdf",
        "sizeBytes": 892113,
        "behavior": "open",
        "sha256": "8e0d9a98e65a5186b2271517378656d53136df70d591da396adfa9fb6c5b67d1"
      }
    ]
  },
  {
    "id": "sout-2022",
    "categoryId": "sout",
    "title": "Результаты СОУТ — 2022",
    "order": 2,
    "description": "Сводная ведомость результатов и перечень рекомендуемых мероприятий",
    "files": [
      {
        "format": "pdf",
        "url": "/documents/sout/ee-sout-2022.pdf",
        "sizeBytes": 1711755,
        "behavior": "open",
        "sha256": "b863912374f774acdec468b27bc93705f465792882e19e47120a782bfe946d91"
      }
    ]
  }
];

export function populatedDocumentCategories(entries = documents) {
  return [...documentCategories].sort((a, b) => a.order - b.order)
    .map(category => ({ ...category, documents: entries
      .filter(document => document.categoryId === category.id)
      .sort((a, b) => a.order - b.order) }))
    .filter(category => category.documents.length > 0);
}

export function formatDocumentSize(sizeBytes) {
  const megabytes = sizeBytes >= 1024 * 1024;
  const value = sizeBytes / (megabytes ? 1024 * 1024 : 1024);
  return `${new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 1 }).format(value)} ${megabytes ? 'МБ' : 'КБ'}`;
}
