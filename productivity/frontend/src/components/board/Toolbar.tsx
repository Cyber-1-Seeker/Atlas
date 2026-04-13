/**
 * Toolbar — плавающая панель инструментов доски.
 * Позволяет добавлять элементы на холст.
 */
import {useState} from 'react';
import {Button, Tooltip, Popover, Typography, Divider, Empty} from 'antd';
import {
    StickyNote, Type, Square, Circle, Diamond,
    Save, Undo, ZoomIn, ZoomOut,
    Maximize, Plus,
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
    canUndo: boolean;
}

export function Toolbar({onAdd, onSave, onUndo, onZoom, isSaving, lastSaved}: Props) {
    const {goals} = useGoalStore();
    const {trackers} = useProgressStore();
    const {segments} = useWheelStore();
    const [dataPopover, setDataPopover] = useState(false);

    const fmtSaved = lastSaved
        ? `Сохранено в ${lastSaved.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'})}`
        : 'Не сохранено';

    // Виджеты данных — выбор из существующих
    const DataPopoverContent = () => (
        <div style={{width: 260}}>
            <Text strong style={{display: 'block', marginBottom: 8, fontSize: 12}}>
                Добавить виджет данных
            </Text>

            {goals.length > 0 && (
                <>
                    <Text type="secondary" style={{fontSize: 11, display: 'block', marginBottom: 4}}>
                        🏆 Цели
                    </Text>
                    {goals.slice(0, 5).map(g => (
                        <Button key={g.id} type="text" block size="small"
                                style={{textAlign: 'left', height: 'auto', padding: '4px 8px', marginBottom: 2}}
                                onClick={() => {
                                    onAdd('goal', {goalId: g.id});
                                    setDataPopover(false);
                                }}>
                            <Text style={{fontSize: 12}} ellipsis>{g.text}</Text>
                        </Button>
                    ))}
                    <Divider style={{margin: '8px 0'}}/>
                </>
            )}

            {trackers.length > 0 && (
                <>
                    <Text type="secondary" style={{fontSize: 11, display: 'block', marginBottom: 4}}>
                        📈 Трекеры
                    </Text>
                    {trackers.slice(0, 5).map(t => (
                        <Button key={t.id} type="text" block size="small"
                                style={{textAlign: 'left', height: 'auto', padding: '4px 8px', marginBottom: 2}}
                                onClick={() => {
                                    onAdd('tracker', {trackerId: t.id});
                                    setDataPopover(false);
                                }}>
                            <span style={{
                                display: 'inline-block', width: 8, height: 8,
                                borderRadius: '50%', background: t.color, marginRight: 6,
                            }}/>
                            <Text style={{fontSize: 12}}>{t.name}</Text>
                        </Button>
                    ))}
                    <Divider style={{margin: '8px 0'}}/>
                </>
            )}

            {segments.length > 0 && (
                <>
                    <Text type="secondary" style={{fontSize: 11, display: 'block', marginBottom: 4}}>
                        ⭕ Жизненный круг
                    </Text>
                    {segments.map(s => (
                        <Button key={s.id} type="text" block size="small"
                                style={{textAlign: 'left', height: 'auto', padding: '4px 8px', marginBottom: 2}}
                                onClick={() => {
                                    onAdd('wheelSegment', {segmentId: s.id});
                                    setDataPopover(false);
                                }}>
                            <span style={{
                                display: 'inline-block', width: 8, height: 8,
                                borderRadius: '50%', background: s.color, marginRight: 6,
                            }}/>
                            <Text style={{fontSize: 12}}>{s.name} — {s.score}/10</Text>
                        </Button>
                    ))}
                </>
            )}

            {goals.length === 0 && trackers.length === 0 && segments.length === 0 && (
                <Empty description="Нет данных для добавления"
                       image={Empty.PRESENTED_IMAGE_SIMPLE}/>
            )}
        </div>
    );

    const btn = (title: string, icon: React.ReactNode, onClick: () => void, active = false) => (
        <Tooltip title={title} placement="right">
            <button onClick={onClick} style={{
                width: 36, height: 36, border: 'none',
                background: active ? 'rgba(102,126,234,0.15)' : 'transparent',
                borderRadius: 8, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: active ? '#667eea' : '#434343',
                transition: 'all 0.15s',
            }}
                    onMouseEnter={e => {
                        if (!active) e.currentTarget.style.background = '#f0f0f0';
                    }}
                    onMouseLeave={e => {
                        if (!active) e.currentTarget.style.background = 'transparent';
                    }}
            >
                {icon}
            </button>
        </Tooltip>
    );

    return (
        <div
            style={{
                position: 'absolute',
                bottom: 20,
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
                background: 'white',
                borderRadius: 20,
                boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                padding: '10px 16px',
                display: 'flex',
                flexDirection: 'row',   // ← главное
                alignItems: 'center',
                gap: 6,

                // Внизу вертикальный сбоку, выше горизонтальный
                // style={{
                // position:'absolute',left:16,top:'50%',
                // transform:'translateY(-50%)',
                // zIndex:10,
                // background:'white',borderRadius:16,
                // boxShadow:'0 4px 24px rgba(0,0,0,0.12)',
                // padding:'10px 8px',
                // display:'flex',flexDirection:'column',gap:4,
            }}>
            {/* Основные элементы */}
            {btn('Стикер', <StickyNote size={16}/>, () => onAdd('sticky', {text: '', color: '#fef08a'}))}
            {btn('Текст', <Type size={16}/>, () => onAdd('text', {
                text: '',
                fontSize: 14,
                bold: false,
                color: '#1a1a1a'
            }))}
            {btn('Прямоугольник', <Square size={16}/>, () => onAdd('shape', {
                shape: 'rect',
                color: '#667eea',
                label: '',
                w: 120,
                h: 80
            }))}
            {btn('Круг', <Circle size={16}/>, () => onAdd('shape', {
                shape: 'circle',
                color: '#52c41a',
                label: '',
                w: 100,
                h: 100
            }))}
            {btn('Ромб', <Diamond size={16}/>, () => onAdd('shape', {
                shape: 'diamond',
                color: '#fa8c16',
                label: '',
                w: 120,
                h: 80
            }))}

            <div style={{height: 1, background: '#f0f0f0', margin: '4px 0'}}/>

            {/* Данные из приложения */}
            <Popover
                content={<DataPopoverContent/>}
                title={null}
                trigger="click"
                open={dataPopover}
                onOpenChange={setDataPopover}
                placement="right"
            >
                {btn('Добавить данные', <Plus size={16}/>, () => setDataPopover(v => !v), dataPopover)}
            </Popover>

            <div style={{height: 1, background: '#f0f0f0', margin: '4px 0'}}/>

            {/* Управление видом */}
            {btn('Приблизить', <ZoomIn size={16}/>, () => onZoom('in'))}
            {btn('Отдалить', <ZoomOut size={16}/>, () => onZoom('out'))}
            {btn('По размеру', <Maximize size={16}/>, () => onZoom('fit'))}

            <div style={{height: 1, background: '#f0f0f0', margin: '4px 0'}}/>

            {/* Отменить */}
            {btn('Отменить', <Undo size={16}/>, onUndo)}

            {/* Сохранить */}
            <Tooltip title={fmtSaved} placement="right">
                <button onClick={onSave} style={{
                    width: 36, height: 36, border: 'none',
                    background: isSaving ? '#f0f0ff' : 'transparent',
                    borderRadius: 8, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: isSaving ? '#667eea' : '#52c41a',
                    transition: 'all 0.15s',
                }}>
                    <Save size={16}/>
                </button>
            </Tooltip>
        </div>
    );
}
