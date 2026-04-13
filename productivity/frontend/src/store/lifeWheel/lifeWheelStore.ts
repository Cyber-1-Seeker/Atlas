import {create} from 'zustand/react';
import type {WheelSegment, WheelTask} from '../../types/lifeWheel/lifeWheel.ts';
import {lifeWheelApi, type ApiWheelSegment} from '../../api/lifeWheel.ts';

const EXTRA_COLORS = ['#ff7a45','#36cfc9','#9254de','#ff85c2'];
const DEFAULT_COLORS = ['#52c41a','#1677ff','#f5222d','#722ed1','#13c2c2','#fa8c16','#eb2f96','#fadb14'];

const fromApi = (s: ApiWheelSegment): WheelSegment & {_serverId: number} => ({
    id:        String(s.id),
    _serverId: s.id,
    name:      s.name,
    score:     s.score,
    color:     s.color,
    tasks:     s.tasks.map(t => ({
        id:        String(t.id),
        _serverId: t.id,
        text:      t.text,
        done:      t.done,
    } as WheelTask & {_serverId: number})),
});

type WheelStore = {
    segments:  WheelSegment[];
    isLoading: boolean;

    fetchSegments: () => Promise<void>;
    addSegment:    () => Promise<void>;
    removeSegment: (id: string) => Promise<void>;
    renameSegment: (id: string, name: string) => Promise<void>;
    setScore:      (id: string, score: number) => Promise<void>;
    addTask:       (segmentId: string, text: string) => Promise<void>;
    toggleTask:    (segmentId: string, taskId: string) => Promise<void>;
    removeTask:    (segmentId: string, taskId: string) => Promise<void>;
};

export const useWheelStore = create<WheelStore>((set, get) => ({
    segments:  [],
    isLoading: false,

    fetchSegments: async () => {
        set({isLoading: true});
        try {
            const {data} = await lifeWheelApi.getSegments();
            set({segments: data.map(fromApi)});
        } finally { set({isLoading: false}); }
    },

    addSegment: async () => {
        const segs = get().segments;
        if (segs.length >= 10) return;
        const ci    = segs.length < 8 ? segs.length : (segs.length - 8) % EXTRA_COLORS.length;
        const color = segs.length < 8 ? DEFAULT_COLORS[ci] : EXTRA_COLORS[ci];
        const {data} = await lifeWheelApi.createSegment({
            name: `Направление ${segs.length + 1}`,
            score: 0, color, order: segs.length,
        });
        set(s => ({segments: [...s.segments, fromApi(data)]}));
    },

    removeSegment: async (id) => {
        if (get().segments.length <= 1) return;
        const seg = get().segments.find(s => s.id === id) as (WheelSegment & {_serverId?: number}) | undefined;
        if (!seg?._serverId) return;
        set(s => ({segments: s.segments.filter(x => x.id !== id)}));
        await lifeWheelApi.deleteSegment(seg._serverId);
    },

    renameSegment: async (id, name) => {
        const seg = get().segments.find(s => s.id === id) as (WheelSegment & {_serverId?: number}) | undefined;
        if (!seg?._serverId) return;
        set(s => ({segments: s.segments.map(x => x.id === id ? {...x, name} : x)}));
        await lifeWheelApi.updateSegment(seg._serverId, {name});
    },

    setScore: async (id, score) => {
        const clamped = Math.min(10, Math.max(0, score));
        const seg = get().segments.find(s => s.id === id) as (WheelSegment & {_serverId?: number}) | undefined;
        if (!seg?._serverId) return;
        set(s => ({segments: s.segments.map(x => x.id === id ? {...x, score: clamped} : x)}));
        await lifeWheelApi.updateSegment(seg._serverId, {score: clamped});
    },

    addTask: async (segmentId, text) => {
        const seg = get().segments.find(s => s.id === segmentId) as (WheelSegment & {_serverId?: number}) | undefined;
        if (!seg?._serverId) return;
        const {data} = await lifeWheelApi.addTask(seg._serverId, text);
        const newTask: WheelTask & {_serverId: number} = {
            id: String(data.id), _serverId: data.id,
            text: data.text, done: data.done,
        };
        set(s => ({segments: s.segments.map(x =>
            x.id === segmentId ? {...x, tasks: [...x.tasks, newTask]} : x
        )}));
    },

    toggleTask: async (segmentId, taskId) => {
        const seg  = get().segments.find(s => s.id === segmentId) as (WheelSegment & {_serverId?: number}) | undefined;
        const task = seg?.tasks.find(t => t.id === taskId) as (WheelTask & {_serverId?: number}) | undefined;
        if (!seg?._serverId || !task?._serverId) return;
        const newDone = !task.done;
        set(s => ({segments: s.segments.map(x =>
            x.id !== segmentId ? x : {
                ...x, tasks: x.tasks.map(t => t.id === taskId ? {...t, done: newDone} : t)
            }
        )}));
        try { await lifeWheelApi.updateTask(seg._serverId, task._serverId, {done: newDone}); }
        catch { set(s => ({segments: s.segments.map(x =>
            x.id !== segmentId ? x : {
                ...x, tasks: x.tasks.map(t => t.id === taskId ? {...t, done: task.done} : t)
            }
        )})); }
    },

    removeTask: async (segmentId, taskId) => {
        const seg  = get().segments.find(s => s.id === segmentId) as (WheelSegment & {_serverId?: number}) | undefined;
        const task = seg?.tasks.find(t => t.id === taskId) as (WheelTask & {_serverId?: number}) | undefined;
        if (!seg?._serverId || !task?._serverId) return;
        set(s => ({segments: s.segments.map(x =>
            x.id !== segmentId ? x : {...x, tasks: x.tasks.filter(t => t.id !== taskId)}
        )}));
        await lifeWheelApi.deleteTask(seg._serverId, task._serverId);
    },
}));
