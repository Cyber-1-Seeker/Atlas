import {create} from 'zustand/react';
import {authApi, type UserData} from '../../api/auth.ts';

interface AuthState {
    user:          UserData | null;
    isLoading:     boolean;
    isInitialized: boolean;

    login:    (username: string, password: string) => Promise<void>;
    register: (username: string, password: string, password2: string, email?: string) => Promise<void>;
    logout:   () => Promise<void>;
    init:     () => Promise<void>;
    setUser:  (user: UserData) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
    user:          null,
    isLoading:     false,
    isInitialized: false,

    init: async () => {
        const token = localStorage.getItem('access_token');
        if (!token) { set({isInitialized: true}); return; }
        try {
            const {data} = await authApi.getProfile();
            set({user: data, isInitialized: true});
        } catch {
            localStorage.removeItem('access_token');
            localStorage.removeItem('refresh_token');
            set({user: null, isInitialized: true});
        }
    },

    login: async (username, password) => {
        set({isLoading: true});
        try {
            const {data} = await authApi.login(username, password);
            localStorage.setItem('access_token',  data.access);
            localStorage.setItem('refresh_token', data.refresh);
            set({user: data.user});
        } finally {
            set({isLoading: false});
        }
    },

    register: async (username, password, password2, email) => {
        set({isLoading: true});
        try {
            const {data} = await authApi.register(username, password, password2, email);
            localStorage.setItem('access_token',  data.access);
            localStorage.setItem('refresh_token', data.refresh);
            set({user: data.user});
        } finally {
            set({isLoading: false});
        }
    },

    logout: async () => {
        const refresh = localStorage.getItem('refresh_token') ?? '';
        try { await authApi.logout(refresh); } catch {/* ignore */}
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        // Чистим кешированные состояния UI
        Object.keys(localStorage)
            .filter(k => k.startsWith('ce-state-') || k.startsWith('progress-filter'))
            .forEach(k => localStorage.removeItem(k));
        set({user: null});
    },

    setUser: (user) => set({user}),
}));
