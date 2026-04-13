import client from './client';

export interface UserData {
    id: number;
    username: string;
    email: string | null;
    avatar_color: string;
    date_joined: string;
    is_superuser: boolean;
}

export type ExportData = Record<string, unknown>;

export interface ImportResult {
    created: Record<string, number>;
    conflicts: {
        tasks: Array<{
            import_task: {
                text: string;
                week: number;
                day_of_week: number;
                start_hour: number;
                start_minute: number;
                end_hour: number;
                end_minute: number;
            };
            occupied_by: {
                id: number;
                text: string;
                week: number;
                day_of_week: number;
                start_hour: number;
                start_minute: number;
                end_hour: number;
                end_minute: number;
            };
        }>;
    };
}

export const authApi = {
    register: (username: string, password: string, password2: string, email?: string) =>
        client.post<{user: UserData; access: string; refresh: string}>('/auth/register/', {
            username, password, password2, email: email || undefined,
        }),

    login: (username: string, password: string) =>
        client.post<{user: UserData; access: string; refresh: string}>('/auth/login/', {
            username, password,
        }),

    logout: (refresh: string) =>
        client.post('/auth/logout/', {refresh}),

    getProfile: () =>
        client.get<UserData>('/auth/profile/'),

    updateProfile: (data: Partial<UserData>) =>
        client.patch<UserData>('/auth/profile/', data),

    changePassword: (old_password: string, new_password: string) =>
        client.post('/auth/change-password/', {old_password, new_password}),

    exportData: () =>
        client.get<ExportData>('/auth/data/export/'),

    importData: (data: ExportData) =>
        client.post<ImportResult>('/auth/data/import/', data),
};
