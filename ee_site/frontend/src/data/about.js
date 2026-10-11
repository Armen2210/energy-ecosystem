import directorSmall from '../assets/about/optimized/dsc05801-small.webp';
import directorPage from '../assets/about/optimized/dsc05801-page.webp';
import directorLarge from '../assets/about/optimized/dsc05801-large.webp';
import teamSmall from '../assets/about/optimized/img_5539-small.webp';
import teamPage from '../assets/about/optimized/img_5539-page.webp';
import teamLarge from '../assets/about/optimized/img_5539-large.webp';
import productionSmall from '../assets/about/optimized/img_6486-small.webp';
import productionPage from '../assets/about/optimized/img_6486-page.webp';
import productionLarge from '../assets/about/optimized/img_6486-large.webp';
import weldingSmall from '../assets/about/optimized/img_5858-small.webp';
import weldingPage from '../assets/about/optimized/img_5858-page.webp';
import weldingLarge from '../assets/about/optimized/img_5858-large.webp';
import workshopSmall from '../assets/about/optimized/img_1497-small.webp';
import workshopPage from '../assets/about/optimized/img_1497-page.webp';
import workshopLarge from '../assets/about/optimized/img_1497-large.webp';
import visitSmall from '../assets/about/optimized/img_5629-small.webp';
import visitPage from '../assets/about/optimized/img_5629-page.webp';
import visitLarge from '../assets/about/optimized/img_5629-large.webp';
import anniversarySmall from '../assets/about/optimized/img_4442-small.webp';
import anniversaryPage from '../assets/about/optimized/img_4442-page.webp';
import anniversaryLarge from '../assets/about/optimized/img_4442-large.webp';
import manifest from '../assets/about/optimized/manifest.json';

function photo(source, small, page, large, caption, alt = caption) {
  const { variants } = manifest.find(item => item.source === source);
  return { id: source.split('.')[0].toLowerCase(), small, page, large, caption, alt,
    width: variants.page.width, height: variants.page.height,
    srcSet: `${small} ${variants.small.width}w, ${page} ${variants.page.width}w` };
}

// Тексты и подписи меняются здесь. Импортировать только optimized/, не исходники.
export const aboutPhotos = {
  director: photo('DSC05801.jpg', directorSmall, directorPage, directorLarge,
    'Директор ООО «Энергоэффект»', 'Директор ООО «Энергоэффект» рядом с инженерной установкой'),
  team: photo('IMG_5539.jpg', teamSmall, teamPage, teamLarge,
    'Сотрудники офиса знакомятся с технологическими процессами. Объясняет начальник производства'),
  production: photo('IMG_6486.JPG', productionSmall, productionPage, productionLarge,
    'Начальник производства рядом с теплообменником'),
  welding: photo('IMG_5858.png', weldingSmall, weldingPage, weldingLarge,
    'Сварочные работы на производстве'),
  workshop: photo('IMG_1497.png', workshopSmall, workshopPage, workshopLarge,
    'Производственный цех'),
  visit: photo('IMG_5629.jpg', visitSmall, visitPage, visitLarge,
    'Обсуждаем с заказчиком ход изготовления его оборудования'),
  anniversary: photo('IMG_4442.JPG', anniversarySmall, anniversaryPage, anniversaryLarge,
    'Празднуем 12-летие компании'),
};

// Добавление в серию: подготовить производные, объявить photo выше, добавить здесь.
export const productionGallery = [aboutPhotos.welding, aboutPhotos.workshop, aboutPhotos.visit];

export const about = {
  seo: {
    title: 'О нас — команда и производство | Энергоэффект',
    description: 'Познакомьтесь с командой „Энергоэффекта“: руководители, инженерные подразделения и производство. Фотографии цеха, рабочих процессов и жизни компании',
  },
  title: 'О нас',
  history: 'С 2014 года проектируем и производим инженерное оборудование',
  director: {
    // ВРЕМЕННО: заменить реальным согласованным именем перед публикацией. Не Person JSON-LD.
    name: 'Иван Иваныч', temporaryName: true, role: 'Директор ООО «Энергоэффект»',
    paragraphs: [
      'Мы — люди разных поколений, с разными интересами и характерами. Нас объединяет общее дело: мы проектируем и производим современное инженерное оборудование.',
      'В нашей команде ценят честность, взаимную поддержку и любовь к своей работе. Каждый вкладывает в результат свои знания, опыт и душу — от первого разговора с заказчиком до сборки и запуска оборудования.',
      'Мы горим своим делом не менее ярко, чем газ в горелках наших котельных. А особое удовольствие получаем, когда всё, что начиналось с обсуждений и чертежей, начинает работать на объекте.',
      'Будем рады познакомиться и поработать вместе. Нужна готовая установка, оборудование по вашему проекту или помощь с проектированием будущего объекта — давайте обсудим задачу.',
    ],
  },
  team: {
    title: 'Кто работает над вашим проектом',
    intro: 'У каждого в команде своя работа. Чтобы проект стал готовым оборудованием, мы объединяем усилия офиса, инженерных подразделений и производства',
    departments: [
      ['Отдел продаж', 'общение с заказчиком и сопровождение заказа'],
      ['Технический отдел', 'подбор оборудования и расчёт решений'],
      ['Отдел проектирования', 'разработка проектной документации'],
      ['Производство', 'изготовление и сборка оборудования'],
      ['Служба КИПиА', 'автоматика, шкафы управления и настройка'],
      ['Строительно-монтажный участок', 'монтаж оборудования и инженерных систем'],
      ['Сервисная служба', 'обслуживание и помощь в эксплуатации'],
    ],
  },
  production: {
    title: 'На нашем производстве',
    quote: 'Чем больше задача, тем интереснее её собирать… Главное, чтобы готовое изделие прошло в ворота :)',
    // ВРЕМЕННО: заменить реальным согласованным именем перед публикацией.
    name: 'Сан Саныч', temporaryName: true, role: 'Начальник производства',
    stages: [
      { title: 'От задачи к документации', text: 'Работа начинается с задачи заказчика. Помогаем подготовить запросы на получение технических условий, разрабатываем и согласовываем проекты. Для изготовления создаём 3D-модели изделий, схемы шкафов управления и производственную документацию.' },
      { title: 'Изготовление и проверка', text: 'На производстве изготавливаем рамы и трубную обвязку, устанавливаем оборудование, выполняем сварочные и монтажные работы, окраску и испытания. Собираем шкафы управления, монтируем их на изделие, подключаем оборудование и проверяем работу. Для установок в блок-боксе изготавливаем каркас и выполняем обшивку сэндвич-панелями.' },
      { title: 'Отгрузка и документы', text: 'Готовое изделие упаковываем и отгружаем. Заказчик получает паспорт изделия с отметкой об испытаниях и документацию на оборудование, вошедшее в его состав.' },
    ],
    scope: 'Состав поставки и работ согласовываем под задачу и фиксируем в договоре.',
  },
  anniversary: {
    title: 'Нам 12 лет',
    text: 'За рабочими задачами всегда стоят люди. Здесь мы собрались вместе, чтобы отметить 12 лет „Энергоэффекту“',
  },
  contact: {
    title: 'Давайте познакомимся',
    text: 'Расскажите, что планируете. Можно начать с описания задачи, даже если готового проекта пока нет. Менеджер уточнит, какое оборудование требуется и какие исходные данные нужны для расчёта — например, нагрузки и расходы',
    geography: 'Поставляем оборудование, выполняем монтаж и пусконаладочные работы по России. Объём, стоимость и условия выезда согласовываем при подготовке коммерческого предложения и фиксируем в договоре',
    button: 'Обсудить проект',
  },
};
