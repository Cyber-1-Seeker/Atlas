import client from './client';

export interface ApiWheelTask    { id: number; text: string; done: boolean; }
export interface ApiWheelSegment { id: number; name: string; score: number; color: string; order: number; tasks: ApiWheelTask[]; }

export const lifeWheelApi = {
    getSegments:   () => client.get<ApiWheelSegment[]>('/life-wheel/segments/'),
    createSegment: (data: {name: string; score: number; color: string; order: number}) =>
        client.post<ApiWheelSegment>('/life-wheel/segments/', data),
    updateSegment: (id: number, data: Partial<ApiWheelSegment>) =>
        client.patch<ApiWheelSegment>(`/life-wheel/segments/${id}/`, data),
    deleteSegment: (id: number) => client.delete(`/life-wheel/segments/${id}/`),

    addTask:    (segmentId: number, text: string) =>
        client.post<ApiWheelTask>(`/life-wheel/segments/${segmentId}/tasks/`, {text}),
    updateTask: (segmentId: number, taskId: number, data: Partial<ApiWheelTask>) =>
        client.patch<ApiWheelTask>(`/life-wheel/segments/${segmentId}/tasks/${taskId}/`, data),
    deleteTask: (segmentId: number, taskId: number) =>
        client.delete(`/life-wheel/segments/${segmentId}/tasks/${taskId}/delete/`),

    bulkImport: (segments: object[]) =>
        client.post<ApiWheelSegment[]>('/life-wheel/segments/bulk-import/', segments),
};
