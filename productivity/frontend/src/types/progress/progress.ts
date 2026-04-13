// ================================================================
// ТИПЫ — Трекер прогресса
// ================================================================

/** Одна запись обычного трекера */
export type ProgressRecord = {
    id: string;
    value: number;
    date: string;   // ISO
    note?: string;
};

/**
 * Одна запись силового трекера.
 * Хранит вес и количество повторений.
 * Расчётный 1RM (Brzycki) = weight * 36 / (37 - reps)
 */
export type StrengthRecord = {
    id: string;
    weight: number;   // кг
    reps: number;     // повторения (1–36)
    orm: number;      // расчётный 1RM, сохраняем чтобы не пересчитывать
    date: string;     // ISO
    note?: string;
};

/** Тип трекера */
export type TrackerKind = 'standard' | 'strength' | 'running';

/** Единица измерения для обычного трекера */
export type ProgressUnit = 'кг' | 'км' | 'мин' | 'з/мин' | 'раз' | 'сек' | 'м' | 'см' | '%' | string;

/** Категория/направление для группировки трекеров */
export type ProgressCategory = {
    id: string;
    name: string;
    color: string;
};

/** Один трекер */
export type ProgressTracker = {
    id: string;
    name: string;
    kind: TrackerKind;
    unit: ProgressUnit;         // для standard
    records: ProgressRecord[];  // для standard
    strengthRecords: StrengthRecord[]; // для strength
    runningRecords: RunningRecord[]; // для running
    color: string;
    categoryId?: string;
};

export type RunningRecord = {
    id: string;
    distance: number;   // метры
    duration: number;   // секунды
    pace: number;   // мин/км (расчётное)
    date: string;   // ISO
    note?: string;
};

/** Период сравнения */
export type ComparePeriod = 'day' | 'week' | 'month' | '3months' | 'all';

export const COMPARE_PERIOD_LABELS: Record<ComparePeriod, string> = {
    day: 'День',
    week: 'Неделя',
    month: 'Месяц',
    '3months': '3 месяца',
    all: 'Всё время',
};

/** Цвета для категорий */
export const CATEGORY_COLORS = [
    '#667eea', '#52c41a', '#f5222d', '#fa8c16',
    '#722ed1', '#13c2c2', '#eb2f96', '#1677ff',
];

// ================================================================
// ФОРМУЛА BRZYCKI
// Стандартная формула расчёта одноповторного максимума (1RM).
// Используется в спортивной науке и большинстве фитнес-приложений.
// Точна для 1–10 повторений, приемлема до ~36.
// ================================================================

/**
 * Рассчитывает 1RM.
 * До 36 повторений — формула Brzycki (weight × 36 / (37 − reps)), наиболее точная.
 * От 37 повторений — формула Epley (weight × (1 + reps / 30)), работает для высоких rep-диапазонов.
 * @param weight  — рабочий вес (кг)
 * @param reps    — количество повторений
 * @returns       — расчётный максимум (кг), округлён до 0.1
 */
export const calcORM = (weight: number, reps: number): number => {
    if (reps <= 0 || weight <= 0) return 0;
    if (reps === 1) return weight;
    if (reps < 37) {
        // Brzycki
        return Math.round((weight * 36 / (37 - reps)) * 10) / 10;
    }
    // Epley — для 37+ повторений
    return Math.round((weight * (1 + reps / 30)) * 10) / 10;
};

// ================================================================
// ФОРМУЛА ДЛЯ РАСЧЕТА РАССТОЯНИЯ И ВРЕМЕНИ В БЕГЕ.
// ================================================================
/** Расчёт темпа (мин/км) */
export const calcPace = (distanceM: number, durationSec: number): number => {
    if (!distanceM || !durationSec) return 0;
    const km = distanceM / 1000;
    return Math.round((durationSec / 60 / km) * 100) / 100;
};

/** Форматировать темп: 5.5 → "5:30 мин/км" */
export const fmtPace = (pace: number): string => {
    if (!pace) return '—';
    const min = Math.floor(pace);
    const sec = Math.round((pace - min) * 60);
    return `${min}:${String(sec).padStart(2, '0')} мин/км`;
};

/** Форматировать время: 325 сек → "5:25" */
export const fmtDuration = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

/** Форматировать дистанцию: 1500 → "1.5 км", 800 → "800 м" */
export const fmtDistance = (m: number): string =>
    m >= 1000 ? `${(m / 1000).toFixed(1)} км` : `${m} м`;

/**
 * Сравнить два беговых результата.
 * Лучше = выше скорость (меньше темп).
 * Метрика: (distance/duration) — скорость м/с.
 */
export const compareRunning = (
    a: { distance: number; duration: number },
    b: { distance: number; duration: number },
): { better: boolean; diffPct: number } => {
    const speedA = a.distance / a.duration;
    const speedB = b.distance / b.duration;
    const better = speedA >= speedB;
    const diffPct = speedB > 0 ? Math.round(((speedA - speedB) / speedB) * 1000) / 10 : 0;
    return {better, diffPct};
};


// ================================================================
// УТИЛИТЫ ПРОГРЕССА
// Вынесены в types чтобы компоненты (StrengthCard, ProgressCard)
// могли импортировать их без циклической зависимости от стора.
// ================================================================

/**
 * Вычисляет прогресс между двумя значениями.
 * Возвращает процент и абсолютную разницу.
 */
export const calcProgress = (
    current: number,
    previous: number,
): { percent: number; absolute: number } => {
    const absolute = Math.round((current - previous) * 10) / 10;
    const percent = previous !== 0
        ? Math.round((absolute / previous) * 100 * 10) / 10
        : 0;
    return {percent, absolute};
};

export const MEASUREMENT_TYPE_LABELS: Record<string, string> = {
    strength: '💪 Силовой (кг × повторения)',
    running: '🏃 Беговой (дистанция + время)',
    reps: '🔢 Повторения',
    time: '⏱ Время (сек)',
    distance: '📏 Дистанция (м)',
    standard: '📊 Произвольное число',
};


/**
 * Возвращает дату начала периода относительно сейчас.
 */
export const getPeriodStart = (period: ComparePeriod): Date | null => {
    if (period === 'all') return null;
    const map: Record<Exclude<ComparePeriod, 'all'>, number> = {
        day: 1, week: 7, month: 30, '3months': 90,
    };
    const result = new Date();
    result.setDate(result.getDate() - map[period]);
    return result;
};

/**
 * Находит базовую запись обычного трекера для расчёта прогресса за период.
 */
export const getBaseRecord = (
    records: ProgressRecord[],
    period: ComparePeriod,
): ProgressRecord | null => {
    if (records.length < 2) return null;
    const sorted = [...records].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const periodStart = getPeriodStart(period);
    if (!periodStart) return sorted[0];
    const before = sorted.filter(r => new Date(r.date) < periodStart);
    return before.length > 0 ? before[before.length - 1] : sorted[0];
};

/**
 * Находит базовую запись силового трекера (сравниваем по orm).
 */
export const getBaseStrengthRecord = (
    records: StrengthRecord[],
    period: ComparePeriod,
): StrengthRecord | null => {
    if (records.length < 2) return null;
    const sorted = [...records].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const periodStart = getPeriodStart(period);
    if (!periodStart) return sorted[0];
    const before = sorted.filter(r => new Date(r.date) < periodStart);
    return before.length > 0 ? before[before.length - 1] : sorted[0];
};