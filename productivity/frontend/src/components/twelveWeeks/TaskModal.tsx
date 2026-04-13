import {Modal, Input, Form, Select, TimePicker, Flex, Typography, Alert} from 'antd';
import {useState, useEffect, useMemo} from 'react';
import dayjs, {Dayjs} from 'dayjs';
import type {taskType, TimeSlot} from '../../types/twelveWeeks/task.ts';
import {useGoalStore} from '../../store/twelveWeeks/goalStore.ts';
import {useTaskStore, getOccupiedRanges} from '../../store/twelveWeeks/taskStore.ts';

const {Text} = Typography;

// ================================================================
// УТИЛИТЫ  Dayjs <-> TimeSlot
// ================================================================

const slotToDayjs = (slot?: TimeSlot): Dayjs | null => {
    if (!slot) return null;
    return dayjs().hour(slot.hour).minute(slot.minute).second(0);
};

const dayjsToSlot = (d: Dayjs | null): TimeSlot | undefined => {
    if (!d) return undefined;
    return {hour: d.hour(), minute: d.minute()};
};

// ================================================================
// ТИПЫ
// ================================================================

interface TaskModalProps {
    open: boolean;
    onClose: () => void;
    onSave: (
        text: string,
        type: taskType,
        startTime?: TimeSlot,
        endTime?: TimeSlot,
        goalId?: string,
        week?: number,
        dayOfWeek?: number,
    ) => void;
    initialText?: string;
    initialType?: taskType;
    initialStartTime?: TimeSlot;
    initialEndTime?: TimeSlot;
    initialGoalId?: string;
    initialWeek?: number;
    initialDayOfWeek?: number;
    /** id редактируемой задачи — нужен чтобы исключить её саму из проверки конфликтов */
    editingId?: string;
    title?: string;
}

// ================================================================
// КОМПОНЕНТ
// ================================================================

export function TaskModal({
                              open,
                              onClose,
                              onSave,
                              initialText = '',
                              initialType = 'simple',
                              initialStartTime,
                              initialEndTime,
                              initialGoalId,
                              initialWeek = 1,
                              initialDayOfWeek = 0,
                              editingId,
                              title = 'Добавить задачу',
                          }: TaskModalProps) {

    const [text, setTexts] = useState(initialText);
    const [type, setType] = useState<taskType>(initialType);
    const [goalId, setGoalId] = useState<string | undefined>(initialGoalId);
    const [week, setWeek] = useState(initialWeek);
    const [dayOfWeek, setDay] = useState(initialDayOfWeek);
    const [startTime, setStartTime] = useState<Dayjs | null>(slotToDayjs(initialStartTime));
    const [endTime, setEndTime] = useState<Dayjs | null>(slotToDayjs(initialEndTime));

    const {goals} = useGoalStore();
    const {tasks} = useTaskStore();

    // Сбрасываем поля при открытии
    useEffect(() => {
        setTexts(initialText);
        setType(initialType);
        setGoalId(initialGoalId);
        setWeek(initialWeek);
        setDay(initialDayOfWeek);
        setStartTime(slotToDayjs(initialStartTime));
        setEndTime(slotToDayjs(initialEndTime));
    }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

    // ----------------------------------------------------------------
    // Занятые диапазоны для текущего дня/недели
    // Пересчитываем при смене week / dayOfWeek
    // ----------------------------------------------------------------
    const occupiedRanges = useMemo(
        () => getOccupiedRanges(tasks, week, dayOfWeek, editingId),
        [tasks, week, dayOfWeek, editingId]
    );

    /**
     * Для данного часа возвращает список занятых минут.
     * Занята минута M если она попадает в какой-либо из диапазонов
     * (строго: startMin <= M*60+h*60 < endMin).
     */
    const getDisabledMinutesForHour = (h: number): number[] => {
        const disabled: number[] = [];
        for (let m = 0; m < 60; m++) {
            const totalMin = h * 60 + m;
            const isOccupied = occupiedRanges.some(r => totalMin >= r.startMin && totalMin < r.endMin);
            if (isOccupied) disabled.push(m);
        }
        return disabled;
    };

    /**
     * Часы для выбора "начала": блокируем час если ВСЕ его минуты заняты.
     * Если хотя бы одна свободна — час доступен.
     */
    const disabledStartHours = (): number[] => {
        const hours: number[] = [];
        for (let h = 0; h < 24; h++) {
            const allBusy = Array.from({length: 60}, (_, m) => {
                const totalMin = h * 60 + m;
                return occupiedRanges.some(r => totalMin >= r.startMin && totalMin < r.endMin);
            }).every(Boolean);
            if (allBusy) hours.push(h);
        }
        return hours;
    };

    /**
     * Минуты для выбора "начала": блокируем если попадает в занятый диапазон.
     */
    const disabledStartMinutes = (h: number): number[] =>
        getDisabledMinutesForHour(h);

    /**
     * Часы для выбора "конца": не может быть раньше/равно началу,
     * плюс нельзя выбрать час если он весь занят (за вычетом нашего слота).
     */
    const disabledEndHours = (): number[] => {
        const hours: number[] = [];
        const startMin = startTime ? startTime.hour() * 60 + startTime.minute() : 0;
        for (let h = 0; h < 24; h++) {
            // Конец не может быть раньше или равен началу
            if (startTime && h * 60 + 59 <= startMin) {
                hours.push(h);
                continue;
            }
            // Проверяем: есть ли конфликт если конец стоит в этом часу
            // Конфликт = пересечение нового слота [start, end) с занятыми
            if (startTime) {
                const wouldConflict = occupiedRanges.some(r => {
                    // Конец в h:00 → слот [startMin, h*60)
                    // Конфликт если startMin < r.endMin && h*60 > r.startMin
                    return startMin < r.endMin && h * 60 > r.startMin;
                });
                if (wouldConflict) {
                    // Только если занятый диапазон начинается ДО нашего конца
                    // и не является пограничным (конец задачи = наше начало — допустимо)
                    const trueConflict = occupiedRanges.some(r =>
                        r.startMin >= startMin && r.startMin < h * 60
                    );
                    if (trueConflict) hours.push(h);
                }
            }
        }
        return hours;
    };

    /**
     * Минуты для выбора "конца": нельзя выбрать если в этой минуте начинается
     * другая задача, или если создаётся пересечение со слотом.
     */
    const disabledEndMinutes = (h: number): number[] => {
        const disabled: number[] = [];
        const startMin = startTime ? startTime.hour() * 60 + startTime.minute() : -1;

        for (let m = 0; m < 60; m++) {
            const totalMin = h * 60 + m;

            // Конец должен быть строго позже начала
            if (totalMin <= startMin) {
                disabled.push(m);
                continue;
            }

            // Проверяем: если конец = totalMin, создаёт ли слот [startMin, totalMin) пересечение?
            const wouldConflict = occupiedRanges.some(r =>
                // Пересечение: наш старт < конец занятого И наш конец > начало занятого
                startMin < r.endMin && totalMin > r.startMin
            );
            if (wouldConflict) disabled.push(m);
        }
        return disabled;
    };

    // ----------------------------------------------------------------
    // Подсказка о занятости
    // ----------------------------------------------------------------

    /** Форматирует занятые диапазоны в читаемый список */
    const occupiedHint = useMemo(() => {
        if (occupiedRanges.length === 0) return null;
        return occupiedRanges.map(r => {
            const sh = Math.floor(r.startMin / 60);
            const sm = r.startMin % 60;
            const eh = Math.floor(r.endMin / 60);
            const em = r.endMin % 60;
            const fmt = (h: number, m: number) => `${h}:${String(m).padStart(2, '0')}`;
            return `${fmt(sh, sm)}–${fmt(eh, em)}`;
        }).join(', ');
    }, [occupiedRanges]);

    // ----------------------------------------------------------------
    // Валидация
    // ----------------------------------------------------------------

    const isTimeValid = (): boolean => {
        if (!startTime && !endTime) return true;
        if (!startTime || !endTime) return false;
        return endTime.isAfter(startTime);
    };

    const canSave: boolean = text.trim().length > 0 && isTimeValid();

    // ----------------------------------------------------------------
    // Обработчики
    // ----------------------------------------------------------------

    const handleReset = () => {
        setTexts('');
        setType('simple');
        setGoalId(undefined);
        setWeek(1);
        setDay(0);
        setStartTime(null);
        setEndTime(null);
    };

    const handleOk = () => {
        if (!canSave) return;
        onSave(
            text.trim(),
            type,
            dayjsToSlot(startTime),
            dayjsToSlot(endTime),
            goalId,
            week,
            dayOfWeek,
        );
        handleReset();
    };

    const handleCancel = () => {
        handleReset();
        onClose();
    };

    const weekDays = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];
    const MINUTE_STEP = 5;

    return (
        <Modal
            title={title}
            open={open}
            onOk={handleOk}
            onCancel={handleCancel}
            okText="Сохранить"
            cancelText="Отмена"
            okButtonProps={{
                disabled: !canSave,
                style: {
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    border: 'none',
                },
            }}
            width={500}
        >
            <Form layout="vertical" style={{marginTop: 20}}>

                {/* Название */}
                <Form.Item label="Название задачи" required>
                    <Input
                        placeholder="Например: Прочитать главу книги"
                        value={text}
                        onChange={e => setTexts(e.target.value)}
                        onPressEnter={handleOk}
                        size="large"
                        autoFocus
                        maxLength={200}
                        showCount
                    />
                </Form.Item>

                {/* Тип */}
                <Form.Item label="Тип задачи">
                    <Select
                        value={type}
                        onChange={setType}
                        size="large"
                        options={[
                            {value: 'simple', label: '🔵 Простая'},
                            {value: 'important', label: '🟡 Важная'},
                            {value: 'rest', label: '🟢 Отдых'},
                        ]}
                    />
                </Form.Item>

                {/* Неделя — ставим перед временем, чтобы occupiedRanges пересчитались до выбора */}
                <Form.Item label="Неделя">
                    <Select
                        value={week}
                        onChange={val => {
                            setWeek(val);
                            setStartTime(null);
                            setEndTime(null);
                        }}
                        size="large"
                        options={Array.from({length: 12}, (_, i) => ({
                            value: i + 1,
                            label: `Неделя ${i + 1}`,
                        }))}
                    />
                </Form.Item>

                {/* День недели */}
                <Form.Item label="День недели">
                    <Select
                        value={dayOfWeek}
                        onChange={val => {
                            setDay(val);
                            setStartTime(null);
                            setEndTime(null);
                        }}
                        size="large"
                        options={weekDays.map((day, index) => ({value: index, label: day}))}
                    />
                </Form.Item>

                {/* Время */}
                <Form.Item label="Время выполнения (необязательно)">
                    {/* Подсказка о занятых слотах */}
                    {occupiedHint && (
                        <Alert
                            type="info"
                            showIcon
                            message={`Уже занято: ${occupiedHint}`}
                            style={{marginBottom: 10, fontSize: 12, borderRadius: 8}}
                        />
                    )}

                    <Flex gap={8} align="center">
                        <TimePicker
                            value={startTime}
                            onChange={val => {
                                setStartTime(val);
                                // Если конец раньше нового начала — сбрасываем
                                if (val && endTime && !endTime.isAfter(val)) setEndTime(null);
                            }}
                            format="H:mm"
                            minuteStep={MINUTE_STEP}
                            placeholder="Начало"
                            size="large"
                            style={{flex: 1}}
                            needConfirm={false}
                            disabledTime={() => ({
                                disabledHours: disabledStartHours,
                                disabledMinutes: disabledStartMinutes,
                            })}
                        />
                        <Text type="secondary">—</Text>
                        <TimePicker
                            value={endTime}
                            onChange={setEndTime}
                            format="H:mm"
                            minuteStep={MINUTE_STEP}
                            placeholder="Конец"
                            size="large"
                            style={{flex: 1}}
                            needConfirm={false}
                            disabled={!startTime}
                            disabledTime={() => ({
                                disabledHours: disabledEndHours,
                                disabledMinutes: disabledEndMinutes,
                            })}
                        />
                    </Flex>

                    {startTime && endTime && !isTimeValid() && (
                        <Text type="danger" style={{fontSize: 12}}>
                            Время окончания должно быть позже времени начала
                        </Text>
                    )}
                    {!startTime && !endTime && (
                        <Text type="secondary" style={{fontSize: 12}}>
                            Если не указать — задача добавится без времени
                        </Text>
                    )}
                    {startTime && !endTime && (
                        <Text type="secondary" style={{fontSize: 12}}>
                            Выберите время окончания
                        </Text>
                    )}
                </Form.Item>

                {/* Цель */}
                <Form.Item label="Привязать к цели (необязательно)">
                    <Select
                        value={goalId}
                        onChange={setGoalId}
                        size="large"
                        allowClear
                        placeholder="Выберите цель или оставьте пустым"
                        options={goals.map(goal => ({value: goal.id, label: goal.text}))}
                    />
                </Form.Item>

            </Form>
        </Modal>
    );
}