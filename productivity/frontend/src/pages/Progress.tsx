import {useState} from 'react';
import {
    Button, Empty, Flex, Form, Input, Modal,
    Typography, AutoComplete, Select, Popconfirm, Tooltip,
} from 'antd';
import {PlusOutlined, HolderOutlined, FolderOutlined} from '@ant-design/icons';
import {
    DndContext, closestCenter, KeyboardSensor,
    PointerSensor, useSensor, useSensors, type DragEndEvent,
} from '@dnd-kit/core';
import {
    SortableContext, sortableKeyboardCoordinates,
    useSortable, verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';
import {useProgressStore} from '../store/progress/progressStore.ts';
import {ProgressCard} from '../components/progress/ProgressCard.tsx';
import {StrengthCard} from '../components/progress/StrengthCard.tsx';
import {RunningCard} from "../components/progress/RunningCard.tsx";
import type {ProgressUnit, ProgressTracker, TrackerKind} from '../types/progress/progress.ts';
import {useBreakpoint} from '../hooks/useBreakpoint.ts';

const {Title, Text} = Typography;
const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

const UNIT_OPTIONS = [
    {value: 'кг', label: 'кг'}, {value: 'км', label: 'км'}, {value: 'мин', label: 'мин'},
    {value: 'з/мин', label: 'з/мин'}, {value: 'раз', label: 'раз'}, {value: 'сек', label: 'сек'},
    {value: 'м', label: 'м'}, {value: 'см', label: 'см'}, {value: '%', label: '%'},
];

interface SortableCardProps {
    id: string;
    children: React.ReactNode;
}

function SortableCard({id, children}: SortableCardProps) {
    const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id});
    return (
        <div ref={setNodeRef} style={{
            transform: CSS.Transform.toString(transform),
            transition, opacity: isDragging ? 0.5 : 1, position: 'relative',
        }}>
            <div {...attributes} {...listeners} style={{
                position: 'absolute', top: 10, right: 10, cursor: 'grab', zIndex: 10,
                padding: 6, borderRadius: 6, background: 'rgba(0,0,0,0.05)',
            }}>
                <HolderOutlined style={{fontSize: 14, color: '#8c8c8c'}}/>
            </div>
            {children}
        </div>
    );
}

export function Progress() {
    const {isMobile} = useBreakpoint();
    const {
        trackers, categories, addTracker, removeTracker,
        reorderTrackers, moveTrackerToCategory,
        addCategory, removeCategory, updateCategory,
    } = useProgressStore();

    const savedFilter = localStorage.getItem('progress-filter');
    const [activeFilter, setActiveFilterRaw] = useState<string | 'none' | undefined>(() => {
        if (savedFilter === null || savedFilter === '__all__') return undefined;
        if (categories.some(c => c.id === savedFilter) || savedFilter === 'none') return savedFilter;
        return undefined;
    });

    const setActiveFilter = (val: string | 'none' | undefined) => {
        setActiveFilterRaw(val);
        localStorage.setItem('progress-filter', val ?? '__all__');
    };

    const [trackerModal, setTrackerModal] = useState(false);
    const [newName, setNewName] = useState('');
    const [newUnit, setNewUnit] = useState('');
    const [newCatId, setNewCatId] = useState<string | undefined>();
    const [newKind, setNewKind] = useState<TrackerKind>('standard');
    const [catModal, setCatModal] = useState<{ open: boolean; id: string | null; name: string }>({
        open: false,
        id: null,
        name: ''
    });
    const [moveModal, setMoveModal] = useState<{ open: boolean; trackerId: string | null }>({
        open: false,
        trackerId: null
    });
    const [moveToCatId, setMoveToCatId] = useState<string | undefined>();

    const sensors = useSensors(
        useSensor(PointerSensor),
        useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates})
    );

    const filteredTrackers: ProgressTracker[] = (() => {
        if (activeFilter === undefined) return trackers;
        if (activeFilter === 'none') return trackers.filter(t => !t.categoryId);
        return trackers.filter(t => t.categoryId === activeFilter);
    })();
    const uncatCount = trackers.filter(t => !t.categoryId).length;

    const handleAddTracker = () => {
        if (!newName.trim()) return;
        addTracker(newName.trim(), newUnit as ProgressUnit, newCatId, newKind);
        setNewName('');
        setNewUnit('');
        setNewCatId(undefined);
        setNewKind('standard');
        setTrackerModal(false);
    };
    const handleDragEnd = (e: DragEndEvent) => {
        const {active, over} = e;
        if (!over || active.id === over.id) return;
        const oi = trackers.findIndex(t => t.id === active.id);
        const ni = trackers.findIndex(t => t.id === over.id);
        if (oi !== -1 && ni !== -1) reorderTrackers(oi, ni);
    };
    const handleSaveCat = () => {
        if (!catModal.name.trim()) return;
        if (catModal.id) updateCategory(catModal.id, catModal.name.trim());
        else addCategory(catModal.name.trim());
        setCatModal({open: false, id: null, name: ''});
    };

    const renderGrid = (list: ProgressTracker[]) => (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={list.map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div className="progress-grid"
                     style={{
                         display: 'grid',
                         // Мобиле: 2 колонки; десктоп: авто
                         gridTemplateColumns: isMobile
                             ? 'repeat(2, 1fr)'
                             : 'repeat(2, 1fr)',
                         gap: isMobile ? 8 : 24,
                     }}>
                    {list.map(tracker => (
                        <SortableCard key={tracker.id} id={tracker.id}>
                            <Tooltip title="Переместить в категорию">
                                <Button type="text" size="small" icon={<FolderOutlined/>}
                                        style={{
                                            position: 'absolute', top: 10,
                                            right: isMobile ? 32 : 52,
                                            zIndex: 10, opacity: 0.5,
                                            padding: '2px 4px',
                                        }}
                                        onClick={() => {
                                            setMoveToCatId(tracker.categoryId);
                                            setMoveModal({open: true, trackerId: tracker.id});
                                        }}/>
                            </Tooltip>
                            {tracker.kind === 'strength'
                                ? <StrengthCard tracker={tracker} onDelete={() => removeTracker(tracker.id)}/>
                                : tracker.kind === 'running'
                                    ? <RunningCard tracker={tracker} onDelete={() => removeTracker(tracker.id)}/>
                                    : <ProgressCard tracker={tracker} onDelete={() => removeTracker(tracker.id)}/>
                            }
                        </SortableCard>
                    ))}
                </div>
            </SortableContext>
        </DndContext>
    );

    return (
        <div style={{
            maxWidth: 1200, margin: '0 auto',
            // На мобиле: отступы по бокам
            padding: isMobile ? '0 12px' : 0,
        }}>

            {/* Заголовок */}
            <div className="progress-page-root" style={{maxWidth: 1200, margin: '0 auto'}}>
                <Flex justify="space-between" align="center"
                      style={{marginBottom: isMobile ? 10 : 20}} wrap="wrap" gap={8}>
                    <div>
                        <Title level={isMobile ? 4 : 2} style={{margin: 0, color: '#434343'}}>Прогресс</Title>
                        {!isMobile && (
                            <Text type="secondary" style={{fontSize: 14}}>
                                Записывайте рекорды и отслеживайте рост
                            </Text>
                        )}
                    </div>
                    <Flex gap={6}>
                        <Button icon={<FolderOutlined/>} size={isMobile ? 'small' : 'middle'}
                                onClick={() => setCatModal({open: true, id: null, name: ''})}>
                            {isMobile ? '+Кат.' : 'Новая категория'}
                        </Button>
                        <Button type="primary" icon={<PlusOutlined/>} size={isMobile ? 'small' : 'large'}
                                onClick={() => {
                                    setNewCatId(undefined);
                                    setTrackerModal(true);
                                }}
                                style={{background: GRADIENT, border: 'none'}}>
                            {isMobile ? 'Трекер' : 'Новый трекер'}
                        </Button>
                    </Flex>
                </Flex>
            </div>

            {/* Фильтр — горизонтальный скролл на мобиле */}
            {trackers.length > 0 && (categories.length > 0 || uncatCount > 0) && (
                <div style={{
                    background: 'white',
                    borderRadius: isMobile ? 12 : 14,
                    padding: isMobile ? '8px 10px' : '10px 14px',
                    marginBottom: isMobile ? 10 : 20,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                    display: 'flex', gap: 6, alignItems: 'center',
                    overflowX: 'auto',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                }}>
                    <button onClick={() => setActiveFilter(undefined)} style={{
                        padding: isMobile ? '4px 10px' : '5px 14px',
                        borderRadius: 20, border: 'none', cursor: 'pointer',
                        fontSize: isMobile ? 11 : 12, fontWeight: 600, whiteSpace: 'nowrap',
                        background: activeFilter === undefined ? GRADIENT : '#f5f5f5',
                        color: activeFilter === undefined ? 'white' : '#595959',
                        flexShrink: 0,
                    }}>
                        Все ({trackers.length})
                    </button>
                    {categories.map(cat => {
                        const cnt = trackers.filter(t => t.categoryId === cat.id).length;
                        const isA = activeFilter === cat.id;
                        return (
                            <div key={cat.id} style={{
                                display: 'flex',
                                alignItems: 'stretch',
                                borderRadius: 20,
                                overflow: 'hidden',
                                flexShrink: 0
                            }}>
                                <button onClick={() => setActiveFilter(isA ? undefined : cat.id)} style={{
                                    padding: isMobile ? '4px 10px' : '5px 12px', border: 'none',
                                    cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontWeight: 600,
                                    background: isA ? cat.color : '#f5f5f5', color: isA ? 'white' : '#595959',
                                    display: 'flex', alignItems: 'center', gap: 5, whiteSpace: 'nowrap',
                                }}>
                                    <span style={{
                                        width: 6, height: 6, borderRadius: '50%',
                                        background: isA ? 'rgba(255,255,255,0.8)' : cat.color,
                                        display: 'inline-block', flexShrink: 0
                                    }}/>
                                    {cat.name} ({cnt})
                                </button>
                                <button onClick={() => setCatModal({open: true, id: cat.id, name: cat.name})} style={{
                                    padding: '4px 6px', border: 'none', cursor: 'pointer', fontSize: 11,
                                    background: isA ? cat.color : '#ebebeb',
                                    color: isA ? 'rgba(255,255,255,0.85)' : '#8c8c8c',
                                    borderLeft: '1px solid rgba(0,0,0,0.08)',
                                }}>✏️
                                </button>
                                <Popconfirm
                                    title="Удалить категорию?"
                                    description="Трекеры останутся"
                                    onConfirm={() => {
                                        removeCategory(cat.id);
                                        if (activeFilter === cat.id) setActiveFilter(undefined);
                                    }}
                                    okText="Удалить" cancelText="Отмена" okButtonProps={{danger: true}}>
                                    <button style={{
                                        padding: '4px 6px', border: 'none', cursor: 'pointer', fontSize: 11,
                                        background: isA ? cat.color : '#ebebeb',
                                        color: isA ? 'rgba(255,255,255,0.85)' : '#f5222d',
                                        borderLeft: '1px solid rgba(0,0,0,0.08)',
                                    }}>✕
                                    </button>
                                </Popconfirm>
                            </div>
                        );
                    })}
                    {uncatCount > 0 && categories.length > 0 && (
                        <button onClick={() => setActiveFilter(activeFilter === 'none' ? undefined : 'none')} style={{
                            padding: isMobile ? '4px 10px' : '5px 14px', borderRadius: 20, flexShrink: 0,
                            border: `1.5px dashed ${activeFilter === 'none' ? '#667eea' : '#d9d9d9'}`,
                            cursor: 'pointer', fontSize: isMobile ? 11 : 12, fontWeight: 600,
                            background: 'transparent', color: activeFilter === 'none' ? '#667eea' : '#8c8c8c',
                            whiteSpace: 'nowrap',
                        }}>
                            Без кат. ({uncatCount})
                        </button>
                    )}
                </div>
            )}

            {/* Трекеры */}
            {trackers.length === 0 ? (
                <div style={{
                    background: 'white', borderRadius: 16, padding: '48px 24px',
                    textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                    <Empty description={<div><Text>Нет трекеров</Text><br/>
                        <Text type="secondary" style={{fontSize: 12}}>Создайте первый трекер</Text>
                    </div>} image={Empty.PRESENTED_IMAGE_SIMPLE}>
                        <Button type="primary" icon={<PlusOutlined/>}
                                onClick={() => setTrackerModal(true)}
                                style={{background: GRADIENT, border: 'none'}}>
                            Создать трекер
                        </Button>
                    </Empty>
                </div>
            ) : filteredTrackers.length === 0 ? (
                <div style={{
                    background: 'white', borderRadius: 16, padding: '40px 24px',
                    textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}>
                    <Empty description="Нет трекеров в этой категории"
                           image={Empty.PRESENTED_IMAGE_SIMPLE}>
                        <Button icon={<PlusOutlined/>}
                                onClick={() => {
                                    setNewCatId(activeFilter !== 'none' && activeFilter !== undefined ? activeFilter : undefined);
                                    setTrackerModal(true);
                                }}>
                            Добавить сюда
                        </Button>
                    </Empty>
                </div>
            ) : renderGrid(filteredTrackers)}

            {/* Модалки */}
            <Modal title="Новый трекер" open={trackerModal} onOk={handleAddTracker}
                   onCancel={() => {
                       setTrackerModal(false);
                       setNewName('');
                       setNewUnit('');
                       setNewCatId(undefined);
                       setNewKind('standard');
                   }}
                   okText="Создать" cancelText="Отмена"
                   okButtonProps={{disabled: !newName.trim(), style: {background: GRADIENT, border: 'none'}}}>
                <Form layout="vertical" style={{marginTop: 16}}>
                    <Form.Item label="Название" required>
                        <Input placeholder="Жим лёжа, Скорость печати..."
                               value={newName} onChange={e => setNewName(e.target.value)}
                               onPressEnter={handleAddTracker} autoFocus size="large" maxLength={50}/>
                    </Form.Item>
                    <Form.Item label="Тип трекера">
                        <Select value={newKind} onChange={(v: TrackerKind) => setNewKind(v)} size="large"
                                options={[
                                    {value: 'standard', label: '📈 Обычный'},
                                    {value: 'strength', label: '🏋️ Силовой (вес × повторения)'},
                                    {value: 'running', label: '🏃‍♂️️ Бег (расстояние × время)'},
                                ]}/>
                    </Form.Item>
                    {newKind === 'standard' && (
                        <Form.Item label="Единица измерения">
                            <AutoComplete value={newUnit} onChange={setNewUnit} options={UNIT_OPTIONS}
                                          size="large" placeholder="кг, мин, раз..."
                                          filterOption={(i, o) => (o?.value ?? '').toLowerCase().includes(i.toLowerCase())}/>
                        </Form.Item>
                    )}
                    {categories.length > 0 && (
                        <Form.Item label="Категория (необязательно)">
                            <Select value={newCatId} onChange={setNewCatId} size="large"
                                    allowClear placeholder="Без категории"
                                    options={categories.map(c => ({value: c.id, label: c.name}))}/>
                        </Form.Item>
                    )}
                </Form>
            </Modal>

            <Modal title={catModal.id ? 'Редактировать категорию' : 'Новая категория'}
                   open={catModal.open} onOk={handleSaveCat}
                   onCancel={() => setCatModal({open: false, id: null, name: ''})}
                   okText="Сохранить" cancelText="Отмена"
                   okButtonProps={{disabled: !catModal.name.trim(), style: {background: GRADIENT, border: 'none'}}}>
                <Form layout="vertical" style={{marginTop: 16}}>
                    <Form.Item label="Название" required>
                        <Input placeholder="Спорт, Работа, Здоровье"
                               value={catModal.name}
                               onChange={e => setCatModal(m => ({...m, name: e.target.value}))}
                               onPressEnter={handleSaveCat} autoFocus size="large" maxLength={50}/>
                    </Form.Item>
                </Form>
            </Modal>

            <Modal title="Переместить трекер"
                   open={moveModal.open}
                   onOk={() => {
                       if (moveModal.trackerId) moveTrackerToCategory(moveModal.trackerId, moveToCatId);
                       setMoveModal({open: false, trackerId: null});
                   }}
                   onCancel={() => setMoveModal({open: false, trackerId: null})}
                   okText="Переместить" cancelText="Отмена"
                   okButtonProps={{style: {background: GRADIENT, border: 'none'}}}>
                <Form layout="vertical" style={{marginTop: 16}}>
                    <Form.Item label="Категория">
                        <Select value={moveToCatId} onChange={setMoveToCatId} size="large"
                                allowClear placeholder="Без категории"
                                options={categories.map(c => ({value: c.id, label: c.name}))}/>
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}
