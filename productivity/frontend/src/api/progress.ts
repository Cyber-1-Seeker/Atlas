import client from './client';

export interface ApiCategory { id: number; name: string; color: string; }
export interface ApiRecord    { id: number; value: number; note: string; date: string; }
export interface ApiStrength  { id: number; weight: number; reps: number; orm: number; note: string; date: string; }
export interface ApiTracker   {
    id: number; category: number | null; name: string;
    kind: 'standard' | 'strength' | 'running'; unit: string; color: string; order: number;
    records: ApiRecord[]; strength_records: ApiStrength[];
}

export const progressApi = {
    getCategories:   () => client.get<ApiCategory[]>('/progress/categories/'),
    createCategory:  (data: {name: string; color: string}) => client.post<ApiCategory>('/progress/categories/', data),
    updateCategory:  (id: number, data: Partial<ApiCategory>) => client.patch<ApiCategory>(`/progress/categories/${id}/`, data),
    deleteCategory:  (id: number) => client.delete(`/progress/categories/${id}/`),

    getTrackers:     () => client.get<ApiTracker[]>('/progress/trackers/'),
    createTracker:   (data: Omit<ApiTracker, 'id'|'records'|'strength_records'>) =>
        client.post<ApiTracker>('/progress/trackers/', data),
    updateTracker:   (id: number, data: Partial<ApiTracker>) => client.patch<ApiTracker>(`/progress/trackers/${id}/`, data),
    deleteTracker:   (id: number) => client.delete(`/progress/trackers/${id}/`),
    reorderTracker:  (id: number, order: number) => client.patch(`/progress/trackers/${id}/reorder/`, {order}),

    addRecord:       (trackerId: number, value: number, note?: string) =>
        client.post<ApiRecord>(`/progress/trackers/${trackerId}/records/`, {
            value, note: note ?? '', date: new Date().toISOString(),
        }),
    deleteRecord:    (trackerId: number, recordId: number) =>
        client.delete(`/progress/trackers/${trackerId}/records/${recordId}/`),

    addStrength:     (trackerId: number, weight: number, reps: number, orm: number, note?: string) =>
        client.post<ApiStrength>(`/progress/trackers/${trackerId}/strength-records/`, {
            weight, reps, orm, note: note ?? '', date: new Date().toISOString(),
        }),
    deleteStrength:  (trackerId: number, recordId: number) =>
        client.delete(`/progress/trackers/${trackerId}/strength-records/${recordId}/`),

    bulkImport:      (trackers: object[]) =>
        client.post<ApiTracker[]>('/progress/trackers/bulk-import/', trackers),
};
