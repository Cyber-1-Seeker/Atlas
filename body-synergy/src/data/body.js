// src/data/body.js
// ============================================================
// ДАННЫЕ ЗАМЕРОВ ТЕЛА
// Система оценки: процентильная, взвешенная
// Каждый замер → балл 0-100 → итоговый Body Score
// ============================================================

// ── ВЕСОВЫЕ КОЭФФИЦИЕНТЫ БЛОКОВ ──────────────────────────
// Сумма = 1.0
export const BLOCK_WEIGHTS = {
  genetics:  0.20,  // генетика — базовый каркас
  body:      0.55,  // тело — основной потенциал роста
  face:      0.10,  // лицо — субъективно
  fitness:   0.15,  // физическая форма — сила/выносливость
}

// ── КАТЕГОРИИ ─────────────────────────────────────────────
export const BLOCKS = [
  {
    id: 'genetics',
    name: 'Генетика',
    icon: '🧬',
    color: '#8b3cff',
    colorGlow: '#a855f7',
    description: 'То что дано природой. Нельзя изменить — но важно знать как стартовать.',
    changeable: false,
  },
  {
    id: 'body',
    name: 'Тело',
    icon: '💪',
    color: '#e8304a',
    colorGlow: '#ff4060',
    description: 'Основа привлекательности. Здесь максимальный потенциал роста.',
    changeable: true,
  },
  {
    id: 'face',
    name: 'Лицо',
    icon: '👁️',
    color: '#f472b6',
    colorGlow: '#f9a8d4',
    description: 'Субъективная оценка черт лица. Влияет на первое впечатление.',
    changeable: false,
  },
  {
    id: 'fitness',
    name: 'Физическая форма',
    icon: '⚡',
    color: '#fbbf24',
    colorGlow: '#fcd34d',
    description: 'Сила, выносливость, процент жира. Прямо влияет на привлекательность.',
    changeable: true,
  },
]

// ── ЗАМЕРЫ ────────────────────────────────────────────────
// scoring: функция val → 0-100
// unit: единица измерения
// howToMeasure: инструкция
// research: научное обоснование
// optimal: оптимальный диапазон для описания

export const MEASUREMENTS = [

  // ════════════════════════════════════════════════════════
  // ГЕНЕТИКА
  // ════════════════════════════════════════════════════════
  {
    id: 'height',
    block: 'genetics',
    name: 'Рост',
    unit: 'см',
    icon: '📏',
    weight: 0.35, // вес внутри блока
    howToMeasure: 'Встань без обуви спиной к стене, пятки касаются стены. Приложи книгу горизонтально к макушке. Измерь от пола до книги. Измеряй утром — к вечеру рост уменьшается на 1-2 см.',
    research: 'Мета-анализ 50+ исследований показывает: женщины в среднем предпочитают мужчин ростом 180-188 см. Оптимальное соотношение — партнёр на 8-13 см выше (Courtship Compliance, Sear & Mace, 2008). Рост 185 см находится в топ-15% мужчин РФ.',
    source: 'Sear & Mace, Human Nature, 2008; Sohn, Evolution & Human Behavior, 2016',
    optimal: '178–188 см',
    scoring: (v) => {
      // Процентиль: средний рост РФ ~176 см, SD ~7 см
      if (v <= 160) return 20
      if (v <= 170) return 30 + (v - 160) * 2
      if (v <= 176) return 50 + (v - 170) * 2.5
      if (v <= 185) return 65 + (v - 176) * 3.3
      if (v <= 192) return 95 - (v - 185) * 1.5 // выше 192 — начинает снижаться
      return Math.max(75, 95 - (v - 192) * 2)
    },
  },

  {
    id: 'wrist',
    block: 'genetics',
    name: 'Обхват запястья',
    unit: 'см',
    icon: '⌚',
    weight: 0.20,
    howToMeasure: 'Измерь сантиметровой лентой вокруг самой узкой части запястья — чуть ниже косточки. Лента должна плотно прилегать, но не сдавливать. Измеряй доминирующую руку.',
    research: 'Запястье определяет "раму" тела — генетический каркас. Обхват 17-19 см считается оптимальным для мезоморфного типа. Исследования показывают: мужчины с пропорциональным запястьем воспринимаются как более атлетичные даже без видимой мускулатуры.',
    source: 'Tovée et al., Proceedings of the Royal Society, 1999',
    optimal: '17–19 см',
    scoring: (v) => {
      if (v < 15) return 20
      if (v < 17) return 30 + (v - 15) * 15
      if (v <= 19) return 60 + (v - 17) * 15
      if (v <= 21) return 90 - (v - 19) * 5
      return 80
    },
  },

  {
    id: 'penis_length',
    block: 'genetics',
    name: 'Длина полового органа',
    unit: 'см',
    icon: '📐',
    weight: 0.25,
    howToMeasure: 'Измеряй в эрегированном состоянии. Приложи линейку к основанию сверху (к лобку), слегка надавив через жировую прослойку. Измерь до кончика. Это стандартный метод BPEL (Bone Pressed Erect Length) используемый в исследованиях.',
    research: 'Крупнейшее мета-исследование (Veale et al., BJU International, 2015) — 15521 мужчина: средняя длина 13.1 см BPEL. Опрос женщин (Prause et al., PLOS ONE, 2015): оптимальная длина для разового секса — 15.8 см, для отношений — 15.3 см. 85% женщин удовлетворены размером партнёра.',
    source: 'Veale et al., BJU International, 2015; Prause et al., PLOS ONE, 2015',
    optimal: '14–17 см',
    scoring: (v) => {
      if (v < 10) return 15
      if (v < 13) return 25 + (v - 10) * 8
      if (v < 15) return 49 + (v - 13) * 10
      if (v <= 17) return 69 + (v - 15) * 10
      if (v <= 19) return 89 - (v - 17) * 2
      return 85
    },
  },

  {
    id: 'penis_girth',
    block: 'genetics',
    name: 'Обхват полового органа',
    unit: 'см',
    icon: '🔵',
    weight: 0.20,
    howToMeasure: 'В эрегированном состоянии. Оберни сантиметровую ленту вокруг середины shaft — не у основания, не у головки. Лента параллельно полу. Запиши обхват.',
    research: 'По данным Veale et al. 2015: средний обхват 11.66 см. Исследование Prause 2015: женщины называют оптимальным обхват 12.7 см для разового секса. Обхват влияет на ощущения сильнее чем длина по данным большинства опросов.',
    source: 'Veale et al., BJU International, 2015; Herbenick et al., PLOS ONE, 2014',
    optimal: '12–14 см',
    scoring: (v) => {
      if (v < 9) return 20
      if (v < 11) return 30 + (v - 9) * 10
      if (v < 12.5) return 50 + (v - 11) * 13
      if (v <= 14) return 70 + (v - 12.5) * 10
      if (v <= 16) return 85 - (v - 14) * 3
      return 79
    },
  },

  // ════════════════════════════════════════════════════════
  // ТЕЛО
  // ════════════════════════════════════════════════════════
  {
    id: 'shoulders',
    block: 'body',
    name: 'Обхват плеч',
    unit: 'см',
    icon: '🏋️',
    weight: 0.18,
    howToMeasure: 'Встань прямо, руки опущены. Измерь сантиметровой лентой по самой широкой части плеч и дельтовидных мышц — лента проходит горизонтально, по выступающим точкам. Не поднимай плечи.',
    research: 'Соотношение плечи/талия (WHR) — один из самых сильных предикторов мужской привлекательности. Идеал — 0.75-0.80 (ширина талии = 75-80% ширины плеч). Широкие плечи сигнализируют о тестостероне и физической силе (Sell et al., Evolution & Human Behavior, 2017).',
    source: 'Sell et al., Evolution & Human Behavior, 2017; Maisey et al., Proc. R. Soc., 1999',
    optimal: '115–130 см (зависит от роста)',
    scoring: (v) => {
      // Оцениваем относительно среднего роста
      if (v < 100) return 20
      if (v < 110) return 30 + (v - 100) * 3
      if (v < 120) return 60 + (v - 110) * 2.5
      if (v <= 130) return 85 + (v - 120) * 0.5
      return 90
    },
  },

  {
    id: 'chest',
    block: 'body',
    name: 'Обхват груди',
    unit: 'см',
    icon: '🫁',
    weight: 0.12,
    howToMeasure: 'Измерь на уровне сосков — это самая широкая часть грудной клетки. Лента горизонтально, плотно но не сдавливает. Измеряй на спокойном выдохе. Руки опущены вдоль тела.',
    research: 'Развитые грудные мышцы входят в тройку самых привлекательных мышечных групп у мужчин по опросам женщин (Frederick et al., Body Image, 2005). Обхват груди 100-110 см при росте 175-185 коррелирует с оптимальным восприятием.',
    source: 'Frederick et al., Body Image, 2005; Dixson et al., Archives of Sexual Behavior, 2010',
    optimal: '100–115 см',
    scoring: (v) => {
      if (v < 85) return 20
      if (v < 95) return 30 + (v - 85) * 3
      if (v < 105) return 60 + (v - 95) * 2.5
      if (v <= 115) return 85 + (v - 105) * 0.5
      if (v <= 125) return 90 - (v - 115) * 1
      return 80
    },
  },

  {
    id: 'waist',
    block: 'body',
    name: 'Обхват талии',
    unit: 'см',
    icon: '⬛',
    weight: 0.15,
    howToMeasure: 'Найди самое узкое место между рёбрами и тазовыми костями — обычно на уровне пупка или чуть выше. Измерь на выдохе, не втягивая живот. Стой прямо.',
    research: 'Низкий обхват талии — сильнейший сигнал низкого % жира и высокого тестостерона. Мужчины с талией 80-88 см воспринимаются как наиболее привлекательные. Соотношение талия/рост ≤ 0.50 — маркер здоровья и привлекательности.',
    source: 'Tovée & Cornelissen, Proc. R. Soc., 2001; WHO Waist Guidelines, 2008',
    optimal: '78–88 см',
    scoring: (v) => {
      if (v > 110) return 10
      if (v > 100) return 15 + (110 - v) * 1
      if (v > 95)  return 25 + (100 - v) * 2
      if (v > 90)  return 35 + (95 - v) * 3
      if (v > 86)  return 47 + (90 - v) * 4
      if (v > 82)  return 63 + (86 - v) * 5
      if (v >= 78) return 83 + (82 - v) * 2
      if (v >= 72) return 90 - (78 - v) * 1
      return 84 // очень узкая талия тоже хорошо
    },
  },

  {
    id: 'hips',
    block: 'body',
    name: 'Обхват бёдер',
    unit: 'см',
    icon: '🔷',
    weight: 0.08,
    howToMeasure: 'Измерь по самой широкой части — по выступающим точкам ягодиц и бёдер. Стой прямо, вес равномерно на обеих ногах. Лента горизонтально.',
    research: 'Соотношение талия/бёдра (WHR) у мужчин: оптимальное 0.85-0.95. Слишком широкие бёдра относительно плеч снижают воспринимаемую маскулинность.',
    source: 'Singh, Psychological Bulletin, 1995',
    optimal: '90–100 см',
    scoring: (v) => {
      if (v < 85) return 50
      if (v < 92) return 60 + (v - 85) * 3
      if (v <= 100) return 81 + (v - 92)
      if (v <= 108) return 89 - (v - 100) * 2
      return 73
    },
  },

  {
    id: 'glutes',
    block: 'body',
    name: 'Обхват ягодиц',
    unit: 'см',
    icon: '🍑',
    weight: 0.07,
    howToMeasure: 'Измерь по самой выступающей части ягодиц — это обычно середина. Лента горизонтально, плотно. Стой прямо, ноги вместе.',
    research: 'Развитые ягодицы у мужчин сигнализируют о силе ног и общем атлетизме. Опросы показывают: женщины всё чаще называют ягодицы одной из ключевых зон привлекательности у мужчин.',
    source: 'Frederick et al., Body Image, 2005',
    optimal: '95–105 см',
    scoring: (v) => {
      if (v < 85) return 40
      if (v < 95) return 50 + (v - 85) * 3
      if (v <= 105) return 80 + (v - 95)
      if (v <= 115) return 90 - (v - 105) * 1.5
      return 75
    },
  },

  {
    id: 'bicep',
    block: 'body',
    name: 'Обхват бицепса',
    unit: 'см',
    icon: '💪',
    weight: 0.12,
    howToMeasure: 'Согни руку под 90° — "покажи мышцу". Измерь в самой широкой точке бицепса. Измеряй доминирующую руку в напряжённом состоянии.',
    research: 'Опросы женщин стабильно показывают: бицепс входит в топ-3 привлекательных мышечных групп. Обхват 38-42 см при среднем росте воспринимается как оптимальный — не "слишком" и не мало.',
    source: 'Frederick et al., Body Image, 2005; Dixson et al., Archives of Sexual Behavior, 2010',
    optimal: '36–44 см',
    scoring: (v) => {
      if (v < 28) return 20
      if (v < 33) return 30 + (v - 28) * 4
      if (v < 38) return 50 + (v - 33) * 5
      if (v <= 44) return 75 + (v - 38) * 2.5
      if (v <= 50) return 90 - (v - 44) * 1.5
      return 81
    },
  },

  {
    id: 'forearm',
    block: 'body',
    name: 'Обхват предплечья',
    unit: 'см',
    icon: '🦾',
    weight: 0.10,
    howToMeasure: 'Измерь самую широкую часть предплечья — обычно 5-7 см ниже локтевого сгиба. Рука расслаблена, выпрямлена. Лента перпендикулярна руке.',
    research: 'Предплечья — одна из самых сексуально воспринимаемых частей мужского тела. Опросы Reddit и крупных журналов стабильно показывают их в топ-3. Крупные жилистые предплечья сигнализируют о физическом труде, силе хвата, тестостероне.',
    source: 'Multiple surveys: Reddit, Cosmopolitan, Women\'s Health; Frederick et al., 2005',
    optimal: '30–36 см',
    scoring: (v) => {
      if (v < 24) return 20
      if (v < 28) return 30 + (v - 24) * 5
      if (v < 32) return 50 + (v - 28) * 7
      if (v <= 36) return 78 + (v - 32) * 3
      if (v <= 40) return 90 - (v - 36) * 1
      return 86
    },
  },

  {
    id: 'neck',
    block: 'body',
    name: 'Обхват шеи',
    unit: 'см',
    icon: '🔲',
    weight: 0.08,
    howToMeasure: 'Измерь вокруг середины шеи — под кадыком. Лента горизонтально, голова прямо. Не напрягай мышцы шеи.',
    research: 'Толстая шея — визуальный сигнал физической силы и мускулатуры трапеций. Опросы: шея 38-42 см воспринимается как оптимально мужественная. Слишком тонкая шея снижает воспринимаемую силу.',
    source: 'Sell et al., Evolution & Human Behavior, 2017',
    optimal: '38–44 см',
    scoring: (v) => {
      if (v < 32) return 25
      if (v < 36) return 35 + (v - 32) * 5
      if (v < 40) return 55 + (v - 36) * 7
      if (v <= 44) return 83 + (v - 40) * 2
      if (v <= 50) return 91 - (v - 44) * 1.5
      return 82
    },
  },

  {
    id: 'calves',
    block: 'body',
    name: 'Обхват икр',
    unit: 'см',
    icon: '🦵',
    weight: 0.10,
    howToMeasure: 'Встань прямо. Измерь самую широкую часть икроножной мышцы — обычно верхняя треть голени. Лента горизонтально. Нога расслаблена.',
    research: 'Развитые икры — признак активного образа жизни и атлетизма. Икры 37-42 см ассоциируются с регулярными тренировками. Непропорционально маленькие икры при крупном верхе тела воспринимаются негативно.',
    source: 'Tovée et al., 1999; общие нормы атлетической пропорциональности',
    optimal: '36–42 см',
    scoring: (v) => {
      if (v < 30) return 25
      if (v < 35) return 35 + (v - 30) * 5
      if (v < 38) return 60 + (v - 35) * 7
      if (v <= 43) return 81 + (v - 38) * 1.5
      if (v <= 50) return 88 - (v - 43) * 1
      return 81
    },
  },

  // ════════════════════════════════════════════════════════
  // ЛИЦО (субъективно 1-10)
  // ════════════════════════════════════════════════════════
  {
    id: 'face_symmetry',
    block: 'face',
    name: 'Симметрия лица',
    unit: '/10',
    icon: '⚖️',
    weight: 0.40,
    howToMeasure: 'Сфотографируй лицо анфас при нейтральном выражении и хорошем освещении. Оцени симметрию: насколько левая и правая стороны совпадают. Можно использовать приложения для анализа симметрии лица.',
    research: 'Симметрия лица — один из главных биологических маркеров привлекательности. Коррелирует с генетическим здоровьем. Мета-анализ: симметричные лица воспринимаются как более привлекательные во всех культурах (Gangestad & Simpson, Psychological Bulletin, 2000).',
    source: 'Gangestad & Simpson, Psychological Bulletin, 2000; Little et al., 2011',
    optimal: '7+/10',
    scoring: (v) => Math.min(100, Math.max(0, (v / 10) * 100)),
  },

  {
    id: 'jawline',
    block: 'face',
    name: 'Линия челюсти',
    unit: '/10',
    icon: '🗿',
    weight: 0.35,
    howToMeasure: 'Оцени чёткость и угловатость линии челюсти по фото в профиль и анфас. 1-3: мягкая, почти незаметная. 4-6: умеренно выражена. 7-9: чёткая, угловатая. 10: идеально выраженная квадратная челюсть.',
    research: 'Выраженная челюсть — сигнал высокого тестостерона. Опросы показывают: женщины в фертильной фазе цикла сильнее предпочитают мужчин с выраженной челюстью (Gangestad et al., Proc. R. Soc., 2005).',
    source: 'Gangestad et al., Proc. R. Soc., 2005; Penton-Voak & Perrett, 2000',
    optimal: '7+/10',
    scoring: (v) => Math.min(100, Math.max(0, (v / 10) * 100)),
  },

  {
    id: 'overall_face',
    block: 'face',
    name: 'Общая оценка лица',
    unit: '/10',
    icon: '✨',
    weight: 0.25,
    howToMeasure: 'Оцени общее впечатление от лица — насколько оно гармонично, запоминающееся, привлекательное. Можно использовать оценки от разных людей или приложений типа FaceApp rating.',
    research: 'Привлекательность лица — многофакторный показатель включающий симметрию, пропорции, выразительность. Коррелирует с социальным успехом и сексуальной привлекательностью.',
    source: 'Rhodes, Annual Review of Psychology, 2006',
    optimal: '6+/10',
    scoring: (v) => Math.min(100, Math.max(0, (v / 10) * 100)),
  },

  // ════════════════════════════════════════════════════════
  // ФИЗИЧЕСКАЯ ФОРМА
  // ════════════════════════════════════════════════════════
  {
    id: 'body_fat',
    block: 'fitness',
    name: 'Процент жира',
    unit: '%',
    icon: '📊',
    weight: 0.35,
    howToMeasure: 'Способы: (1) Калипер — измерь складки кожи на животе, бедре, груди по методу Джексона-Поллока. (2) Визуально: 10-12% = видны кубики, 15% = кубики едва видны, 20% = нет кубиков, округлость. (3) Биоимпедансные весы.',
    research: '% жира 10-15% визуально воспринимается как оптимальная физическая форма. Ниже 10% — профессиональные атлеты. 15-20% — норма, хорошая форма. Выше 25% — снижает привлекательность по всем опросам.',
    source: 'Tovée et al., Proc. R. Soc., 1999; WHO Body Fat Standards',
    optimal: '10–17%',
    scoring: (v) => {
      if (v < 6)  return 70 // слишком мало — не оптимально
      if (v < 10) return 80 + (v - 6) * 3
      if (v <= 15) return 92 + (v - 10) * 0.8
      if (v <= 20) return 96 - (v - 15) * 5
      if (v <= 25) return 71 - (v - 20) * 5
      if (v <= 30) return 46 - (v - 25) * 4
      return 26
    },
  },

  {
    id: 'weight',
    block: 'fitness',
    name: 'Вес',
    unit: 'кг',
    icon: '⚖️',
    weight: 0.20,
    howToMeasure: 'Взвешивайся утром после туалета, до еды и питья. Используй одни и те же весы. Записывай среднее за 3 дня — вес колеблется на 1-2 кг в течение дня.',
    research: 'Вес сам по себе менее информативен чем соотношение рост/вес. ИМТ 22-25 коррелирует с наибольшей воспринимаемой привлекательностью у мужчин (Tovée et al., 1999). Однако мышечная масса искажает ИМТ — используй в связке с % жира.',
    source: 'Tovée et al., 1999; Cornelissen et al., 2009',
    optimal: 'ИМТ 22–25',
    scoring: (v, allVals) => {
      const h = (allVals?.height || 175) / 100
      const bmi = v / (h * h)
      if (bmi < 18) return 40
      if (bmi < 20) return 55 + (bmi - 18) * 7
      if (bmi <= 23) return 69 + (bmi - 20) * 7
      if (bmi <= 25) return 90 - (bmi - 23) * 3
      if (bmi <= 27) return 84 - (bmi - 25) * 5
      if (bmi <= 30) return 74 - (bmi - 27) * 5
      return 59
    },
  },

  {
    id: 'grip_max',
    block: 'fitness',
    name: 'Сила хвата',
    unit: 'кг (динамометр)',
    icon: '✊',
    weight: 0.25,
    howToMeasure: 'Используй кистевой динамометр. Стой прямо, рука опущена, локоть чуть согнут. Максимально сожми. 3 попытки, запиши лучший результат. Если нет динамометра — оцени по косвенным признакам (вис на турнике: до 30 сек = ~30-35 кг, 60 сек = ~40-45 кг).',
    research: 'Сила хвата — один из лучших предикторов общего здоровья и смертности (Leong et al., Lancet, 2015). Среднее для мужчин 20-30 лет: 46 кг. Корреляция с тестостероном и воспринимаемой физической силой.',
    source: 'Leong et al., Lancet, 2015; normative data Mathiowetz et al.',
    optimal: '45–60 кг',
    scoring: (v) => {
      if (v < 25) return 20
      if (v < 35) return 30 + (v - 25) * 3
      if (v < 45) return 60 + (v - 35) * 2
      if (v <= 55) return 80 + (v - 45) * 1.5
      if (v <= 65) return 95 - (v - 55) * 0.5
      return 90
    },
  },

  {
    id: 'hang_time',
    block: 'fitness',
    name: 'Вис на турнике',
    unit: 'сек',
    icon: '🏋️',
    weight: 0.20,
    howToMeasure: 'Хват сверху чуть шире плеч. Запрыгни или встань на скамью. Убери опору и держись. Засекай до полного отказа. Лучший из 2 попыток с отдыхом 3 минуты.',
    research: 'Выносливость хвата — маркер общей физической подготовленности. Коррелирует с силой верхней части тела, которая входит в топ предикторов воспринимаемой мужской привлекательности.',
    source: 'Sell et al., Evolution & Human Behavior, 2017; normative data',
    optimal: '45–90 сек',
    scoring: (v) => {
      if (v < 10) return 15
      if (v < 20) return 25 + (v - 10) * 3
      if (v < 40) return 55 + (v - 20) * 1.5
      if (v <= 70) return 85 + (v - 40) * 0.33
      if (v <= 120) return 95 - (v - 70) * 0.1
      return 90
    },
  },
]

// ════════════════════════════════════════════════════════
// SCORING ENGINE
// ════════════════════════════════════════════════════════

export function computeBlockScore(blockId, values) {
  const blockMeasurements = MEASUREMENTS.filter(m => m.block === blockId)
  if (!blockMeasurements.length) return null

  let totalWeight = 0
  let weightedSum = 0
  let filledCount = 0

  blockMeasurements.forEach(m => {
    const val = values[m.id]
    if (val === undefined || val === null || val === '') return
    const score = m.scoring(Number(val), values)
    weightedSum += score * m.weight
    totalWeight += m.weight
    filledCount++
  })

  if (!filledCount) return null
  // Normalize to filled weight
  return Math.round(weightedSum / totalWeight)
}

export function computeTotalScore(values) {
  const blockScores = {}
  let totalWeightedSum = 0
  let totalWeight = 0

  BLOCKS.forEach(block => {
    const score = computeBlockScore(block.id, values)
    blockScores[block.id] = score
    if (score !== null) {
      totalWeightedSum += score * BLOCK_WEIGHTS[block.id]
      totalWeight += BLOCK_WEIGHTS[block.id]
    }
  })

  const total = totalWeight > 0 ? Math.round(totalWeightedSum / totalWeight) : null
  return { total, blockScores }
}

export function getScoreLabel(score) {
  if (score === null) return { label: '—', color: 'var(--text-muted)' }
  if (score >= 90) return { label: 'Элита',       color: '#fbbf24' }
  if (score >= 80) return { label: 'Отлично',     color: '#4ade80' }
  if (score >= 70) return { label: 'Хорошо',      color: '#60a5fa' }
  if (score >= 60) return { label: 'Выше среднего', color: '#a855f7' }
  if (score >= 50) return { label: 'Средне',      color: '#9a8a98' }
  if (score >= 40) return { label: 'Есть куда расти', color: '#e8304a' }
  return              { label: 'Начинаем',        color: '#5a4858' }
}

// localStorage
export const SK_BODY = 'bs_body_v1'
export function loadBodyValues() {
  try { return JSON.parse(localStorage.getItem(SK_BODY)) || {} } catch { return {} }
}
export function saveBodyValues(v) {
  try { localStorage.setItem(SK_BODY, JSON.stringify(v)) } catch {}
}