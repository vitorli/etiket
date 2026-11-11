export const MAX_LENGTH = 2000;

const CORPORATE_LEVELS = [
  {
    max: 20,
    name: 'Прямо и уважительно',
    description: 'Сохраняем смысл, убираем агрессию',
  },
  {
    max: 40,
    name: 'Мягко и по делу',
    description: 'Добавляем вежливость без канцелярита',
  },
  {
    max: 60,
    name: 'Деловой стиль',
    description: 'Факты, риски и следующий шаг',
  },
  {
    max: 80,
    name: 'Корпоративная вуаль',
    description: 'Неприятное превращается в точки роста',
  },
  {
    max: 100,
    name: 'Максимальное лицемерие',
    description: 'Синергия, вовлечённость и оптимальные векторы',
  },
];

const HUMAN_LEVELS = [
  {
    max: 20,
    name: 'Прямо и спокойно',
    description: 'Без канцелярита и без мата',
  },
  {
    max: 40,
    name: 'Разговорный стиль',
    description: 'Простые и живые формулировки',
  },
  {
    max: 60,
    name: 'Эмоционально',
    description: 'Добавляем раздражение и разговорные выражения',
  },
  {
    max: 80,
    name: 'Жёстко и грубо',
    description: 'Допускаем мат и резкие формулировки',
  },
  {
    max: 100,
    name: 'Без цензуры',
    description: 'Максимально эмоционально и матерно',
  },
];

function normalizeLevel(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return 0;
  return Math.min(100, Math.max(0, Math.round(number)));
}

export function getLevel(value, direction = 'forward') {
  const level = normalizeLevel(value);
  const levels = direction === 'reverse' ? HUMAN_LEVELS : CORPORATE_LEVELS;
  const index = levels.findIndex((item) => level <= item.max);
  return { ...levels[index], index, value: level };
}
