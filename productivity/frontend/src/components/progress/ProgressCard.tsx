/**
 * ProgressCard — карточка обычного трекера.
 * Отвечает только за ввод значений и отображение заголовка.
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
import type {ProgressTracker} from '../../types/progress/progress.ts';
import {calcProgress, getBaseRecord} from '../../types/progress/progress.ts';
import {useProgressStore} from '../../store/progress/progressStore.ts';
import {ChartEngine} from './ChartEngine.tsx';
import type {UnifiedRecord} from '../../store/progress/chartUtils.ts';

const {Text, Title} = Typography;

interface ProgressBadgeProps {
    percent: number;
    absolute: number;
    unit: string;
}

function ProgressBadge({percent, absolute, unit}: ProgressBadgeProps) {
    const [showPct, setShowPct] = useState(true);
    const pos = absolute >= 0;
    const Icon = pos ? ArrowUpOutlined : ArrowDownOutlined;
    return (
        <Tooltip title="Нажмите чтобы переключить % / значение">
            <Tag
                icon={<Icon/>}
                color={pos ? 'success' : 'error'}
                style={{cursor: 'pointer', fontSize: 13, padding: '2px 8px'}}
                onClick={() => setShowPct(p => !p)}
            >
                {showPct
                    ? `${pos ? '+' : ''}${percent}%`
                    : `${pos ? '+' : ''}${absolute} ${unit}`}
            </Tag>
        </Tooltip>
    );
}

interface Props {
    tracker: ProgressTracker;
    onDelete: () => void;
}

export function ProgressCard({tracker, onDelete}: Props) {
    const {addRecord, removeRecord} = useProgressStore();
    const [newValue, setNewValue] = useState<number | null>(null);
    const [newNote, setNewNote] = useState('');
    const [showHistory, setShowHistory] = useState(false);

    // Для бейджа — берём progress за неделю (базовое сравнение)
    const sorted = [...tracker.records].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latest = sorted[0] ?? null;
    const base = getBaseRecord(tracker.records, 'week');
    const progress = latest && base && latest.id !== base.id
        ? calcProgress(latest.value, base.value) : null;

    const handleAdd = () => {
        if (newValue === null) return;
        addRecord(tracker.id, newValue, newNote.trim() || undefined);
        setNewValue(null);
        setNewNote('');
    };

    const handleDelete = (ids: string[]) => ids.forEach(id => removeRecord(tracker.id, id));

    const formatDate = (iso: string) => {
        const d = new Date(iso);
        const time = d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
        if (d.toDateString() === new Date().toDateString()) return `Сегодня, ${time}`;
        return d.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'}) + `, ${time}`;
    };

    // Конвертируем в UnifiedRecord для ChartEngine
    const unified: UnifiedRecord[] = tracker.records.map(r => ({
        id: r.id,
        date: r.date,
        value: r.value,
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
                    <Title level={5} style={{margin: 0}}>{tracker.name}</Title>
                    {latest ? (
                        <Flex align="center" gap={8} style={{marginTop: 4}}>
                            <Text style={{fontSize: 28, fontWeight: 700, color: tracker.color, lineHeight: 1}}>
                                {latest.value}
                            </Text>
                            <Text type="secondary" style={{fontSize: 14}}>{tracker.unit}</Text>
                            {progress && (
                                <ProgressBadge
                                    percent={progress.percent}
                                    absolute={progress.absolute}
                                    unit={tracker.unit}
                                />
                            )}
                        </Flex>
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

            {/* График */}
            <div style={{marginBottom: 16}}>
                <ChartEngine
                    trackerId={tracker.id}
                    records={unified}
                    unit={tracker.unit}
                    color={tracker.color}
                    onDelete={handleDelete}
                />
            </div>

            {/* Новая запись */}
            <div style={{background: '#fafafa', borderRadius: 10, padding: '12px 16px', marginBottom: 12}}>
                <Text strong style={{fontSize: 13, display: 'block', marginBottom: 10}}>Новая запись</Text>
                <Flex gap={8}>
                    <InputNumber
                        value={newValue}
                        onChange={(val) => setNewValue(val === null ? null : Number(val))}
                    />
                    <Input
                        placeholder="Заметка (необязательно)"
                        value={newNote} onChange={e => setNewNote(e.target.value)}
                        onPressEnter={handleAdd}
                        style={{flex: 2}} size="middle" maxLength={100}
                    />
                    <Button
                        type="primary" icon={<PlusOutlined/>} onClick={handleAdd}
                        disabled={newValue === null}
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
                                const diff = prev ? calcProgress(record.value, prev.value) : null;
                                return (
                                    <Flex key={record.id} justify="space-between" align="center"
                                          style={{padding: '6px 0', borderBottom: '1px solid #f0f0f0'}}>
                                        <Flex align="center" gap={8}>
                                            <Text style={{fontWeight: 600, color: tracker.color, fontSize: 15}}>
                                                {record.value} {tracker.unit}
                                            </Text>
                                            {record.note && (
                                                <Text type="secondary" style={{fontSize: 12}}>
                                                    — {record.note}
                                                </Text>
                                            )}
                                        </Flex>
                                        <Flex align="center" gap={8}>
                                            {diff && (
                                                <Text style={{
                                                    fontSize: 11,
                                                    color: diff.absolute >= 0 ? '#52c41a' : '#f5222d'
                                                }}>
                                                    {diff.absolute >= 0 ? '+' : ''}{diff.percent}%
                                                </Text>
                                            )}
                                            <Text type="secondary" style={{fontSize: 11}}>
                                                {formatDate(record.date)}
                                            </Text>
                                            <Popconfirm
                                                title="Удалить эту запись?"
                                                onConfirm={() => removeRecord(tracker.id, record.id)}
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