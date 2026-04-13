/**
 * BottomToolbar — горизонтальная панель инструментов внизу холста.
 * На мобиле — компактная, иконки без подписей.
 */
import {useState} from 'react';
import {Tooltip, Popover, Button, Typography, Divider, Empty} from 'antd';
import {
    StickyNote, Type, Square, Circle, Diamond,
    Plus, Save, Undo, ZoomIn, ZoomOut, Maximize,
    Table2,
} from 'lucide-react';
import {useGoalStore} from '../../store/twelveWeeks/goalStore.ts';
import {useProgressStore} from '../../store/progress/progressStore.ts';
import {useWheelStore} from '../../store/lifeWheel/lifeWheelStore.ts';

const {Text} = Typography;

// const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

interface Props {
    onAdd: (type: string, data?: Record<string, unknown>) => void;
    onSave: () => void;
    onUndo: () => void;
    onZoom: (dir: 'in' | 'out' | 'fit') => void;
    isSaving: boolean;
    lastSaved: Date | null;
    isMobile: boolean;
}

export function BottomToolbar({onAdd, onSave, onUndo, onZoom, isSaving, lastSaved, isMobile}: Props) {
    const {goals} = useGoalStore();
    const {trackers} = useProgressStore();
    const {segments} = useWheelStore();
    const [dataOpen, setDataOpen] = useState(false);

    const fmtSaved = lastSaved
        ? `${lastSaved.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`
        : '—';

    const DataContent = () => (
        <div style={{
            width: 240,
            maxHeight: isMobile ? '85vh' : 360,  // ограничение высоты
            overflowY: 'auto',
            marginTop: isMobile ? 20 : 0,        // смещаем чуть ниже верхнего края
        }}>
            <Text strong style={{display: 'block', marginBottom: 8, fontSize: 12}}>Виджеты данных</Text>
            {goals.length > 0 && <>
                <Text type="secondary" style={{fontSize: 11, display: 'block', marginBottom: 4}}>🏆 Цели</Text>
                {goals.slice(0, 6).map(g => (
                    <Button key={g.id} type="text" block size="small"
                            style={{textAlign: 'left', height: 'auto', padding: '4px 8px', marginBottom: 2}}
                            onClick={() => {
                                onAdd('goal', {goalId: g.id});
                                setDataOpen(false);
                            }}>
                        <Text style={{fontSize: 12}} ellipsis>{g.text}</Text>
                    </Button>
                ))}
                <Divider style={{margin: '6px 0'}}/>
            </>}
            {trackers.length > 0 && <>
                <Text type="secondary" style={{fontSize: 11, display: 'block', marginBottom: 4}}>📈 Трекеры</Text>
                {trackers.slice(0, 6).map(t => (
                    <Button key={t.id} type="text" block size="small"
                            style={{textAlign: 'left', height: 'auto', padding: '4px 8px', marginBottom: 2}}
                            onClick={() => {
                                onAdd('tracker', {trackerId: t.id});
                                setDataOpen(false);
                            }}>
                        <span style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: t.color,
                            marginRight: 6
                        }}/>
                        <Text style={{fontSize: 12}}>{t.name}</Text>
                    </Button>
                ))}
                <Divider style={{margin: '6px 0'}}/>
            </>}
            {segments.length > 0 && <>
                <Text type="secondary" style={{fontSize: 11, display: 'block', marginBottom: 4}}>⭕ Жизненный круг</Text>
                {segments.map(s => (
                    <Button key={s.id} type="text" block size="small"
                            style={{textAlign: 'left', height: 'auto', padding: '4px 8px', marginBottom: 2}}
                            onClick={() => {
                                onAdd('wheelSegment', {segmentId: s.id});
                                setDataOpen(false);
                            }}>
                        <span style={{
                            display: 'inline-block',
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: s.color,
                            marginRight: 6
                        }}/>
                        <Text style={{fontSize: 12}}>{s.name} — {s.score}/10</Text>
                    </Button>
                ))}
            </>}
            {goals.length === 0 && trackers.length === 0 && segments.length === 0 && (
                <Empty description="Нет данных" image={Empty.PRESENTED_IMAGE_SIMPLE}/>
            )}
        </div>
    );

    const btn = (title: string, icon: React.ReactNode, onClick: () => void, active = false) => (
        <Tooltip key={title} title={isMobile ? undefined : title} placement="top">
            <button onClick={onClick} style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                gap: 2, padding: isMobile ? '6px 10px' : '6px 12px',
                border: 'none', background: active ? 'rgba(102,126,234,0.12)' : 'transparent',
                borderRadius: 10, cursor: 'pointer',
                color: active ? '#667eea' : '#434343',
                transition: 'all 0.15s', flexShrink: 0,
            }}
                    onMouseEnter={e => {
                        if (!active) e.currentTarget.style.background = '#f0f2ff';
                    }}
                    onMouseLeave={e => {
                        if (!active) e.currentTarget.style.background = 'transparent';
                    }}
            >
                {icon}
                {!isMobile && <span style={{fontSize: 9, color: '#8c8c8c', lineHeight: 1}}>{title}</span>}
            </button>
        </Tooltip>
    );

    const sep = () => <div style={{width: 1, height: 30, background: '#e8e8e8', flexShrink: 0}}/>;

    return (
        <div style={{
            position: 'absolute',
            left: isMobile ? 16 : '50%',
            top: isMobile ? '45%' : undefined,
            bottom: isMobile ? undefined : 16,
            transform: isMobile ? 'translateY(-50%)' : 'translateX(-50%)',
            zIndex: 10,
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 4px 24px rgba(0,0,0,0.14)',
            padding: isMobile ? '10px 8px' : '6px 8px',
            display: 'flex',
            flexDirection: isMobile ? 'column' : 'row',
            alignItems: 'center',
            gap: isMobile ? 0 : 2,
            maxWidth: isMobile ? 'auto' : 'calc(100vw - 32px)',
            maxHeight: isMobile ? '80vh' : 'auto',
            overflowX: isMobile ? 'visible' : 'auto',
            overflowY: isMobile ? 'auto' : 'visible',
        }}>
            {/* Базовые элементы */}
            {btn('Стикер', <StickyNote size={18}/>, () => onAdd('sticky', {text: '', color: '#fef08a'}))}
            {btn('Текст', <Type size={18}/>, () => onAdd('text', {
                text: '',
                fontSize: 14,
                bold: false,
                color: '#1a1a1a'
            }))}
            {btn('Rect', <Square size={18}/>, () => onAdd('shape', {
                shape: 'rect',
                color: '#667eea',
                label: '',
                w: 140,
                h: 90
            }))}
            {btn('Круг', <Circle size={18}/>, () => onAdd('shape', {
                shape: 'circle',
                color: '#52c41a',
                label: '',
                w: 100,
                h: 100
            }))}
            {btn('Ромб', <Diamond size={18}/>, () => onAdd('shape', {
                shape: 'diamond',
                color: '#fa8c16',
                label: '',
                w: 120,
                h: 100
            }))}
            {btn('Таблица', <Table2 size={18}/>,
                () => onAdd('table', {
                    title: 'Таблица',
                    headers: ['Столбец 1', 'Столбец 2'],
                    rows: [{id: 'r0', cells: ['', '']}],
                    color: '#667eea',
                    sortCol: null,
                    sortDir: 'asc'
                })
            )}

            {sep()}

            {/* Данные */}
            <Popover content={<DataContent/>} title
                ={null} trigger="click" open={dataOpen} onOpenChange={
                setDataOpen
            } placement="top">
                {
                    btn('Данные', <Plus size={18}/>, () => setDataOpen(v => !v), dataOpen)
                }
            </Popover>

            {sep()}

            {/* Управление */}
            {btn('Zoom +', <ZoomIn size={18}/>, () => onZoom('in'))}
            {btn('Zoom −', <ZoomOut size={18}/>, () => onZoom('out'))}
            {btn('Уместить', <Maximize size={18}/>, () => onZoom('fit'))}
            {btn('Отменить', <Undo size={18}/>, onUndo)}

            {sep()}

            {/* Сохранить */}
            <Tooltip title={isSaving ? 'Сохранение...' : `Сохранено ${fmtSaved}`} placement="top">
                <button onClick={onSave} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                    gap: 2, padding: isMobile ? '6px 10px' : '6px 12px',
                    border: 'none', background: isSaving ? '#f0f0ff' : 'transparent',
                    borderRadius: 10, cursor: 'pointer',
                    color: isSaving ? '#667eea' : '#52c41a', transition: 'all 0.15s', flexShrink: 0,
                }}>
                    <Save size={18}/>
                    {!isMobile && <span style={{fontSize: 9, color: '#8c8c8c', lineHeight: 1}}>
{isSaving ? '...' : fmtSaved}
</span>}
                </button>
            </Tooltip>
        </div>
    );
}
