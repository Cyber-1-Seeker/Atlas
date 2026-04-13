import client from './client';

export interface ApiGoal {
    id: number;
    text: string;
    done: boolean;
    created_at: string;
    task_count: number;
    done_count: number;
}

export interface ApiTask {
    id: number;
    goal: number | null;
    text: string;
    done: boolean;
    type: 'important' | 'rest' | 'simple';
    week: number;
    day_of_week: number;
    start_hour: number | null;
    start_minute: number | null;
    end_hour: number | null;
    end_minute: number | null;
}

export interface ApiDiaryEntry {
    id: number;
    type: 'week' | 'day';
    week: number;
    day_of_week: number | null;
    text: string;
    icon_key: string;
    date: string;
    created_at: string;
}

export const twelveWeeksApi = {
    // Goals
    getGoals:    () => client.get<ApiGoal[]>('/12weeks/goals/'),
    createGoal:  (text: string) => client.post<ApiGoal>('/12weeks/goals/', {text}),
    updateGoal:  (id: number, data: Partial<ApiGoal>) => client.patch<ApiGoal>(`/12weeks/goals/${id}/`, data),
    deleteGoal:  (id: number) => client.delete(`/12weeks/goals/${id}/`),
    bulkGoals:   (goals: {text: string; done: boolean}[]) =>
        client.post<ApiGoal[]>('/12weeks/goals/bulk-create/', goals),

    // Tasks
    getTasks:    () => client.get<ApiTask[]>('/12weeks/tasks/'),
    createTask:  (data: Omit<ApiTask, 'id'>) => client.post<ApiTask>('/12weeks/tasks/', data),
    updateTask:  (id: number, data: Partial<ApiTask>) => client.patch<ApiTask>(`/12weeks/tasks/${id}/`, data),
    deleteTask:  (id: number) => client.delete(`/12weeks/tasks/${id}/`),
    bulkTasks:   (tasks: object[]) =>
        client.post<ApiTask[]>('/12weeks/tasks/bulk-create/', tasks),

    // Achievement Diary (server-side)
    getDiary: (params: {type: 'week' | 'day'; week: number; day_of_week?: number}) =>
        client.get<ApiDiaryEntry[]>('/12weeks/diary/', {params}),
    addDiaryEntry: (data: Omit<ApiDiaryEntry, 'id' | 'created_at'>) =>
        client.post<ApiDiaryEntry>('/12weeks/diary/', data),
    deleteDiaryEntry: (id: number) =>
        client.delete(`/12weeks/diary/${id}/`),
};
