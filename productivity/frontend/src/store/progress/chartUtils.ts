/**
 * chartUtils.ts — вся логика агрегации и навигации для ChartEngine.
 * Чистые функции, без React.
 */

// ================================================================
// ТИПЫ
// ================================================================

/** Единый формат записи для движка. value = orm для силового, само значение для обычного */
export interface UnifiedRecord {
    id: string;
    date: string;   // ISO
    value: number;
    label?: string;   // для силового: "45кг×10"
}

export type HierarchyLevel = 'day' | 'week' | 'month' | 'quarter' | 'all';
export type ViewMode = 'aggregated' | 'detailed';

/** Одна точка на графике */
export interface ChartPoint {
    xLabel: string;
    tooltipLabel: string;
    value: number | null;   // null = нет данных за этот слот
    periodKey: string;          // "YYYY-MM-DD" или "YYYY-MM"
    periodLevel: HierarchyLevel;  // уровень для drill-down
    recordIds: string[];
    hasData: boolean;
    label?: string;          // label лучшей записи (для силового в тултипе)
}

export interface BreadcrumbEntry {
    level: HierarchyLevel;
    viewMode: ViewMode;
    anchorDate: Date;
    title: string;
}

// ================================================================
// КОНСТАНТЫ
// ================================================================

const MS = ['янв', 'фев', 'мар', 'апр', 'май', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'] as const;
const DS = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'] as const; // Mon=0

// ================================================================
// УТИЛИТЫ ДАТ
// ================================================================

export const toDayKey = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export const toMonthKey = (d: Date): string =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

/** Понедельник недели, содержащей дату d */
export const getWeekStart = (d: Date): Date => {
    const r = new Date(d);
    r.setHours(0, 0, 0, 0);
    const dow = r.getDay();
    r.setDate(r.getDate() - (dow === 0 ? 6 : dow - 1));
    return r;
};

export const getWeekEnd = (ws: Date): Date => {
    const r = new Date(ws);
    r.setDate(r.getDate() + 6);
    r.setHours(23, 59, 59, 999);
    return r;
};

export const getMonthStart = (d: Date): Date =>
    new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);

export const getMonthEnd = (d: Date): Date =>
    new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

export const getQuarterStart = (d: Date): Date =>
    new Date(d.getFullYear(), Math.floor(d.getMonth() / 3) * 3, 1, 0, 0, 0, 0);

/** Разобрать dayKey "YYYY-MM-DD" → Date */
export const parseDayKey = (k: string): Date => {
    const [y, m, d] = k.split('-').map(Number);
    return new Date(y, m - 1, d, 12, 0, 0, 0);
};

/** Разобрать monthKey "YYYY-MM" → Date (1-е число) */
export const parseMonthKey = (k: string): Date => {
    const [y, m] = k.split('-').map(Number);
    return new Date(y, m - 1, 1, 12, 0, 0, 0);
};

export const fmtDate = (d: Date): string => `${d.getDate()} ${MS[d.getMonth()]}`;
export const fmtDateF = (d: Date): string => `${d.getDate()} ${MS[d.getMonth()]} ${d.getFullYear()}`;
export const fmtMonth = (d: Date): string => `${MS[d.getMonth()]} ${d.getFullYear()}`;
export const fmtTime = (d: Date): string => d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
export const dowRu = (d: Date): string => DS[(d.getDay() + 6) % 7];

/** Является ли anchorDate текущим периодом для данного уровня */
export const isCurrentPeriod = (level: HierarchyLevel, anchor: Date): boolean => {
    const now = new Date();
    if (level === 'day') return toDayKey(anchor) === toDayKey(now);
    if (level === 'week') return toDayKey(getWeekStart(anchor)) === toDayKey(getWeekStart(now));
    if (level === 'month') return toMonthKey(anchor) === toMonthKey(now);
    if (level === 'quarter') return toMonthKey(getQuarterStart(anchor)) === toMonthKey(getQuarterStart(now));
    return true;
};

/** Получить anchorDate для «текущего» периода */
export const getCurrentAnchor = (): Date => new Date();

/** Перейти к предыдущему/следующему периоду */
export const shiftAnchor = (level: HierarchyLevel, anchor: Date, dir: 1 | -1): Date => {
    const d = new Date(anchor);
    if (level === 'day') {
        d.setDate(d.getDate() + dir);
        return d;
    }
    if (level === 'week') {
        d.setDate(d.getDate() + dir * 7);
        return d;
    }
    if (level === 'month') {
        d.setMonth(d.getMonth() + dir);
        return d;
    }
    if (level === 'quarter') {
        d.setMonth(d.getMonth() + dir * 3);
        return d;
    }
    return d;
};

export const periodTitle = (level: HierarchyLevel, anchor: Date): string => {
    if (level === 'day') return fmtDateF(anchor);
    if (level === 'week') {
        const ws = getWeekStart(anchor);
        const we = getWeekEnd(ws);
        return `${fmtDate(ws)} – ${fmtDate(we)}`;
    }
    if (level === 'month') return fmtMonth(anchor);
    if (level === 'quarter') {
        const qs = getQuarterStart(anchor);
        const qe = new Date(qs.getFullYear(), qs.getMonth() + 3, 0);
        return `${fmtDate(qs)} – ${fmtDate(qe)} ${qs.getFullYear()}`;
    }
    return 'Всё время';
};

// ================================================================
// ДИАПАЗОННЫЕ ФУНКЦИИ
// ================================================================

interface RangeMax {
    value: number;
    ids: string[];
    label?: string;
}

const maxInRange = (recs: UnifiedRecord[], s: Date, e: Date): RangeMax | null => {
    const r = recs.filter(x => {
        const d = new Date(x.date);
        return d >= s && d <= e;
    });
    if (!r.length) return null;
    const best = r.reduce((a, b) => b.value > a.value ? b : a);
    return {value: best.value, ids: r.map(x => x.id), label: best.label};
};

const allInRange = (recs: UnifiedRecord[], s: Date, e: Date): UnifiedRecord[] =>
    recs.filter(x => {
        const d = new Date(x.date);
        return d >= s && d <= e;
    })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

// ================================================================
// ПОСТРОИТЕЛИ ДАННЫХ ДЛЯ ГРАФИКА
// ================================================================

/** DAY: каждая запись — отдельная точка */
export const buildDayData = (recs: UnifiedRecord[], anchor: Date): ChartPoint[] => {
    const s = new Date(anchor);
    s.setHours(0, 0, 0, 0);
    const e = new Date(anchor);
    e.setHours(23, 59, 59, 999);
    return allInRange(recs, s, e).map(r => {
        const d = new Date(r.date);
        return {
            xLabel: fmtTime(d),
            tooltipLabel: `${fmtDate(d)}, ${fmtTime(d)}`,
            value: r.value,
            periodKey: toDayKey(d),
            periodLevel: 'day' as const,
            recordIds: [r.id],
            hasData: true,
            label: r.label,
        };
    });
};

/** WEEK aggregated: 7 слотов Пн–Вс, max за день */
export const buildWeekAggregated = (recs: UnifiedRecord[], anchor: Date): ChartPoint[] => {
    const ws = getWeekStart(anchor);
    return Array.from({length: 7}, (_, i) => {
        const d = new Date(ws);
        d.setDate(ws.getDate() + i);
        const de = new Date(d);
        de.setHours(23, 59, 59, 999);
        const r = maxInRange(recs, d, de);
        return {
            xLabel: `${DS[i]}\n${fmtDate(d)}`,
            tooltipLabel: `${DS[i]}, ${fmtDate(d)}`,
            value: r?.value ?? null,
            periodKey: toDayKey(d),
            periodLevel: 'day' as const,
            recordIds: r?.ids ?? [],
            hasData: r !== null,
            label: r?.label,
        };
    });
};

/** WEEK detailed: все записи недели, сортировка по времени */
export const buildWeekDetailed = (recs: UnifiedRecord[], anchor: Date): ChartPoint[] => {
    const ws = getWeekStart(anchor);
    return allInRange(recs, ws, getWeekEnd(ws)).map(r => {
        const d = new Date(r.date);
        return {
            xLabel: `${dowRu(d)} ${fmtTime(d)}`,
            tooltipLabel: `${dowRu(d)}, ${fmtDate(d)} ${fmtTime(d)}`,
            value: r.value,
            periodKey: toDayKey(d),
            periodLevel: 'day' as const,
            recordIds: [r.id],
            hasData: true,
            label: r.label,
        };
    });
};

/** MONTH aggregated: max за каждую неделю (~4–5) */
export const buildMonthAggregated = (recs: UnifiedRecord[], anchor: Date): ChartPoint[] => {
    const ms = getMonthStart(anchor);
    const me = getMonthEnd(anchor);
    const pts: ChartPoint[] = [];
    let ws = getWeekStart(ms);
    while (ws <= me) {
        const we = getWeekEnd(ws);
        const rs = ws < ms ? ms : ws;
        const re = we > me ? me : we;
        const r = maxInRange(recs, rs, re);
        pts.push({
            xLabel: `${rs.getDate()}–${re.getDate()} ${MS[re.getMonth()]}`,
            tooltipLabel: `Нед. ${fmtDate(rs)}–${fmtDate(re)}`,
            value: r?.value ?? null,
            periodKey: toDayKey(rs),
            periodLevel: 'week' as const,
            recordIds: r?.ids ?? [],
            hasData: r !== null,
            label: r?.label,
        });
        ws = new Date(ws);
        ws.setDate(ws.getDate() + 7);
    }
    return pts;
};

/** MONTH detailed: max за каждый день (~30) */
export const buildMonthDetailed = (recs: UnifiedRecord[], anchor: Date): ChartPoint[] => {
    const ms = getMonthStart(anchor);
    const days = getMonthEnd(anchor).getDate();
    return Array.from({length: days}, (_, i) => {
        const d = new Date(ms.getFullYear(), ms.getMonth(), i + 1, 0, 0, 0, 0);
        const de = new Date(d);
        de.setHours(23, 59, 59, 999);
        const r = maxInRange(recs, d, de);
        const showFull = i === 0 || (i + 1) % 7 === 1;
        return {
            xLabel: showFull ? fmtDate(d) : String(i + 1),
            tooltipLabel: fmtDateF(d),
            value: r?.value ?? null,
            periodKey: toDayKey(d),
            periodLevel: 'day' as const,
            recordIds: r?.ids ?? [],
            hasData: r !== null,
            label: r?.label,
        };
    });
};

/** QUARTER aggregated: max за каждый из 3 месяцев */
export const buildQuarterAggregated = (recs: UnifiedRecord[], anchor: Date): ChartPoint[] => {
    const qs = getQuarterStart(anchor);
    return Array.from({length: 3}, (_, i) => {
        const m = new Date(qs.getFullYear(), qs.getMonth() + i, 1);
        const me = getMonthEnd(m);
        const r = maxInRange(recs, m, me);
        return {
            xLabel: fmtMonth(m),
            tooltipLabel: fmtMonth(m),
            value: r?.value ?? null,
            periodKey: toMonthKey(m),
            periodLevel: 'month' as const,
            recordIds: r?.ids ?? [],
            hasData: r !== null,
            label: r?.label,
        };
    });
};

/** QUARTER detailed: max за каждую неделю (~13) */
export const buildQuarterDetailed = (recs: UnifiedRecord[], anchor: Date): ChartPoint[] => {
    const qs = getQuarterStart(anchor);
    const qe = new Date(qs.getFullYear(), qs.getMonth() + 3, 0, 23, 59, 59, 999);
    const pts: ChartPoint[] = [];
    let ws = getWeekStart(qs);
    while (ws <= qe) {
        const we = getWeekEnd(ws);
        const rs = ws < qs ? qs : ws;
        const re = we > qe ? qe : we;
        const r = maxInRange(recs, rs, re);
        pts.push({
            xLabel: fmtDate(rs),
            tooltipLabel: `Нед. ${fmtDate(rs)}–${fmtDate(re)}`,
            value: r?.value ?? null,
            periodKey: toDayKey(rs),
            periodLevel: 'week' as const,
            recordIds: r?.ids ?? [],
            hasData: r !== null,
            label: r?.label,
        });
        ws = new Date(ws);
        ws.setDate(ws.getDate() + 7);
    }
    return pts;
};

/** ALL TIME: max за каждый месяц */
export const buildAllTimeData = (recs: UnifiedRecord[]): ChartPoint[] => {
    if (!recs.length) return [];
    const dates = recs.map(r => new Date(r.date).getTime());
    const minD = new Date(Math.min(...dates));
    const maxD = new Date(Math.max(...dates));
    const pts: ChartPoint[] = [];
    let cur = getMonthStart(minD);
    const end = getMonthStart(maxD);
    while (cur <= end) {
        const me = getMonthEnd(cur);
        const r = maxInRange(recs, cur, me);
        pts.push({
            xLabel: fmtMonth(cur),
            tooltipLabel: fmtMonth(cur),
            value: r?.value ?? null,
            periodKey: toMonthKey(cur),
            periodLevel: 'month' as const,
            recordIds: r?.ids ?? [],
            hasData: r !== null,
            label: r?.label,
        });
        cur = new Date(cur.getFullYear(), cur.getMonth() + 1, 1);
    }
    return pts;
};

/** Собрать данные по текущему состоянию навигации */
export const buildData = (
    recs: UnifiedRecord[],
    level: HierarchyLevel,
    viewMode: ViewMode,
    anchor: Date,
): ChartPoint[] => {
    if (level === 'day') return buildDayData(recs, anchor);
    if (level === 'week') return viewMode === 'aggregated'
        ? buildWeekAggregated(recs, anchor)
        : buildWeekDetailed(recs, anchor);
    if (level === 'month') return viewMode === 'aggregated'
        ? buildMonthAggregated(recs, anchor)
        : buildMonthDetailed(recs, anchor);
    if (level === 'quarter') return viewMode === 'aggregated'
        ? buildQuarterAggregated(recs, anchor)
        : buildQuarterDetailed(recs, anchor);
    return buildAllTimeData(recs);
};

/** Нужна ли горизонтальная прокрутка */
export const needsScroll = (pts: ChartPoint[], level: HierarchyLevel): boolean => {
    if (level === 'all') return pts.length > 12;
    if (level === 'month') return pts.length > 20; // detailed
    if (level === 'quarter') return pts.length > 10;
    return false;
};

/** Ширина графика при прокрутке */
export const chartWidth = (pts: ChartPoint[]): number =>
    Math.max(pts.length * 50, 400);