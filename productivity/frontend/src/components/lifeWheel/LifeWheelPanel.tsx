import {
    Button, Checkbox, Empty, Flex,
    Input, Slider, Space, Typography
} from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useState } from 'react';
import type { WheelSegment} from "../../types/lifeWheel/lifeWheel.ts";
import { useWheelStore} from "../../store/lifeWheel/lifeWheelStore.ts";

const { Text, Title } = Typography;

type LifeWheelPanelProps = {
    segment: WheelSegment;
};

// Цвет подписи балла зависит от значения
const scoreColor = (score: number): string => {
    if (score <= 3) return '#f5222d';  // красный — низко
    if (score <= 6) return '#fa8c16';  // оранжевый — средне
    if (score <= 8) return '#52c41a';  // зелёный — хорошо
    return '#1677ff';                  // синий — отлично
};

export function LifeWheelPanel({ segment }: LifeWheelPanelProps) {
    const [taskInput, setTaskInput] = useState('');
    const { setScore, addTask, toggleTask, removeTask } = useWheelStore();

    const handleAddTask = () => {
        if (!taskInput.trim()) return;
        addTask(segment.id, taskInput.trim());
        setTaskInput('');
    };

    const doneTasks  = segment.tasks.filter(t => t.done).length;
    const totalTasks = segment.tasks.length;

    return (
        <div>
            {/* Заголовок с цветной полосой слева */}
            <div style={{
                borderLeft: `4px solid ${segment.color}`,
                paddingLeft: 12,
                marginBottom: 24,
            }}>
                <Title level={4} style={{ margin: 0 }}>{segment.name}</Title>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    {totalTasks > 0
                        ? `${doneTasks} / ${totalTasks} задач выполнено`
                        : 'Задач ещё нет'}
                </Text>
            </div>

            {/* Слайдер выставления балла */}
            <div style={{ marginBottom: 28 }}>
                <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                    <Text strong>Текущий балл</Text>
                    <span style={{
                        fontSize: 24,
                        fontWeight: 700,
                        color: scoreColor(segment.score),
                        minWidth: 36,
                        textAlign: 'right',
                        transition: 'color 0.3s',
                    }}>
                        {segment.score}
                    </span>
                </Flex>

                {/*
                    Слайдер с шагом 1, диапазон 0–10.
                    trackStyle и handleStyle раскрашиваем цветом сегмента.
                */}
                <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={segment.score}
                    onChange={(val) => setScore(segment.id, val)}
                    tooltip={{ formatter: val => `${val}/10` }}
                    styles={{
                        track: { background: segment.color },
                        handle: { borderColor: segment.color },
                    }}
                />

                {/* Метки 0 и 10 */}
                <Flex justify="space-between">
                    <Text type="secondary" style={{ fontSize: 11 }}>0</Text>
                    <Text type="secondary" style={{ fontSize: 11 }}>10</Text>
                </Flex>
            </div>

            {/* Задачи */}
            <div>
                <Text strong style={{ display: 'block', marginBottom: 12 }}>
                    Задачи
                </Text>

                {segment.tasks.length === 0 ? (
                    <Empty
                        description="Добавьте задачи для этого направления"
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ padding: '16px 0' }}
                    />
                ) : (
                    <div style={{ marginBottom: 12 }}>
                        {segment.tasks.map(task => (
                            <Flex
                                key={task.id}
                                align="center"
                                justify="space-between"
                                style={{
                                    padding: '8px 12px',
                                    borderRadius: 8,
                                    marginBottom: 6,
                                    background: task.done ? '#f6ffed' : '#fafafa',
                                    border: `1px solid ${task.done ? '#b7eb8f' : '#e8e8e8'}`,
                                    transition: 'all 0.2s',
                                }}
                            >
                                <Space>
                                    <Checkbox
                                        checked={task.done}
                                        onChange={() => toggleTask(segment.id, task.id)}
                                    />
                                    <Text
                                        delete={task.done}
                                        style={{
                                            color: task.done ? '#8c8c8c' : '#434343',
                                            fontSize: 14,
                                        }}
                                    >
                                        {task.text}
                                    </Text>
                                </Space>
                                <Button
                                    type="text"
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    onClick={() => removeTask(segment.id, task.id)}
                                    danger
                                />
                            </Flex>
                        ))}
                    </div>
                )}

                {/* Поле добавления задачи */}
                <Flex gap={8}>
                    <Input
                        placeholder="Новая задача..."
                        value={taskInput}
                        onChange={e => setTaskInput(e.target.value)}
                        onPressEnter={handleAddTask}
                        size="middle"
                        style={{ borderRadius: 8 }}
                    />
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleAddTask}
                        disabled={!taskInput.trim()}
                        style={{
                            background: segment.color,
                            border: 'none',
                            borderRadius: 8,
                        }}
                    />
                </Flex>
            </div>
        </div>
    );
}