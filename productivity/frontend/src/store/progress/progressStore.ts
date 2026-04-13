import {create} from 'zustand/react';
import type {
    ProgressTracker, ProgressRecord, ProgressUnit,
    ProgressCategory, StrengthRecord, TrackerKind,
} from '../../types/progress/progress.ts';
import {CATEGORY_COLORS, calcORM} from '../../types/progress/progress.ts';
import {progressApi, type ApiTracker, type ApiCategory, type ApiRecord, type ApiStrength, type ApiR} from '../../api/progress.ts';

// ── Конвертация ───────────────────────────────────────────────────

const trackerFromApi = (t: ApiTracker): ProgressTracker => ({
    id: String(t.id),
    _serverId: t.id,
    categoryId: t.category ? String(t.category) : undefined,
    name: t.name,
    kind: t.kind,
    unit: t.unit,
    color: t.color,
    records: t.records.map(recordFromApi),
    strengthRecords: t.strength_records.map(strengthFromApi),
} as ProgressTracker & { _serverId: number });

const recordFromApi = (r: ApiRecord): ProgressRecord => ({
    id: String(r.id), _serverId: r.id,
    value: r.value, note: r.note, date: r.date,
} as ProgressRecord & { _serverId: number });

const strengthFromApi = (r: ApiStrength): StrengthRecord => ({
    id: String(r.id), _serverId: r.id,
    weight: r.weight, reps: r.reps, orm: r.orm, note: r.note, date: r.date,
} as StrengthRecord & { _serverId: number });


const runningFromApi = (r: any) => ({
    id: String(r.id), _serverId: r.id,
    distance: r.distance, duration: r.duration, pace: r.pace, note: r.note, date: r.date,
});

const categoryFromApi = (c: ApiCategory): ProgressCategory => ({
    id: String(c.id), _serverId: c.id,
    name: c.name, color: c.color,
} as ProgressCategory & { _serverId: number });

const COLORS = ['#1677ff', '#52c41a', '#f5222d', '#fa8c16', '#722ed1', '#13c2c2', '#eb2f96', '#fadb14'];

// ── Store ────────────────────────────────────────────────────────

type ProgressStore = {
    trackers: ProgressTracker[];
    categories: ProgressCategory[];
    isLoading: boolean;

    fetchAll: () => Promise<void>;

    addTracker: (name: string, unit: ProgressUnit, categoryId?: string, kind?: TrackerKind) => Promise<void>;
    removeTracker: (id: string) => Promise<void>;
    updateTracker: (id: string, name: string, unit: ProgressUnit) => Promise<void>;
    reorderTrackers: (startIndex: number, endIndex: number) => Promise<void>;
    moveTrackerToCategory: (trackerId: string, categoryId: string | undefined) => Promise<void>;

    addRecord: (trackerId: string, value: number, note?: string) => Promise<void>;
    removeRecord: (trackerId: string, recordId: string) => Promise<void>;

    addStrengthRecord: (trackerId: string, weight: number, reps: number, note?: string) => Promise<void>;
    removeStrengthRecord: (trackerId: string, recordId: string) => Promise<void>;

    addRunningRecord: (trackerId: string, distance: number, duration: number, note?: string) => Promise<void>;
    removeRunningRecord: (trackerId: string, recordId: string) => Promise<void>;

    addCategory: (name: string) => Promise<void>;
    removeCategory: (id: string) => Promise<void>;
    updateCategory: (id: string, name: string) => Promise<void>;


};

export const useProgressStore = create<ProgressStore>((set, get) => ({
    trackers: [],
    categories: [],
    isLoading: false,

    fetchAll: async () => {
        set({isLoading: true});
        try {
            const [cats, trackers] = await Promise.all([
                progressApi.getCategories(),
                progressApi.getTrackers(),
            ]);
            set({
                categories: cats.data.map(categoryFromApi),
                trackers: trackers.data.map(trackerFromApi),
            });
        } finally {
            set({isLoading: false});
        }
    },

    addTracker: async (name, unit, categoryId, kind = 'standard') => {
        const colorIndex = get().trackers.length % COLORS.length;
        const catServerId = categoryId
            ? (get().categories.find(c => c.id === categoryId) as (ProgressCategory & {
                _serverId?: number
            }) | undefined)?._serverId
            : undefined;
        const {data} = await progressApi.createTracker({
            name, kind, unit: kind === 'standard' ? unit : kind === 'running' ? 'м/мин' : 'кг',
            color: COLORS[colorIndex],
            category: catServerId ?? null,
            order: get().trackers.length,
        } as Parameters<typeof progressApi.createTracker>[0]);
        set(s => ({trackers: [...s.trackers, trackerFromApi(data)]}));
    },

    removeTracker: async (id) => {
        const t = get().trackers.find(x => x.id === id) as (ProgressTracker & { _serverId?: number }) | undefined;
        if (!t?._serverId) return;
        set(s => ({trackers: s.trackers.filter(x => x.id !== id)}));
        await progressApi.deleteTracker(t._serverId);
    },

    updateTracker: async (id, name, unit) => {
        const t = get().trackers.find(x => x.id === id) as (ProgressTracker & { _serverId?: number }) | undefined;
        if (!t?._serverId) return;
        set(s => ({trackers: s.trackers.map(x => x.id === id ? {...x, name, unit} : x)}));
        await progressApi.updateTracker(t._serverId, {name, unit});
    },

    reorderTrackers: async (startIndex, endIndex) => {
        const updated = [...get().trackers];
        const [moved] = updated.splice(startIndex, 1);
        updated.splice(endIndex, 0, moved);
        set({trackers: updated});
        const t = moved as ProgressTracker & { _serverId?: number };
        if (t._serverId) await progressApi.reorderTracker(t._serverId, endIndex);
    },

    moveTrackerToCategory: async (trackerId, categoryId) => {
        const t = get().trackers.find(x => x.id === trackerId) as (ProgressTracker & {
            _serverId?: number
        }) | undefined;
        const cat = categoryId
            ? get().categories.find(c => c.id === categoryId) as (ProgressCategory & { _serverId?: number }) | undefined
            : undefined;
        if (!t?._serverId) return;
        set(s => ({trackers: s.trackers.map(x => x.id === trackerId ? {...x, categoryId} : x)}));
        await progressApi.updateTracker(t._serverId, {category: cat?._serverId ?? null} as Parameters<typeof progressApi.updateTracker>[1]);
    },

    addRecord: async (trackerId, value, note) => {
        const t = get().trackers.find(x => x.id === trackerId) as (ProgressTracker & {
            _serverId?: number
        }) | undefined;
        if (!t?._serverId) return;
        const {data} = await progressApi.addRecord(t._serverId, value, note);
        set(s => ({
            trackers: s.trackers.map(x =>
                x.id === trackerId ? {...x, records: [...x.records, recordFromApi(data)]} : x
            )
        }));
    },

    removeRecord: async (trackerId, recordId) => {
        const t = get().trackers.find(x => x.id === trackerId) as (ProgressTracker & {
            _serverId?: number
        }) | undefined;
        const r = t?.records.find(x => x.id === recordId) as (ProgressRecord & { _serverId?: number }) | undefined;
        if (!t?._serverId || !r?._serverId) return;
        set(s => ({
            trackers: s.trackers.map(x =>
                x.id === trackerId ? {...x, records: x.records.filter(r2 => r2.id !== recordId)} : x
            )
        }));
        await progressApi.deleteRecord(t._serverId, r._serverId);
    },

    addStrengthRecord: async (trackerId, weight, reps, note) => {
        const t = get().trackers.find(x => x.id === trackerId) as (ProgressTracker & {
            _serverId?: number
        }) | undefined;
        if (!t?._serverId) return;
        const orm = calcORM(weight, reps);
        const {data} = await progressApi.addStrength(t._serverId, weight, reps, orm, note);
        set(s => ({
            trackers: s.trackers.map(x =>
                x.id === trackerId ? {...x, strengthRecords: [...x.strengthRecords, strengthFromApi(data)]} : x
            )
        }));
    },

    removeStrengthRecord: async (trackerId, recordId) => {
        const t = get().trackers.find(x => x.id === trackerId) as (ProgressTracker & {
            _serverId?: number
        }) | undefined;
        const r = t?.strengthRecords.find(x => x.id === recordId) as (StrengthRecord & {
            _serverId?: number
        }) | undefined;
        if (!t?._serverId || !r?._serverId) return;
        set(s => ({
            trackers: s.trackers.map(x =>
                x.id === trackerId ? {...x, strengthRecords: x.strengthRecords.filter(r2 => r2.id !== recordId)} : x
            )
        }));
        await progressApi.deleteStrength(t._serverId, r._serverId);
    },

    addRunningRecord: async (trackerId, distance, duration, note) => {
        const t = get().trackers.find(x => x.id === trackerId) as any;
        if (!t?._serverId) return;
        const pace = distance && duration ? Math.round((duration / 60) / (distance / 1000) * 100) / 100 : 0;
        const {data} = await progressApi.addRunning(t._serverId, distance, duration, pace, note);
        set(s => ({
            trackers: s.trackers.map(x =>
                x.id === trackerId ? {...x, runningRecords: [...(x.runningRecords ?? []), runningFromApi(data)]} : x
            )
        }));
    },

    removeRunningRecord: async (trackerId, recordId) => {
        const t = get().trackers.find(x => x.id === trackerId) as any;
        const r = t?.runningRecords?.find((x: any) => x.id === recordId) as any;
        if (!t?._serverId || !r?._serverId) return;
        set(s => ({
            trackers: s.trackers.map(x =>
                x.id === trackerId ? {
                    ...x,
                    runningRecords: (x.runningRecords ?? []).filter((r2: any) => r2.id !== recordId)
                } : x
            )
        }));
        await progressApi.deleteRunning(t._serverId, r._serverId);
    },

    addCategory: async (name) => {
        const colorIndex = get().categories.length % CATEGORY_COLORS.length;
        const {data} = await progressApi.createCategory({name, color: CATEGORY_COLORS[colorIndex]});
        set(s => ({categories: [...s.categories, categoryFromApi(data)]}));
    },

    removeCategory: async (id) => {
        const cat = get().categories.find(c => c.id === id) as (ProgressCategory & { _serverId?: number }) | undefined;
        if (!cat?._serverId) return;
        set(s => ({
            categories: s.categories.filter(c => c.id !== id),
            trackers: s.trackers.map(t => t.categoryId === id ? {...t, categoryId: undefined} : t),
        }));
        await progressApi.deleteCategory(cat._serverId);
    },

    updateCategory: async (id, name) => {
        const cat = get().categories.find(c => c.id === id) as (ProgressCategory & { _serverId?: number }) | undefined;
        if (!cat?._serverId) return;
        set(s => ({categories: s.categories.map(c => c.id === id ? {...c, name} : c)}));
        await progressApi.updateCategory(cat._serverId, {name});
    },
}));

// Реэкспорт утилит прогресса из типов (для обратной совместимости)
export {calcProgress, getPeriodStart, getBaseRecord, getBaseStrengthRecord} from '../../types/progress/progress.ts';
