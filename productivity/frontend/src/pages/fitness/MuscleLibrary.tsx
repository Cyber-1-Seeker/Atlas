/**
 * MuscleLibrary — просмотр мышц с подробной информацией.
 */
import {useEffect, useState} from 'react';
import {Select, Typography, Spin, Empty, Modal, Flex, Tag, Divider} from 'antd';
import {useFitnessStore} from '../../store/fitness/fitnessStore.ts';
import type {MuscleGroup} from '../../api/fitness.ts';

const {Text, Title, Paragraph} = Typography;

const REGIONS: { value: string; label: string; emoji: string }[] = [
    {value: '', label: 'Все области', emoji: '🏃'},
    {value: 'chest', label: 'Грудь', emoji: '💪'},
    {value: 'back', label: 'Спина', emoji: '🔙'},
    {value: 'shoulders', label: 'Плечи', emoji: '🏋️'},
    {value: 'arms', label: 'Руки', emoji: '💪'},
    {value: 'legs', label: 'Ноги', emoji: '🦵'},
    {value: 'core', label: 'Пресс/Кор', emoji: '⚡'},
    {value: 'other', label: 'Другое', emoji: '🔩'},
];

const LEVEL_COLOR: Record<string, string> = {high: '#f5222d', medium: '#fa8c16', low: '#52c41a'};

export function MuscleLibrary({
                                  onMuscleClick,
                                  onMusclePageClick,
                              }: {
    onMuscleClick?: (m: MuscleGroup) => void;
    onMusclePageClick?: (id: number) => void;
}) {
    const {muscles, fetchMuscles} = useFitnessStore();
    const [region, setRegion] = useState('');
    const [selected, setSelected] = useState<MuscleGroup | null>(null);

    useEffect(() => {
        fetchMuscles();
    }, []);

    const filtered = region ? muscles.filter(m => m.body_region === region) : muscles;

    const handleClick = (m: MuscleGroup) => {
        if (onMuscleClick) {
            onMuscleClick(m);
            return;
        }
        if (onMusclePageClick) {
            onMusclePageClick(m.id);
            return;
        }  // ← добавить
        setSelected(m);
    };

    return (
        <div>
            {/* Фильтр по области */}
            <Flex gap={6} wrap="wrap" style={{marginBottom: 16}}>
                {REGIONS.map(r => (
                    <button key={r.value} onClick={() => setRegion(r.value)} style={{
                        padding: '6px 14px', borderRadius: 20, border: 'none', cursor: 'pointer',
                        fontSize: 13, fontWeight: 600, transition: 'all 0.15s',
                        background: region === r.value ? 'linear-gradient(135deg,#667eea,#764ba2)' : '#f5f5f5',
                        color: region === r.value ? 'white' : '#595959',
                    }}>
                        {r.emoji} {r.label}
                    </button>
                ))}
            </Flex>

            {/* Сетка мышц */}
            {filtered.length === 0 ? (
                <Empty description="Нет мышц" image={Empty.PRESENTED_IMAGE_SIMPLE}/>
            ) : (
                <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(180px,1fr))', gap: 12}}>
                    {filtered.map(m => (
                        <div key={m.id} onClick={() => handleClick(m)} style={{
                            background: 'white', borderRadius: 14,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.07)',
                            border: '1.5px solid #f0f0f0', cursor: 'pointer',
                            overflow: 'hidden', transition: 'all 0.15s',
                        }}
                             onMouseEnter={e => {
                                 e.currentTarget.style.boxShadow = '0 6px 20px rgba(102,126,234,0.2)';
                                 e.currentTarget.style.borderColor = '#adc6ff';
                             }}
                             onMouseLeave={e => {
                                 e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
                                 e.currentTarget.style.borderColor = '#f0f0f0';
                             }}
                        >
                            {/* Фото или эмодзи */}
                            {m.image_url ? (
                                <img src={m.image_url} alt={m.name}
                                     style={{width: '100%', height: 100, objectFit: 'cover'}}/>
                            ) : (
                                <div style={{
                                    height: 80, background: 'linear-gradient(135deg,#f0f2ff,#e8f4fd)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
                                }}>
                                    {m.emoji || '💪'}
                                </div>
                            )}
                            <div style={{padding: '10px 12px'}}>
                                <Text strong style={{fontSize: 13, display: 'block'}}>{m.name}</Text>
                                <Tag style={{fontSize: 10, marginTop: 4}}>
                                    {REGIONS.find(r => r.value === m.body_region)?.label || m.body_region}
                                </Tag>
                                {m.description && (
                                    <Text type="secondary"
                                          style={{fontSize: 11, display: 'block', marginTop: 4, lineHeight: 1.4}}>
                                        {m.description.slice(0, 60)}{m.description.length > 60 ? '...' : ''}
                                    </Text>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Детальная информация о мышце */}
            <Modal
                open={!!selected}
                onCancel={() => setSelected(null)}
                footer={null}
                width={600}
                title={null}
            >
                {selected && <MuscleDetail muscle={selected}/>}
            </Modal>
        </div>
    );
}

export function MuscleDetail({muscle}: { muscle: MuscleGroup }) {
    const sections = [
        {emoji: '📍', title: 'Что это за мышца', text: muscle.description},
        {emoji: '⚙️', title: 'Функции и движения', text: muscle.functions},
        {emoji: '🏃', title: 'В повседневной жизни', text: muscle.daily_life},
        {emoji: '🏆', title: 'Зачем развивать', text: muscle.benefits},
        {emoji: '🧘', title: 'Осанка и здоровье', text: muscle.posture_role},
    ].filter(s => s.text);

    return (
        <div>
            {/* Шапка */}
            <div style={{
                background: 'linear-gradient(135deg,#667eea,#764ba2)',
                borderRadius: '12px 12px 0 0', margin: '-24px -24px 0',
                padding: '24px', display: 'flex', alignItems: 'center', gap: 16,
            }}>
                {muscle.image_url ? (
                    <img src={muscle.image_url} alt={muscle.name}
                         style={{
                             width: 72,
                             height: 72,
                             borderRadius: 12,
                             objectFit: 'cover',
                             border: '3px solid rgba(255,255,255,0.3)'
                         }}/>
                ) : (
                    <div style={{
                        width: 72, height: 72, borderRadius: 12, background: 'rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36
                    }}>
                        {muscle.emoji || '💪'}
                    </div>
                )}
                <div>
                    <Title level={3} style={{margin: 0, color: 'white'}}>{muscle.name}</Title>
                    <Tag style={{background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', marginTop: 4}}>
                        {REGIONS.find(r => r.value === muscle.body_region)?.emoji} {REGIONS.find(r => r.value === muscle.body_region)?.label}
                    </Tag>
                </div>
            </div>

            <div style={{marginTop: 24}}>
                {sections.length === 0 ? (
                    <Text type="secondary">Информация о мышце ещё не добавлена</Text>
                ) : sections.map((s, i) => (
                    <div key={i}>
                        <Flex align="center" gap={8} style={{marginBottom: 8}}>
                            <span style={{fontSize: 20}}>{s.emoji}</span>
                            <Text strong style={{fontSize: 15}}>{s.title}</Text>
                        </Flex>
                        <Paragraph style={{color: '#434343', lineHeight: 1.7, whiteSpace: 'pre-wrap', marginBottom: 0}}>
                            {s.text}
                        </Paragraph>
                        {i < sections.length - 1 && <Divider style={{margin: '16px 0'}}/>}
                    </div>
                ))}
            </div>
        </div>
    );
}
