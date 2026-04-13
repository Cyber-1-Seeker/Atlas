/**
 * parseApiError — парсит ошибки Django REST Framework в читаемый текст.
 */
export function parseApiError(err: unknown): string {
    const e = err as {response?: {data?: unknown; status?: number}; message?: string};
    if (!e?.response) return e?.message ?? 'Ошибка соединения с сервером';
    const {status, data} = e.response;
    if (!data) return `Ошибка сервера (${status})`;
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.flat().join('; ');
    if (typeof data === 'object') {
        const obj = data as Record<string, unknown>;
        if (typeof obj.detail === 'string') return obj.detail;
        const msgs: string[] = [];
        for (const [key, val] of Object.entries(obj)) {
            const label = LABELS[key] ?? key;
            if (Array.isArray(val))    msgs.push(`${label}: ${val.join(', ')}`);
            else if (typeof val === 'string') msgs.push(`${label}: ${val}`);
            else if (typeof val === 'object' && val !== null) {
                const nested = Object.values(val as Record<string,unknown>).flat().join(', ');
                msgs.push(`${label}: ${nested}`);
            }
        }
        if (msgs.length) return msgs.join('\n');
    }
    return `Ошибка ${status ?? ''}`;
}

const LABELS: Record<string,string> = {
    name:'Название', key:'Ключ (key)', slug:'Slug', username:'Имя пользователя',
    password:'Пароль', password2:'Подтверждение пароля', email:'Email',
    old_password:'Текущий пароль', new_password:'Новый пароль',
    body_region:'Область тела', category:'Категория', equipment:'Оборудование',
    image:'Изображение', video_url:'Ссылка на видео', program_id:'Программа',
    non_field_errors:'Ошибка', detail:'Ошибка',
};
