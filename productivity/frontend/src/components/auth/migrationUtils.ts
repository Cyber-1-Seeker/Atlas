/**
 * migrationUtils.ts — утилиты для проверки наличия данных для миграции.
 * Вынесено из MigrationModal.tsx чтобы Vite Fast Refresh не ломался.
 * (Fast Refresh требует: файл экспортирует ТОЛЬКО компоненты ИЛИ ТОЛЬКО функции — не вместе)
 */

const MIGRATION_DONE_KEY = 'migration-done';

export const hasLocalDataToMigrate = (): boolean => {
    if (localStorage.getItem(MIGRATION_DONE_KEY)) return false;
    try {
        return ['productivity','productivity-goals','progress-trackers','life-wheel']
            .some(k => {
                const v = JSON.parse(localStorage.getItem(k) ?? '[]');
                return Array.isArray(v) && v.length > 0;
            });
    } catch {
        return false;
    }
};