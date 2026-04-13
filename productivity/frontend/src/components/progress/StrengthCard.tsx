/**
 * StrengthCard — карточка силового трекера.
 * Отвечает только за ввод вес×повторения и расчёт 1RM.
 * Вся логика графика — в ChartEngine.
 */
import {useState} from 'react';
import {
    Button, Flex, InputNumber, Input,
    Popconfirm, Typography, Tag, Tooltip,
} from 'antd';
import {
    ArrowUpOutlined, ArrowDownOutlined,
    DeleteOutlined, PlusOutlined, MinusOutlined,
} from '@ant-design/icons';
import {Dumbbell} from 'lucide-react';
import type {ProgressTracker} from '../../types/progress/progress.ts';
import {calcORM, calcProgress, getBaseStrengthRecord} from '../../types/progress/progress.ts';
import {useProgressStore} from '../../store/progress/progressStore.ts';
import {ChartEngine} from './ChartEngine.tsx';
import type {UnifiedRecord} from '../../store/progress/chartUtils.ts';

const {Text, Title} = Typography;

interface ProgressBadgeProps {
    percent: number;
    absolute: number;
}

function ProgressBadge({percent, absolute}: ProgressBadgeProps) {
    const [showPct, setShowPct] = useState(true);
    const pos = absolute >= 0;
    const Icon = pos ? ArrowUpOutlined : ArrowDownOutlined;
    return (
        <Tooltip title="Нажмите чтобы переключить % / значение">
            <Tag icon={<Icon/>} color={pos ? 'success' : 'error'}
                 style={{cursor: 'pointer', fontSize: 13, padding: '2px 8px'}}
                 onClick={() => setShowPct(p => !p)}>
                {showPct ? `${pos ? '+' : ''}${percent}%` : `${pos ? '+' : ''}${absolute} кг 1RM`}
            </Tag>
        </Tooltip>
    );
}

interface Props {
    tracker: ProgressTracker;
    onDelete: () => void;
}

export function StrengthCard({tracker, onDelete}: Props) {
    const {addStrengthRecord, removeStrengthRecord} = useProgressStore();
    const [weight, setWeight] = useState<number | null>(null);
    const [reps, setReps] = useState<number | null>(null);
    const [newNote, setNewNote] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    const sorted = [...tracker.strengthRecords].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latest = sorted[0] ?? null;
    const base = getBaseStrengthRecord(tracker.strengthRecords, 'week');
    const progress = latest && base && latest.id !== base.id
        ? calcProgress(latest.orm, base.orm) : null;
    const previewOrm = weight && reps ? calcORM(weight, reps) : null;

    const handleAdd = () => {
        if (!weight || !reps) return;
        addStrengthRecord(tracker.id, weight, reps, newNote.trim() || undefined);
        setWeight(null);
        setReps(null);
        setNewNote('');
    };

    const handleDelete = (ids: string[]) =>
        ids.forEach(id => removeStrengthRecord(tracker.id, id));

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const time = d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
        if (d.toDateString() === new Date().toDateString()) return `Сегодня, ${time}`;
        return d.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'}) + `, ${time}`;
    };

    // Конвертируем в UnifiedRecord: value = orm, label = "45кг×10"
    const unified: UnifiedRecord[] = tracker.strengthRecords.map(r => ({
        id: r.id,
        date: r.date,
        value: r.orm,
        label: `${r.weight}кг×${r.reps} · 1RM`,
    }));

    return (
        <div style={{
            background: 'white', borderRadius: 16, padding: 24,
            boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
            borderTop: `4px solid ${tracker.color}`,
        }}>
            {/* Шапка */}
            <Flex justify="space-between" align="flex-start" style={{marginBottom: 16}}>
                <div>
                    <Flex align="center" gap={8} style={{marginBottom: 6}}>
                        <Dumbbell size={16} color={tracker.color} strokeWidth={2}/>
                        <Title level={5} style={{margin: 0}}>{tracker.name}</Title>
                    </Flex>
                    {latest ? (
                        <div>
                            <Flex align="baseline" gap={6} style={{marginBottom: 4}}>
                                <Text style={{fontSize: 26, fontWeight: 700, color: tracker.color, lineHeight: 1}}>
                                    {latest.weight} кг
                                </Text>
                                <Text type="secondary" style={{fontSize: 14}}>× {latest.reps} раз</Text>
                                {progress && (
                                    <ProgressBadge percent={progress.percent} absolute={progress.absolute}/>
                                )}
                            </Flex>
                            <Flex align="center" gap={6}>
                                <Text type="secondary" style={{fontSize: 12}}>Расчётный макс. (1RM):</Text>
                                <Text style={{fontSize: 13, fontWeight: 600, color: tracker.color}}>
                                    {latest.orm} кг
                                </Text>
                                <Tooltip
                                    title="Формула Brzycki / Epley: теоретический максимум на 1 повторение — стандартный способ сравнивать тренировки с разным весом и числом повторений.">
                                    <Text type="secondary" style={{fontSize: 11, cursor: 'help'}}>ⓘ</Text>
                                </Tooltip>
                            </Flex>
                        </div>
                    ) : (
                        <Text type="secondary" style={{fontSize: 13}}>Нет записей</Text>
                    )}
                </div>
                <Popconfirm
                    title="Удалить трекер?" description="Все записи будут удалены"
                    onConfirm={onDelete} okText="Удалить" cancelText="Отмена"
                    okButtonProps={{danger: true}}
                >
                    <Button type="text" icon={<DeleteOutlined/>} danger size="small"/>
                </Popconfirm>
            </Flex>

            {/* График — ChartEngine получает orm как value */}
            <div style={{marginBottom: 16}}>
                <ChartEngine
                    trackerId={tracker.id}
                    records={unified}
                    unit="кг 1RM"
                    color={tracker.color}
                    onDelete={handleDelete}
                />
            </div>

            {/* Новая запись */}
            <div style={{background: '#fafafa', borderRadius: 10, padding: '12px 16px', marginBottom: 12}}>
                <Text strong style={{fontSize: 13, display: 'block', marginBottom: 10}}>Новая запись</Text>
                <Flex gap={8} style={{marginBottom: 8}}>
                    <InputNumber
                        value={weight}
                        onChange={(val) => setWeight(val === null ? null : Number(val))}
                    />
                    <InputNumber
                        value={reps}
                        onChange={(val) => setReps(val === null ? null : Number(val))}
                    />
                </Flex>

                {/* Предпросмотр 1RM */}
                {previewOrm !== null && (
                    <div style={{
                        background: `${tracker.color}12`, border: `1px solid ${tracker.color}30`,
                        borderRadius: 8, padding: '6px 12px', marginBottom: 8,
                    }}>
                        <Flex align="center" gap={10}>
                            <Dumbbell size={14} color={tracker.color} strokeWidth={2}/>
                            <Text style={{fontSize: 13}}>
                                Расчётный 1RM:{' '}
                                <Text strong style={{color: tracker.color, fontSize: 15}}>
                                    {previewOrm} кг
                                </Text>
                            </Text>
                            {latest && (() => {
                                const diff = calcProgress(previewOrm, latest.orm);
                                return (
                                    <Tag color={diff.absolute >= 0 ? 'success' : 'error'} style={{fontSize: 11}}>
                                        {diff.absolute >= 0 ? '+' : ''}{diff.percent}% vs прошлый раз
                                    </Tag>
                                );
                            })()}
                        </Flex>
                    </div>
                )}

                <Flex gap={8}>
                    <Input
                        placeholder="Заметка (необязательно)"
                        value={newNote} onChange={e => setNewNote(e.target.value)}
                        onPressEnter={handleAdd} style={{flex: 2}} size="middle" maxLength={100}
                    />
                    <Button
                        type="primary" icon={<PlusOutlined/>} onClick={handleAdd}
                        disabled={!weight || !reps}
                        style={{background: tracker.color, border: 'none'}}
                    />
                </Flex>
            </div>

            {/* История */}
            {sorted.length > 0 && (
                <div>
                    <Button
                        type="link" size="small"
                        icon={showHistory ? <MinusOutlined/> : <PlusOutlined/>}
                        onClick={() => setShowHistory(h => !h)}
                        style={{padding: 0, color: '#8c8c8c', fontSize: 12}}
                    >
                        {showHistory ? 'Скрыть историю' : `История (${sorted.length})`}
                    </Button>
                    {showHistory && (
                        <div style={{marginTop: 8}}>
                            {sorted.map((record, i) => {
                                const prev = sorted[i + 1];
                                const diff = prev ? calcProgress(record.orm, prev.orm) : null;
                                return (
                                    <Flex key={record.id} justify="space-between" align="center"
                                          style={{padding: '8px 0', borderBottom: '1px solid #f0f0f0'}}>
                                        <div>
                                            <Flex align="baseline" gap={6}>
                                                <Text style={{fontWeight: 600, color: tracker.color, fontSize: 15}}>
                                                    {record.weight} кг × {record.reps} раз
                                                </Text>
                                                {diff && (
                                                    <Text style={{
                                                        fontSize: 11,
                                                        color: diff.absolute >= 0 ? '#52c41a' : '#f5222d'
                                                    }}>
                                                        {diff.absolute >= 0 ? '+' : ''}{diff.percent}%
                                                    </Text>
                                                )}
                                            </Flex>
                                            <Text type="secondary" style={{fontSize: 11}}>
                                                1RM: {record.orm} кг{record.note ? `  —  ${record.note}` : ''}
                                            </Text>
                                        </div>
                                        <Flex align="center" gap={8}>
                                            <Text type="secondary" style={{fontSize: 11}}>
                                                {formatDate(record.date)}
                                            </Text>
                                            <Popconfirm
                                                title="Удалить эту запись?"
                                                onConfirm={() => removeStrengthRecord(tracker.id, record.id)}
                                                okText="Удалить" cancelText="Отмена"
                                                okButtonProps={{danger: true}}
                                            >
                                                <Button type="text" size="small"
                                                        icon={<DeleteOutlined/>} danger style={{opacity: 0.5}}/>
                                            </Popconfirm>
                                        </Flex>
                                    </Flex>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}