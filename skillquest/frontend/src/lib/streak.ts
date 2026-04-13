const KEY = 'skillquest-streak';

interface StreakData {
  streak: number;
  lastDate: string; // YYYY-MM-DD
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getStreak(): StreakData {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return JSON.parse(raw) as StreakData;
  } catch {}
  return { streak: 0, lastDate: '' };
}

export function recordActivity(): StreakData {
  const td = today();
  const data = getStreak();
  if (data.lastDate === td) return data; // already recorded today

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yd = yesterday.toISOString().slice(0, 10);

  const newStreak = data.lastDate === yd ? data.streak + 1 : 1;
  const updated: StreakData = { streak: newStreak, lastDate: td };
  localStorage.setItem(KEY, JSON.stringify(updated));
  return updated;
}
