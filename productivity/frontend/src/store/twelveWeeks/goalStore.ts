import {create} from 'zustand/react';
import type {Task} from '../../types/twelveWeeks/task.ts';
import {twelveWeeksApi, type ApiGoal} from '../../api/twelveWeeks.ts';

export interface Goal {
    id:        string;
    _serverId: number;
    text:      string;
    done:      boolean;
}

type GoalState = {
    goals:      Goal[];
    isLoading:  boolean;
    fetchGoals:  () => Promise<void>;
    addGoal:     (text: string) => Promise<void>;
    toggleGoal:  (id: string) => Promise<void>;
    updateGoal:  (id: string, text: string) => Promise<void>;
    removeGoal:  (id: string) => Promise<void>;
};

const fromApi = (g: ApiGoal): Goal => ({
    id: String(g.id), _serverId: g.id,
    text: g.text, done: g.done,
});

export const useGoalStore = create<GoalState>((set, get) => ({
    goals: [], isLoading: false,

    fetchGoals: async () => {
        set({isLoading: true});
        try {
            const {data} = await twelveWeeksApi.getGoals();
            set({goals: data.map(fromApi)});
        } finally { set({isLoading: false}); }
    },

    addGoal: async (text) => {
        const {data} = await twelveWeeksApi.createGoal(text);
        set(s => ({goals: [...s.goals, fromApi(data)]}));
    },

    toggleGoal: async (id) => {
        const goal = get().goals.find(g => g.id === id);
        if (!goal) return;
        const newDone = !goal.done;
        set(s => ({goals: s.goals.map(g => g.id === id ? {...g, done: newDone} : g)}));
        try { await twelveWeeksApi.updateGoal(goal._serverId, {done: newDone}); }
        catch { set(s => ({goals: s.goals.map(g => g.id === id ? {...g, done: goal.done} : g)})); }
    },

    updateGoal: async (id, text) => {
        const goal = get().goals.find(g => g.id === id);
        if (!goal) return;
        set(s => ({goals: s.goals.map(g => g.id === id ? {...g, text} : g)}));
        await twelveWeeksApi.updateGoal(goal._serverId, {text});
    },

    removeGoal: async (id) => {
        const goal = get().goals.find(g => g.id === id);
        if (!goal) return;
        set(s => ({goals: s.goals.filter(g => g.id !== id)}));
        await twelveWeeksApi.deleteGoal(goal._serverId);
    },
}));

export const calculateGoalProgress = (goalId: string, tasks: Task[]): number => {
    const gt = tasks.filter(t => t.goalId === goalId);
    if (!gt.length) return 0;
    return Math.round((gt.filter(t => t.done).length / gt.length) * 100);
};
