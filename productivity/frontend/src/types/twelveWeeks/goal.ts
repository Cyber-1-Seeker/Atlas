export type Goal = {
    id: string;
    text: string;
    done: boolean;
    // Прогресс рассчитывается автоматически на основе подзадач
    // Но можем хранить для оптимизации
};