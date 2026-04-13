export interface Level {
  level: number;
  title: string;
  titleRu: string;
  minXP: number;
  color: string;
}

export const LEVELS: Level[] = [
  { level: 1,  title: 'Novice',      titleRu: 'Новичок',      minXP: 0,      color: '#6b7280' },
  { level: 2,  title: 'Apprentice',  titleRu: 'Ученик',       minXP: 500,    color: '#10b981' },
  { level: 3,  title: 'Adept',       titleRu: 'Адепт',        minXP: 1200,   color: '#06b6d4' },
  { level: 4,  title: 'Skilled',     titleRu: 'Умелый',       minXP: 2500,   color: '#7c3aed' },
  { level: 5,  title: 'Expert',      titleRu: 'Эксперт',      minXP: 4500,   color: '#a855f7' },
  { level: 6,  title: 'Master',      titleRu: 'Мастер',       minXP: 7500,   color: '#e8003d' },
  { level: 7,  title: 'Grandmaster', titleRu: 'Грандмастер',  minXP: 12000,  color: '#f59e0b' },
  { level: 8,  title: 'Legend',      titleRu: 'Легенда',      minXP: 20000,  color: '#fbbf24' },
];

export function getLevelInfo(xp: number) {
  let current = LEVELS[0];
  for (const lvl of LEVELS) {
    if (xp >= lvl.minXP) current = lvl;
    else break;
  }
  const nextIdx = LEVELS.indexOf(current) + 1;
  const next = nextIdx < LEVELS.length ? LEVELS[nextIdx] : null;
  const progressXP = xp - current.minXP;
  const rangeXP = next ? next.minXP - current.minXP : 1;
  const pct = next ? Math.min(100, Math.round((progressXP / rangeXP) * 100)) : 100;
  return { current, next, progressXP, rangeXP, pct };
}
