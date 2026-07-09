// =========================================================
// CASES / КЕЙСЫ И РЕАЛИЗОВАННЫЕ ЗАДАЧИ
// Единый источник данных для:
// - короткого блока кейсов на главной;
// - страницы /cases;
// - будущих детальных страниц отдельных объектов.
// =========================================================

import bmkFokElistaCover from "../assets/cases/bmk-fok-elista/cover.jpg";
import btpAlatyrDairyPlantCover from "../assets/cases/btp-alatyr-dairy-plant/cover.jpg";
import btpAnapaLuchiCover from "../assets/cases/btp-anapa-luchi/cover.webp";
import btpDerbentMagmaCover from "../assets/cases/btp-derbent-magma/cover.webp";
import btpKamenskyPlantCover from "../assets/cases/btp-kamensky-plant/cover.webp";

export const cases = [
  {
    slug: "bmk-fok-elista",
    type: "БМК",
    title: "Блочно-модульная котельная для ФОК в Элисте",
    description:
      "Котельная в блочно-модульном исполнении для задачи теплоснабжения объекта.",
    previewDescription:
      "Производственное решение под параметры объекта, требования эксплуатации и работу инженерной системы.",
    category: "Блочно-модульные котельные",
    coverImage: bmkFokElistaCover,
    coverImageAlt: "Блочно-модульная котельная для физкультурно-оздоровительного комплекса в Элисте",
    url: "/cases/bmk-fok-elista",
    isFeatured: true,
  },
  {
    slug: "btp-alatyr-dairy-plant",
    type: "БТП",
    title: "Блочный тепловой пункт для молочного производства",
    description:
      "Тепловой пункт для подключения объекта к тепловым сетям и управления параметрами теплоснабжения.",
    previewDescription:
      "Решение для регулирования отопления, горячего водоснабжения и учёта тепловой энергии на производственном объекте.",
    category: "Блочные тепловые пункты",
    coverImage: btpAlatyrDairyPlantCover,
    coverImageAlt: "Блочный тепловой пункт для молочного производства",
    url: "/cases/btp-alatyr-dairy-plant",
    isFeatured: true,
  },
  {
    slug: "btp-anapa-luchi",
    type: "БТП",
    title: "Блочный тепловой пункт для объекта в Анапе",
    description:
      "Тепловой пункт для работы инженерных систем здания с учётом параметров объекта.",
    previewDescription:
      "Компоновка оборудования, трубопроводной обвязки и автоматики для надёжной работы теплового пункта.",
    category: "Блочные тепловые пункты",
    coverImage: btpAnapaLuchiCover,
    coverImageAlt: "Блочный тепловой пункт для объекта в Анапе",
    url: "/cases/btp-anapa-luchi",
    isFeatured: true,
  },
  {
    slug: "btp-derbent-magma",
    type: "БТП",
    title: "Блочный тепловой пункт для объекта в Дербенте",
    description:
      "Инженерное решение для подключения объекта к системе теплоснабжения и управления тепловыми режимами.",
    previewDescription:
      "Тепловой пункт с оборудованием, обвязкой и автоматикой под требования проекта и эксплуатации.",
    category: "Блочные тепловые пункты",
    coverImage: btpDerbentMagmaCover,
    coverImageAlt: "Блочный тепловой пункт для объекта в Дербенте",
    url: "/cases/btp-derbent-magma",
    isFeatured: false,
  },
  {
    slug: "btp-kamensky-plant",
    type: "БТП",
    title: "Блочный тепловой пункт для производственного объекта",
    description:
      "Тепловой пункт для инженерной инфраструктуры производственного объекта.",
    previewDescription:
      "Решение для стабильной работы тепловых систем, регулирования параметров и дальнейшего обслуживания.",
    category: "Блочные тепловые пункты",
    coverImage: btpKamenskyPlantCover,
    coverImageAlt: "Блочный тепловой пункт для производственного объекта",
    url: "/cases/btp-kamensky-plant",
    isFeatured: false,
  },
];

export const featuredCases = cases.filter((caseItem) => caseItem.isFeatured);