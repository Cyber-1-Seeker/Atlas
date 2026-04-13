/**
 * api/client.ts — axios инстанс с JWT авто-обновлением.
 */
import axios from 'axios';

export const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000/api';

const client = axios.create({
    baseURL: BASE_URL,
    headers: {'Content-Type': 'application/json'},
});

// ── Request interceptor: добавляем access token ──────────────────
client.interceptors.request.use(config => {
    const token = localStorage.getItem('access_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
});

// ── Response interceptor: 401 → обновляем токен ──────────────────
let refreshing = false;
let queue: Array<{
    resolve: (token: string) => void;
    reject: (err: unknown) => void;
}> = [];

/** Дренирует очередь — либо даём всем новый токен, либо отклоняем */
const drainQueue = (token: string | null, err: unknown = null) => {
    queue.forEach(({resolve, reject}) => {
        if (token) resolve(token);
        else reject(err);
    });
    queue = [];
};

client.interceptors.response.use(
    res => res,
    async err => {
        const original = err.config;

        // Не перехватываем ошибки самого refresh-запроса
        if (original.url?.includes('/auth/token/refresh/')) {
            return Promise.reject(err);
        }

        if (err.response?.status === 401 && !original._retry) {
            original._retry = true;

            if (refreshing) {
                // Добавляем в очередь и ждём результата refresh
                return new Promise((resolve, reject) => {
                    queue.push({
                        resolve: (token: string) => {
                            original.headers.Authorization = `Bearer ${token}`;
                            resolve(client(original));
                        },
                        reject,
                    });
                });
            }

            refreshing = true;

            try {
                const refresh = localStorage.getItem('refresh_token');
                if (!refresh) throw new Error('No refresh token');

                const {data} = await axios.post(
                    `${BASE_URL}/auth/token/refresh/`,
                    {refresh}
                );

                const newToken = data.access;
                localStorage.setItem('access_token', newToken);

                // Отдаём всем ждущим запросам новый токен
                drainQueue(newToken);

                original.headers.Authorization = `Bearer ${newToken}`;
                return client(original);

            } catch (refreshErr) {
                // Refresh провалился → чистим токены и дренируем с ошибкой
                localStorage.removeItem('access_token');
                localStorage.removeItem('refresh_token');
                drainQueue(null, refreshErr);

                // SPA — просто перезагружаем на корень, не на /login
                window.location.href = '/';
                return Promise.reject(refreshErr);

            } finally {
                refreshing = false;
            }
        }

        return Promise.reject(err);
    }
);

export default client;