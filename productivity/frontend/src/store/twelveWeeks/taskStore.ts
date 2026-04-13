import {create} from 'zustand/react';
import type {taskType, Task, TimeSlot} from '../../types/twelveWeeks/task.ts';
import {twelveWeeksApi, type ApiTask} from '../../api/twelveWeeks.ts';

// ── Конвертация API ↔ Frontend ────────────────────────────────────

const fromApi = (t: ApiTask): Task => ({
    id:         String(t.id),
    _serverId:  t.id,
    text:       t.text,
    done:       t.done,
    type:       t.type,
    week:       t.week,
    dayOfWeek:  t.day_of_week,
    goalId:     t.goal ? String(t.goal) : undefined,
    startTime:  t.start_hour != null && t.start_minute != null
                    ? {hour: t.start_hour, minute: t.start_minute} : undefined,
    endTime:    t.end_hour != null && t.end_minute != null
                    ? {hour: t.end_hour, minute: t.end_minute} : undefined,
} as Task & {_serverId: number});

const toApi = (
    text: string, type: taskType,
    startTime?: TimeSlot, endTime?: TimeSlot,
    goalId?: string, week = 1, dayOfWeek = 0
): Omit<ApiTask, 'id'> => ({
    text, type, done: false,
    week, day_of_week: dayOfWeek,
    goal:         goalId ? Number(goalId) : null,
    start_hour:   startTime?.hour   ?? null,
    start_minute: startTime?.minute ?? null,
    end_hour:     endTime?.hour     ?? null,
    end_minute:   endTime?.minute   ?? null,
});

// ── Локальная проверка конфликтов ────────────────────────────────

const toMin = (t: TimeSlot) => t.hour * 60 + t.minute;

const hasConflict = (
    tasks: Task[], start: TimeSlot, end: TimeSlot,
    week: number, day: number, excludeId?: string
) => tasks
    .filter(t => t.startTime && t.endTime && t.week === week && t.dayOfWeek === day && t.id !== excludeId)
    .some(t => toMin(start) < toMin(t.endTime!) && toMin(end) > toMin(t.startTime!));

const sortByTime = (tasks: Task[]) =>
    [...tasks].sort((a, b) => {
        if (!a.startTime) return 1;
        if (!b.startTime) return -1;
        return toMin(a.startTime) - toMin(b.startTime);
    });

// ── Утилита для просмотра занятых диапазонов ─────────────────────

export const getOccupiedRanges = (
    tasks: Task[], week: number, dayOfWeek: number, excludeId?: string
) => tasks
    .filter(t => t.startTime && t.endTime && t.week === week && t.dayOfWeek === dayOfWeek && t.id !== excludeId)
    .map(t => ({startMin: toMin(t.startTime!), endMin: toMin(t.endTime!)}));

// ── Store ────────────────────────────────────────────────────────

interface TaskState {
    tasks:      Task[];
    isLoading:  boolean;

    fetchTasks: () => Promise<void>;

    addTask: (
        text: string, type: taskType,
        startTime?: TimeSlot, endTime?: TimeSlot,
        goalId?: string, week?: number, dayOfWeek?: number,
    ) => Promise<boolean>;

    toggleTask: (id: string) => Promise<void>;
    removeTask:  (id: string) => Promise<void>;

    updateTask: (
        id: string, text: string, type: taskType,
        goalId: string | undefined,
        startTime?: TimeSlot, endTime?: TimeSlot,
        week?: number, dayOfWeek?: number,
    ) => Promise<boolean>;
}

export const useTaskStore = create<TaskState>((set, get) => ({
    tasks: [], isLoading: false,

    fetchTasks: async () => {
        set({isLoading: true});
        try {
            const {data} = await twelveWeeksApi.getTasks();
            set({tasks: sortByTime(data.map(fromApi))});
        } finally { set({isLoading: false}); }
    },

    addTask: async (text, type, startTime, endTime, goalId, week = 1, dayOfWeek = 0) => {
        if (startTime && endTime && hasConflict(get().tasks, startTime, endTime, week, dayOfWeek))
            return false;
        const {data} = await twelveWeeksApi.createTask(toApi(text, type, startTime, endTime, goalId, week, dayOfWeek));
        set(s => ({tasks: sortByTime([...s.tasks, fromApi(data)])}));
        return true;
    },

    toggleTask: async (id) => {
        const task = get().tasks.find(t => t.id === id) as (Task & {_serverId?: number}) | undefined;
        if (!task?._serverId) return;
        const newDone = !task.done;
        set(s => ({tasks: s.tasks.map(t => t.id === id ? {...t, done: newDone} : t)}));
        try { await twelveWeeksApi.updateTask(task._serverId, {done: newDone}); }
        catch { set(s => ({tasks: s.tasks.map(t => t.id === id ? {...t, done: task.done} : t)})); }
    },

    removeTask: async (id) => {
        const task = get().tasks.find(t => t.id === id) as (Task & {_serverId?: number}) | undefined;
        if (!task?._serverId) return;
        set(s => ({tasks: s.tasks.filter(t => t.id !== id)}));
        await twelveWeeksApi.deleteTask(task._serverId);
    },

    updateTask: async (id, text, type, goalId, startTime, endTime, week, dayOfWeek) => {
        const task = get().tasks.find(t => t.id === id) as (Task & {_serverId?: number}) | undefined;
        if (!task?._serverId) return false;
        const eWeek = week ?? task.week ?? 1;
        const eDay  = dayOfWeek ?? task.dayOfWeek ?? 0;
        if (startTime && endTime && hasConflict(get().tasks, startTime, endTime, eWeek, eDay, id))
            return false;

        const updated: Task = {...task, text, type, goalId, startTime, endTime};
        set(s => ({tasks: sortByTime(s.tasks.map(t => t.id === id ? updated : t))}));
        await twelveWeeksApi.updateTask(task._serverId, {
            text, type,
            goal:         goalId ? Number(goalId) : null,
            start_hour:   startTime?.hour   ?? null,
            start_minute: startTime?.minute ?? null,
            end_hour:     endTime?.hour     ?? null,
            end_minute:   endTime?.minute   ?? null,
        });
        return true;
    },
}));
