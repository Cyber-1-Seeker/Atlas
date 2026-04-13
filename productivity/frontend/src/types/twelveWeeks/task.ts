// Тип задачи: важная, простая или отдых
export type taskType = 'important' | 'rest' | 'simple';

// Временной слот задачи
export type TimeSlot = {
    hour: number;   // 0-23
    minute: number; // 0-59
};

export type Task = {
    id: string;
    text: string;
    done: boolean;
    type: taskType;

    // Временные рамки — оба обязательны если задача привязана ко времени
    startTime?: TimeSlot;
    endTime?: TimeSlot;

    goalId?: string;     // К какой главной цели относится задача
    week?: number;       // Номер недели (1-12)
    dayOfWeek?: number;  // День недели (0-6, где 0 = Пн)
};

// Цвета по типу задачи
export const TASK_COLORS: Record<taskType, string> = {
    important: '#ff4d4f',
    simple: '#1890ff',
    rest: '#52c41a',
};