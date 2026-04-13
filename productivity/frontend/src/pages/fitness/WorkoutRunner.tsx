/**
 * WorkoutRunner — запуск и запись тренировки.
 * Показывает упражнения дня, подходы, сравнение с прошлым разом.
 */
import {useEffect, useState} from 'react';
import {
    Button, Card, InputNumber, Typography, Flex, Tag, Alert, Spin, Modal,
} from 'antd';
import {PlusOutlined, CheckOutlined, TrophyOutlined, PlayCircleOutlined} from '@ant-design/icons';
import {useFitnessStore} from '../../store/fitness/fitnessStore.ts';
import type {TrainingDay, DayExercise, SessionSet} from '../../api/fitness.ts';

const {Text, Title} = Typography;
const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

function calcOrm(w: number, r: number): number {
    if (r === 1) return w;
    if (r >= 37) return Math.round(w * (1 + r / 30) * 10) / 10;
    return Math.round(w / (1.0278 - 0.0278 * r) * 10) / 10;
}

interface SetRow {
    weight: number | null;
    reps: number | null;
    done: boolean;
}

interface ExerciseBlockProps {
    de: DayExercise;
    sessionId: number;
    lastSets: SessionSet[];
    isMobile: boolean;
}

function ExerciseBlock({de, sessionId, lastSets, isMobile}: ExerciseBlockProps) {
    const {logSet, fetchLastSets} = useFitnessStore();


    const MEASURE_EMOJI: Record<string, string> = {
        strength: '🏋️',
        running: '🏃',
        reps: '🔢',
        time: '⏱',
        distance: '📏',
        standard: '📊',
    };
    const icon = MEASURE_EMOJI[(de.exercise as any).measurement_type ?? 'strength'] ?? '🏋️';

    const measureType = (de.exercise as any).measurement_type ?? 'strength';


    const [sets, setSets] = useState<SetRow[]>(
        Array.from({length: de.sets_count}, () => ({weight: null, reps: null, done: false}))
    );
    const [logging, setLogging] = useState(false);

    // Предзаполняем вес/повторения из последнего раза
    useEffect(() => {
        if (lastSets.length > 0) {
            setSets(s => s.map((row, i) => {
                const last = lastSets.find(ls => ls.set_number === i + 1);
                return last && !row.done ? {...row, weight: last.weight, reps: last.reps} : row;
            }));
        }
        fetchLastSets(de.exercise.id);
    }, [de.exercise.id]);

    const handleDone = async (idx: number) => {
        const row = sets[idx];
        if (!row.weight || !row.reps) return;
        setLogging(true);
        try {
            await logSet(de.id, idx + 1, row.weight, row.reps);
            setSets(s => s.map((r, i) => i === idx ? {...r, done: true} : r));
        } finally {
            setLogging(false);
        }
    };

    const addSet = () => setSets(s => [...s, {
        weight: s[s.length - 1]?.weight ?? null,
        reps: s[s.length - 1]?.reps ?? null,
        done: false
    }]);

    const todaySets = useFitnessStore.getState().sessionSets.filter(s => s.day_exercise === de.id);

    return (
        <Card size="small" style={{borderRadius: 12, marginBottom: 12, borderLeft: '4px solid #667eea'}}>
            <Flex align="center" gap={8} style={{marginBottom: 4}}>
                <span style={{fontSize: 18}}>{icon}</span>
                <Text strong style={{fontSize: 14}}>{de.exercise.name}</Text>
            </Flex>
            <Flex gap={6} style={{marginBottom: 10}}>
                <Tag style={{fontSize: 10}}>{de.sets_count} подходов</Tag>
                {de.reps_hint && <Tag style={{fontSize: 10}}>{de.reps_hint} повт.</Tag>}
            </Flex>

            {/* Прошлый раз */}
            {lastSets.length > 0 && (
                <div style={{background: '#f8f9ff', borderRadius: 8, padding: '6px 10px', marginBottom: 10}}>
                    <Text type="secondary" style={{fontSize: 11, display: 'block', marginBottom: 4}}>Прошлый раз:</Text>
                    <Flex gap={8} wrap="wrap">
                        {lastSets.map(ls => (
                            <Tag key={ls.id} style={{fontSize: 11}}>
                                {ls.weight}кг × {ls.reps} = {ls.orm} 1RM
                            </Tag>
                        ))}
                    </Flex>
                </div>
            )}

            {/* Подходы */}
            {sets.map((row, idx) => {
                const todaySet = todaySets.find(s => s.set_number === idx + 1);
                const lastSet = lastSets.find(s => s.set_number === idx + 1);
                const betterThanLast = todaySet && lastSet ? todaySet.orm >= lastSet.orm : null;

                return (
                    <div key={idx} style={{
                        background: row.done ? '#f6ffed' : '#fafafa',
                        borderRadius: 8, padding: '8px 10px', marginBottom: 6,
                        border: `1px solid ${row.done ? '#b7eb8f' : '#f0f0f0'}`,
                    }}>
                        <Flex align="center" gap={8} wrap="wrap">
                            <Text style={{fontSize: 12, fontWeight: 600, color: '#8c8c8c', minWidth: 20}}>
                                {idx + 1}
                            </Text>

                            {measureType === 'strength' && (
                                <>
                                    <InputNumber min={0} step={2.5} value={row.weight ?? undefined}
                                                 onChange={v => setSets(s => s.map((r, i) => i === idx ? {
                                                     ...r,
                                                     weight: v ?? null
                                                 } : r))}
                                                 placeholder="кг" size="small" style={{width: 70}} addonAfter="кг"
                                                 disabled={row.done}/>
                                    <InputNumber min={1} max={100} value={row.reps ?? undefined}
                                                 onChange={v => setSets(s => s.map((r, i) => i === idx ? {
                                                     ...r,
                                                     reps: v ?? null
                                                 } : r))}
                                                 placeholder="повт" size="small" style={{width: 80}} addonAfter="×"
                                                 disabled={row.done}/>
                                </>
                            )}
                            {measureType === 'running' && (
                                <>
                                    <InputNumber min={1} value={row.weight ?? undefined}
                                                 onChange={v => setSets(s => s.map((r, i) => i === idx ? {
                                                     ...r,
                                                     weight: v ?? null
                                                 } : r))}
                                                 placeholder="метры" size="small" style={{width: 90}} addonAfter="м"
                                                 disabled={row.done}/>
                                    <InputNumber min={0} value={row.reps ?? undefined}
                                                 onChange={v => setSets(s => s.map((r, i) => i === idx ? {
                                                     ...r,
                                                     reps: v ?? null
                                                 } : r))}
                                                 placeholder="сек" size="small" style={{width: 80}} addonAfter="с"
                                                 disabled={row.done}/>
                                </>
                            )}
                            {(measureType === 'reps') && (
                                <InputNumber min={1} value={row.reps ?? undefined}
                                             onChange={v => setSets(s => s.map((r, i) => i === idx ? {
                                                 ...r,
                                                 reps: v ?? null
                                             } : r))}
                                             placeholder="раз" size="small" style={{width: 90}} addonAfter="раз"
                                             disabled={row.done}/>
                            )}
                            {(measureType === 'time') && (
                                <InputNumber min={1} value={row.reps ?? undefined}
                                             onChange={v => setSets(s => s.map((r, i) => i === idx ? {
                                                 ...r,
                                                 reps: v ?? null
                                             } : r))}
                                             placeholder="сек" size="small" style={{width: 90}} addonAfter="сек"
                                             disabled={row.done}/>
                            )}
                            {(measureType === 'distance') && (
                                <InputNumber min={1} value={row.weight ?? undefined}
                                             onChange={v => setSets(s => s.map((r, i) => i === idx ? {
                                                 ...r,
                                                 weight: v ?? null
                                             } : r))}
                                             placeholder="м" size="small" style={{width: 90}} addonAfter="м"
                                             disabled={row.done}/>
                            )}
                            {(measureType === 'standard') && (
                                <InputNumber value={row.weight ?? undefined}
                                             onChange={v => setSets(s => s.map((r, i) => i === idx ? {
                                                 ...r,
                                                 weight: v ?? null
                                             } : r))}
                                             placeholder="значение" size="small" style={{width: 100}}
                                             disabled={row.done}/>
                            )}

                            {/*<InputNumber*/}
                            {/*    min={0} step={2.5} value={row.weight ?? undefined}*/}
                            {/*    onChange={v => setSets(s => s.map((r, i) => i === idx ? {...r, weight: v ?? null} : r))}*/}
                            {/*    placeholder="кг" size="small" style={{width: 70}}*/}
                            {/*    addonAfter="кг" disabled={row.done}*/}
                            {/*/>*/}
                            {/*<InputNumber*/}
                            {/*    min={1} max={100} value={row.reps ?? undefined}*/}
                            {/*    onChange={v => setSets(s => s.map((r, i) => i === idx ? {...r, reps: v ?? null} : r))}*/}
                            {/*    placeholder="повт" size="small" style={{width: 80}}*/}
                            {/*    addonAfter="×" disabled={row.done}*/}
                            {/*/>*/}
                            {!row.done ? (
                                <Button size="small" type="primary" icon={<CheckOutlined/>}
                                        loading={logging}
                                        onClick={() => handleDone(idx)}
                                        disabled={!row.weight && !row.reps}
                                        style={{background: GRADIENT, border: 'none'}}>
                                    Готово
                                </Button>
                            ) : (
                                <Flex align="center" gap={6}>
                                    <Text style={{fontSize: 11, color: '#52c41a'}}>✓</Text>
                                    {todaySet && <Text style={{
                                        fontSize: 11,
                                        fontWeight: 600,
                                        color: '#667eea'
                                    }}>{todaySet.orm} 1RM</Text>}
                                    {betterThanLast !== null && (
                                        <Text style={{fontSize: 10, color: betterThanLast ? '#52c41a' : '#f5222d'}}>
                                            {betterThanLast ? '▲ лучше прошлого' : '▼ хуже прошлого'}
                                        </Text>
                                    )}
                                </Flex>
                            )}
                        </Flex>
                    </div>
                );
            })}

            {/* Общий прогресс за тренировку */}
            {todaySets.length > 0 && lastSets.length > 0 && (() => {
                const todayOrm = Math.max(...todaySets.map(s => s.orm));
                const lastOrm = Math.max(...lastSets.map(s => s.orm));
                const better = todayOrm >= lastOrm;
                return (
                    <div style={{
                        background: better ? '#f6ffed' : '#fff1f0',
                        borderRadius: 8,
                        padding: '6px 10px',
                        marginTop: 6
                    }}>
                        <Text style={{fontSize: 11, color: better ? '#52c41a' : '#f5222d', fontWeight: 600}}>
                            {better ? '🏆 Лучше прошлой тренировки!' : '📉 Ниже прошлой тренировки'}
                            {'  '}{todayOrm} vs {lastOrm} 1RM
                        </Text>
                    </div>
                );
            })()}

            <Button type="dashed" size="small" icon={<PlusOutlined/>} block
                    style={{marginTop: 8}} onClick={addSet}>
                Ещё подход
            </Button>
        </Card>
    );
}

interface Props {
    day: TrainingDay;
    onBack: () => void;
}

export function WorkoutRunner({day, onBack}: Props) {
    const {activeSession, startSession, finishSession, sessionSets, fetchLastSets} = useFitnessStore();
    const [starting, setStarting] = useState(false);
    const [finishing, setFinishing] = useState(false);
    const [confirmFinish, setConfirmFinish] = useState(false);
    const isMobile = window.innerWidth <= 768;

    const allExercises = day.sections.flatMap(s => s.exercises);

    useEffect(() => {
        allExercises.forEach(de => fetchLastSets(de.exercise.id));
    }, [day.id]);

    const handleStart = async () => {
        setStarting(true);
        try {
            await startSession(day.id);
        } finally {
            setStarting(false);
        }
    };

    const handleFinish = async () => {
        setFinishing(true);
        try {
            await finishSession();
            setConfirmFinish(false);
            onBack();
        } finally {
            setFinishing(false);
        }
    };

    const lastSetsMap = useFitnessStore.getState().lastSets;
    const doneSets = sessionSets.length;
    const totalSets = allExercises.reduce((a, de) => a + de.sets_count, 0);

    return (
        <div style={{maxWidth: 680, margin: '0 auto'}}>
            <Flex align="center" gap={10} style={{marginBottom: 16}}>
                <Button type="text" onClick={onBack}>← Назад</Button>
                <Title level={4} style={{margin: 0}}>{day.name}</Title>
                {activeSession && (
                    <Tag color="green" style={{marginLeft: 'auto'}}>
                        {doneSets}/{totalSets} подходов
                    </Tag>
                )}
            </Flex>

            {!activeSession ? (
                <div style={{textAlign: 'center', padding: '32px 0'}}>
                    <div style={{fontSize: 48, marginBottom: 16}}>💪</div>
                    <Title level={4}>Готовы к тренировке?</Title>
                    <Text type="secondary" style={{display: 'block', marginBottom: 24}}>
                        {allExercises.length} упражнений · {totalSets} подходов
                    </Text>
                    <Button type="primary" size="large" icon={<PlayCircleOutlined/>}
                            loading={starting} onClick={handleStart}
                            style={{background: GRADIENT, border: 'none', height: 50, padding: '0 32px', fontSize: 16}}>
                        Начать тренировку
                    </Button>
                </div>
            ) : (
                <div>
                    {/* Прогресс-бар тренировки */}
                    <div style={{
                        height: 4,
                        background: '#f0f0f0',
                        borderRadius: 2,
                        marginBottom: 20,
                        overflow: 'hidden'
                    }}>
                        <div style={{
                            width: `${totalSets > 0 ? (doneSets / totalSets) * 100 : 0}%`,
                            height: '100%', background: GRADIENT, borderRadius: 2, transition: 'width 0.3s',
                        }}/>
                    </div>

                    {/* Секции с упражнениями */}
                    {day.sections.map(section => (
                        <div key={section.id}>
                            {section.title && (
                                <Text style={{
                                    fontSize: 13, fontWeight: 700, color: '#667eea',
                                    display: 'block', marginBottom: 8, marginTop: 12,
                                    textTransform: 'uppercase', letterSpacing: 0.5
                                }}>
                                    {section.title}
                                </Text>
                            )}
                            {section.exercises.map(de => (
                                <ExerciseBlock
                                    key={de.id} de={de}
                                    sessionId={activeSession.id}
                                    lastSets={lastSetsMap[de.exercise.id] ?? []}
                                    isMobile={isMobile}
                                />
                            ))}
                        </div>
                    ))}

                    <Button type="primary" block size="large" icon={<TrophyOutlined/>}
                            onClick={() => setConfirmFinish(true)}
                            style={{background: GRADIENT, border: 'none', height: 50, marginTop: 16, fontSize: 15}}>
                        Завершить тренировку
                    </Button>
                </div>
            )}

            <Modal title="Завершить тренировку?" open={confirmFinish}
                   onCancel={() => setConfirmFinish(false)}
                   onOk={handleFinish} okText="Завершить" cancelText="Продолжить"
                   okButtonProps={{loading: finishing, style: {background: GRADIENT, border: 'none'}}}>
                <Text>
                    Выполнено {doneSets} из {totalSets} подходов.
                    Все данные сохранены в трекерах прогресса.
                </Text>
            </Modal>
        </div>
    );
}
