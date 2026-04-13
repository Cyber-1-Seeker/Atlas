import {useEffect, useState} from 'react';
import {Input, Select, Tag, Typography, Spin, Modal, Flex, Empty, Divider, Button} from 'antd';
import {SearchOutlined, PlayCircleOutlined, InfoCircleOutlined} from '@ant-design/icons';
import {useFitnessStore} from '../../store/fitness/fitnessStore.ts';
import {MuscleDetail} from './MuscleLibrary.tsx';
import type {Exercise, MuscleGroup} from '../../api/fitness.ts';

const {Text, Title, Paragraph} = Typography;

const INTENSITY_LABEL: Record<number, string> = {1: 'Немного', 2: 'Средне', 3: 'Сильно', 4: 'Очень сильно'};
const INTENSITY_COLOR: Record<number, string> = {1: '#52c41a', 2: '#1677ff', 3: '#fa8c16', 4: '#f5222d'};
const INTENSITY_BAR: Record<number, number> = {1: 25, 2: 50, 3: 75, 4: 100};

const CATEGORIES = [
    {value: '', label: 'Все группы'}, {value: 'chest', label: 'Грудь'},
    {value: 'back', label: 'Спина'}, {value: 'shoulders', label: 'Плечи'},
    {value: 'arms', label: 'Руки'}, {value: 'legs', label: 'Ноги'},
    {value: 'core', label: 'Пресс/Кор'}, {value: 'cardio', label: 'Кардио'},
];
const EQUIPMENT = [
    {value: '', label: 'Любое оборудование'}, {value: 'barbell', label: 'Штанга'},
    {value: 'dumbbell', label: 'Гантели'}, {value: 'machine', label: 'Тренажёр'},
    {value: 'cable', label: 'Блок'}, {value: 'bodyweight', label: 'Без оборудования'},
];

interface Props {
    onSelect?: (ex: Exercise) => void;
    selectable?: boolean;
    onExercisePageClick?: (id: number) => void;
}

export function ExerciseLibrary({onSelect, selectable = false, onExercisePageClick}: Props) {
    const {exercises, muscles, isLoading, fetchExercises, fetchMuscles} = useFitnessStore();
    const [q, setQ] = useState('');
    const [category, setCategory] = useState('');
    const [equipment, setEquipment] = useState('');
    const [muscle, setMuscle] = useState('');
    const [detail, setDetail] = useState<Exercise | null>(null);
    const [muscleInfo, setMuscleInfo] = useState<MuscleGroup | null>(null);

    useEffect(() => {
        fetchMuscles();
    }, []);
    useEffect(() => {
        const p: Record<string, string> = {};
        if (q) p.q = q;
        if (category) p.category = category;
        if (equipment) p.equipment = equipment;
        if (muscle) p.muscle = muscle;
        const t = setTimeout(() => fetchExercises(Object.keys(p).length ? p : undefined), 300);
        return () => clearTimeout(t);
    }, [q, category, equipment, muscle]);

    const muscleOptions = [{value: '', label: 'Любая мышца'}, ...muscles.map(m => ({value: m.key, label: m.name}))];

    return (
        <div>
            <Flex gap={8} wrap="wrap" style={{marginBottom: 16}}>
                <Input prefix={<SearchOutlined/>} placeholder="Поиск..."
                       value={q} onChange={e => setQ(e.target.value)}
                       style={{flex: '1 1 160px', minWidth: 140}} allowClear/>
                <Select options={CATEGORIES} value={category} onChange={setCategory} style={{minWidth: 130}}/>
                <Select options={muscleOptions} value={muscle} onChange={setMuscle} style={{minWidth: 130}}/>
                <Select options={EQUIPMENT} value={equipment} onChange={setEquipment} style={{minWidth: 150}}/>
            </Flex>

            {isLoading ? <div style={{textAlign: 'center', padding: '40px 0'}}><Spin/></div>
                : exercises.length === 0 ? <Empty description="Нет упражнений" image={Empty.PRESENTED_IMAGE_SIMPLE}/>
                    : (
                        <div style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fill,minmax(210px,1fr))',
                            gap: 12
                        }}>
                            {exercises.map(ex => (
                                <div key={ex.id} onClick={() => {
                                    if (selectable && onSelect) {
                                        onSelect(ex);
                                        return;
                                    }
                                    if (onExercisePageClick) {
                                        onExercisePageClick(ex.id);
                                        return;
                                    }
                                    setDetail(ex);  // fallback — модалка если нет onExercisePageClick
                                }}
                                     style={{
                                         background: 'white',
                                         borderRadius: 12,
                                         boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                                         border: '1.5px solid #f0f0f0',
                                         cursor: 'pointer',
                                         overflow: 'hidden',
                                         transition: 'all 0.15s'
                                     }}
                                     onMouseEnter={e => {
                                         e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.2)';
                                         e.currentTarget.style.borderColor = '#adc6ff';
                                     }}
                                     onMouseLeave={e => {
                                         e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
                                         e.currentTarget.style.borderColor = '#f0f0f0';
                                     }}>
                                    {ex.image_url ? (
                                        <img src={ex.image_url} alt={ex.name}
                                             style={{width: '100%', height: 110, objectFit: 'cover'}}/>
                                    ) : (
                                        <div style={{
                                            height: 80,
                                            background: 'linear-gradient(135deg,#f0f2ff,#e8f4fd)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontSize: 32
                                        }}>
                                            {ex.emoji || '🏋️'}
                                        </div>
                                    )}
                                    <div style={{padding: '10px 12px'}}>
                                        <Text strong
                                              style={{fontSize: 13, display: 'block', marginBottom: 4}}>{ex.name}</Text>
                                        <Flex gap={4} wrap="wrap" style={{marginBottom: 6}}>
                                            {ex.primary_muscle && (
                                                <Tag color="blue"
                                                     style={{fontSize: 10}}>{ex.primary_muscle.muscle.name}</Tag>
                                            )}
                                            <Tag
                                                style={{fontSize: 10}}>{EQUIPMENT.find(e => e.value === ex.equipment)?.label || ex.equipment}</Tag>
                                        </Flex>
                                        <Text type="secondary" style={{fontSize: 11, lineHeight: 1.4}}>
                                            {ex.description?.slice(0, 70)}{ex.description?.length > 70 ? '...' : ''}
                                        </Text>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

            {/*/!* Детальное окно упражнения *!/*/}
            {/*<Modal open={!!detail} onCancel={() => setDetail(null)} footer={*/}
            {/*    selectable && onSelect && detail ? [*/}
            {/*        <Button key="add" type="primary" onClick={() => {*/}
            {/*            onSelect!(detail);*/}
            {/*            setDetail(null);*/}
            {/*        }}*/}
            {/*                style={{background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none'}}>*/}
            {/*            Добавить в тренировку*/}
            {/*        </Button>*/}
            {/*    ] : null*/}
            {/*} width={680} title={null} styles={{body: {padding: 0}}}>*/}
            {/*    {detail && <ExerciseDetail ex={detail} onMuscleClick={m => {*/}
            {/*        setDetail(null);*/}
            {/*        setMuscleInfo(m);*/}
            {/*    }}/>}*/}
            {/*</Modal>*/}

            {/* Инфо о мышце */}
            <Modal open={!!muscleInfo} onCancel={() => setMuscleInfo(null)} footer={null} width={600} title={null}
                   styles={{body: {padding: 0}}}>
                {muscleInfo && <MuscleDetail muscle={muscleInfo}/>}
            </Modal>
        </div>
    );
}

export function ExerciseDetail({ex, onMuscleClick}: { ex: Exercise; onMuscleClick?: (m: MuscleGroup) => void }) {
    const sections = [
        {emoji: '📝', title: 'Описание', text: ex.description},
        {emoji: '⚙️', title: 'Техника выполнения', text: ex.how_to},
        {emoji: '🏆', title: 'Польза', text: ex.benefits},
        {emoji: '💡', title: 'Советы', text: ex.tips},
        {emoji: '⚠️', title: 'Частые ошибки', text: ex.common_mistakes},
    ].filter(s => s.text);

    return (
        <div>
            {/* Шапка */}
            <div style={{
                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                borderRadius: '8px 8px 0 0', padding: '20px 24px',
                display: 'flex', alignItems: 'center', gap: 16,
            }}>
                {ex.image_url ? (
                    <img src={ex.image_url} alt={ex.name}
                         style={{
                             width: 80,
                             height: 80,
                             borderRadius: 12,
                             objectFit: 'cover',
                             border: '3px solid rgba(255,255,255,0.3)'
                         }}/>
                ) : (
                    <div style={{
                        width: 80, height: 80, borderRadius: 12, background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40
                    }}>
                        {ex.emoji || '🏋️'}
                    </div>
                )}
                <div>
                    <Title level={3} style={{margin: 0, color: 'white'}}>{ex.name}</Title>
                    <Flex gap={6} style={{marginTop: 6}} wrap="wrap">
                        <Tag
                            style={{background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 11}}>
                            {CATEGORIES.find(c => c.value === ex.category)?.label || ex.category}
                        </Tag>
                        <Tag
                            style={{background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', fontSize: 11}}>
                            {EQUIPMENT.find(e => e.value === ex.equipment)?.label || ex.equipment}
                        </Tag>
                    </Flex>
                </div>
            </div>

            <div style={{padding: '20px 24px'}}>
                {/* Задействованные мышцы */}
                {ex.muscles?.length > 0 && (
                    <div style={{marginBottom: 20}}>
                        <Text strong style={{fontSize: 14, display: 'block', marginBottom: 10}}>
                            💪 Задействованные мышцы
                        </Text>
                        <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                            {ex.muscles.map(em => (
                                <div key={em.id}
                                     onClick={() => onMuscleClick && onMuscleClick(em.muscle)}
                                     style={{
                                         background: '#fafafa', borderRadius: 10, padding: '8px 12px',
                                         border: '1.5px solid #f0f0f0', cursor: onMuscleClick ? 'pointer' : 'default',
                                         transition: 'all 0.15s',
                                     }}
                                     onMouseEnter={e => {
                                         if (onMuscleClick) {
                                             e.currentTarget.style.borderColor = '#adc6ff';
                                             e.currentTarget.style.background = '#f0f2ff';
                                         }
                                     }}
                                     onMouseLeave={e => {
                                         e.currentTarget.style.borderColor = '#f0f0f0';
                                         e.currentTarget.style.background = '#fafafa';
                                     }}>
                                    <Flex align="center" gap={8}>
                                        <div style={{
                                            width: 8,
                                            height: 8,
                                            borderRadius: '50%',
                                            background: INTENSITY_COLOR[em.intensity],
                                            flexShrink: 0
                                        }}/>
                                        <div>
                                            <Text style={{
                                                fontSize: 12,
                                                fontWeight: 600,
                                                display: 'block'
                                            }}>{em.muscle.name}</Text>
                                            <div style={{
                                                height: 3,
                                                background: '#f0f0f0',
                                                borderRadius: 2,
                                                width: 80,
                                                overflow: 'hidden',
                                                marginTop: 3
                                            }}>
                                                <div style={{
                                                    width: `${INTENSITY_BAR[em.intensity]}%`,
                                                    height: '100%',
                                                    background: INTENSITY_COLOR[em.intensity],
                                                    borderRadius: 2
                                                }}/>
                                            </div>
                                            <Text type="secondary"
                                                  style={{fontSize: 10}}>{INTENSITY_LABEL[em.intensity]}</Text>
                                        </div>
                                        {onMuscleClick &&
                                            <InfoCircleOutlined style={{fontSize: 11, color: '#8c8c8c'}}/>}
                                    </Flex>
                                </div>
                            ))}
                        </div>
                        <Divider style={{margin: '16px 0'}}/>
                    </div>
                )}

                {/* Гиф если есть */}
                {ex.gif_url && (
                    <div style={{marginBottom: 20, textAlign: 'center'}}>
                        <img src={ex.gif_url} alt="gif" style={{maxWidth: '100%', borderRadius: 10, maxHeight: 240}}/>
                    </div>
                )}

                {/* Текстовые секции */}
                {sections.map((s, i) => (
                    <div key={i}>
                        <Flex align="center" gap={8} style={{marginBottom: 8}}>
                            <span style={{fontSize: 18}}>{s.emoji}</span>
                            <Text strong style={{fontSize: 14}}>{s.title}</Text>
                        </Flex>
                        <Paragraph style={{color: '#434343', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginLeft: 26}}>
                            {s.text}
                        </Paragraph>
                        {i < sections.length - 1 && <Divider style={{margin: '14px 0'}}/>}
                    </div>
                ))}

                {/* Ссылки */}
                {(ex.video_url || ex.extra_links?.length > 0) && (
                    <>
                        <Divider style={{margin: '14px 0'}}/>
                        <Text strong style={{fontSize: 14, display: 'block', marginBottom: 8}}>🔗 Ссылки</Text>
                        {ex.video_url && (
                            <a href={ex.video_url} target="_blank" rel="noreferrer"
                               style={{
                                   display: 'flex',
                                   alignItems: 'center',
                                   gap: 6,
                                   color: '#667eea',
                                   marginBottom: 6
                               }}>
                                <PlayCircleOutlined/> Смотреть видео
                            </a>
                        )}
                        {ex.extra_links?.map((l, i) => (
                            <a key={i} href={l.url} target="_blank" rel="noreferrer"
                               style={{display: 'block', color: '#667eea', marginBottom: 4}}>
                                🔗 {l.title}
                            </a>
                        ))}
                    </>
                )}
            </div>
        </div>
    );
}
