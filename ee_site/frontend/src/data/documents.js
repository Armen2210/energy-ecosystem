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
  },
  {
    "id": "ee-btp-declaration-2022",
    "categoryId": "product-certificates",
    "title": "Декларация о соответствии БТП «ГигаТерм»",
    "description": "ООО «Энергоэффект». Документ от 05.04.2022, срок действия по 30.03.2027.",
    "order": 1,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/products/ee-btp-declaration-2022.pdf",
        "sizeBytes": 454009,
        "behavior": "open",
        "sha256": "e7753edaf19eb2211eb77824a47e62e8c947d1f86d891c52053399de6704c865"
      }
    ]
  },
  {
    "id": "ee-bmk-declaration-2026",
    "categoryId": "product-certificates",
    "title": "Декларация о соответствии блочно-модульных котельных «ГигаТерм»",
    "description": "ООО «Энергоэффект». ЕАЭС N RU Д-RU.РА06.В.62223/26. Срок действия по 29.07.2031.",
    "order": 2,
    "files": [
      {
        "format": "docx",
        "url": "/documents/certificates/products/ee-bmk-declaration-2026.docx",
        "sizeBytes": 12516,
        "behavior": "download",
        "sha256": "821f60ea33c6a2c8ff54ddbf790d506837a33604f7f4ebf39b33b2a9e7ee0c99"
      }
    ]
  },
  {
    "id": "ee-boilers-declaration-2026",
    "categoryId": "product-certificates",
    "title": "Декларация о соответствии транспортабельных и крышных котельных «ГигаТерм»",
    "description": "ООО «Энергоэффект». Мощность от 0,1 до 50,0 МВт. ЕАЭС N RU Д-RU.РА06.В.62320/26. Срок действия по 29.07.2031.",
    "order": 3,
    "files": [
      {
        "format": "docx",
        "url": "/documents/certificates/products/ee-boilers-declaration-2026.docx",
        "sizeBytes": 12374,
        "behavior": "download",
        "sha256": "393f645fdde911b4838b904ec713ccc8b80894c6d10049b7c3c2363e92648cce"
      }
    ]
  },
  {
    "id": "ee-boilers-conformity-92122",
    "categoryId": "product-certificates",
    "title": "Сертификат соответствия котельных «ГигаТерм»",
    "description": "ООО «Энергоэффект». Регистрационный номер РОСС RU.32001.04ИФ01.ОСП32.92122.",
    "order": 4,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/products/ee-boilers-conformity-92122.pdf",
        "sizeBytes": 1120240,
        "behavior": "open",
        "sha256": "c8a09794443c576a810ccf909c9f15860c2eadd950e603a84bbe38e14c9bc8bf"
      }
    ]
  },
  {
    "id": "ee-boilers-seismic-92123",
    "categoryId": "product-certificates",
    "title": "Сертификат сейсмостойкости котельных «ГигаТерм» — 9 баллов",
    "description": "ООО «Энергоэффект». Регистрационный номер РОСС RU.32001.04ИФ01.ОСП32.92123.",
    "order": 5,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/products/ee-boilers-seismic-92123.pdf",
        "sizeBytes": 1094213,
        "behavior": "open",
        "sha256": "59b4c84211328678f36b5d5e89c3047e4f407a0911124ac898dc088c8e25e2dd"
      }
    ]
  },
  {
    "id": "ee-equipment-seismic",
    "categoryId": "product-certificates",
    "title": "Сертификат сейсмостойкости БТП, насосных установок и БМК — до 12 баллов",
    "description": "ООО «Энергоэффект». Регистрационный номер РОСС RU.32623.ОС11.09098.",
    "order": 6,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/products/ee-equipment-seismic.pdf",
        "sizeBytes": 673548,
        "behavior": "open",
        "sha256": "5f2de6708157ca51d961760611c294c1f00405b91efdce2645c9dee8557556f2"
      }
    ]
  },
  {
    "id": "ee-akvarus-declaration",
    "categoryId": "product-certificates",
    "title": "Декларация о соответствии насосных станций «АКВАРУС»",
    "description": "ООО «Энергоэффект». Срок действия по 12.06.2029 включительно.",
    "order": 7,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/products/ee-akvarus-declaration.pdf",
        "sizeBytes": 332538,
        "behavior": "open",
        "sha256": "b313270bf9b809981c2141c76920a5ce427cb80774a47c5e6264194865e2f3e5"
      }
    ]
  },
  {
    "id": "ee-energoline-controls-2026",
    "categoryId": "product-certificates",
    "title": "Сертификат соответствия шкафов автоматики и управления «Энерголайн» — 2026",
    "description": "ООО «Энергоэффект». Документ с приложением. Срок действия по 28.01.2031.",
    "order": 8,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/products/ee-energoline-controls-2026.pdf",
        "sizeBytes": 812833,
        "behavior": "open",
        "sha256": "d0594198499dd77005c0714757d47be2826a8a12089f689071a65005335f8491"
      }
    ]
  },
  {
    "id": "ee-energoline-controls-2022",
    "categoryId": "product-certificates",
    "title": "Сертификат соответствия шкафов управления насосами «Энерголайн» — 2022",
    "description": "ООО «Энергоэффект». Срок действия по 28.03.2027.",
    "order": 9,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/products/ee-energoline-controls-2022.pdf",
        "sizeBytes": 1649257,
        "behavior": "open",
        "sha256": "cd505bd087e359ba62912b06846197ec6b7529abb98281924bb655b40b3c139b"
      }
    ]
  },
  {
    "id": "asta-valves-seismic",
    "categoryId": "product-certificates",
    "title": "Сертификат сейсмостойкости трубопроводной арматуры АСТА — 9 баллов",
    "description": "Изготовитель — ООО «НПО АСТА». Срок действия по 11.04.2027.",
    "order": 10,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/products/asta-valves-seismic.pdf",
        "sizeBytes": 963390,
        "behavior": "open",
        "sha256": "f80a9e154839c7bebb9ead6f3e0b143c100c4e89e38f27270323ca40165afcc1"
      }
    ]
  },
  {
    "id": "pipes-certificates-2022",
    "categoryId": "product-certificates",
    "title": "Комплект документов на трубопроводы — 09.2022",
    "description": "Документы изготовителей трубопроводов и комплектующих. PDF, 41 страница.",
    "order": 11,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/certificates/products/pipes-certificates-2022.pdf",
        "sizeBytes": 8864415,
        "behavior": "open",
        "sha256": "dbc4d55ba32e07d600ccb40db43fd071d6a36c3f28c5df99004bf7c3fa72a7cf"
      }
    ]
  },
  {
    "id": "ee-gs1-2026",
    "categoryId": "other",
    "title": "Свидетельство о членстве в Ассоциации «ГС1 РУС»",
    "description": "ООО «Энергоэффект». Документ от 01.11.2026, действителен по 31.10.2027.",
    "order": 12,
    "files": [
      {
        "format": "pdf",
        "url": "/documents/other/ee-gs1-2026.pdf",
        "sizeBytes": 585267,
        "behavior": "open",
        "sha256": "f43b62ac80a597199ad2cbd35bbc9dbb107e44306a4d6a5df633c92107ebebb7"
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
