/**
 * ChartEngine.tsx — единый движок графиков с иерархической навигацией.
 *
 * ИМПОРТ: этот файл лежит в components/progress/, chartUtils.ts — там же.
 * Правильный импорт: ./chartUtils.ts
 */
import {useState, useMemo, useCallback, useEffect} from 'react';
import {
    BarChart, Bar, LineChart, Line,
    XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer,
} from 'recharts';
import {Button, Flex, Typography, Popconfirm, DatePicker, Segmented} from 'antd';
import {DeleteOutlined, CalendarOutlined, LeftOutlined, RightOutlined, ReloadOutlined} from '@ant-design/icons';
import dayjs from 'dayjs';
import type {
    UnifiedRecord,
    HierarchyLevel,
    ViewMode,
    ChartPoint,
    BreadcrumbEntry
} from "../../store/progress/chartUtils.ts";
import {
    buildData, needsScroll, chartWidth,
    getMonthStart,
    shiftAnchor, isCurrentPeriod, periodTitle
} from "../../store/progress/chartUtils.ts";

const {Text} = Typography;

const LEVEL_LABELS: Record<HierarchyLevel, string> = {
    day: 'День', week: 'Неделя', month: 'Месяц', quarter: '3 месяца', all: 'Всё время',
};
const LEVELS: HierarchyLevel[] = ['day', 'week', 'month', 'quarter', 'all'];
const HAS_PREVNEXT: HierarchyLevel[] = ['day', 'week', 'month', 'quarter'];
const HAS_VIEWMODE: HierarchyLevel[] = ['week', 'month', 'quarter'];

// ================================================================
// Состояние одного уровня — сохраняется при переходах
// ================================================================
interface LevelState {
    viewMode: ViewMode;
    anchor: string;     // ISO дата
    breadcrumb: BreadcrumbEntry[];
}

const defaultLevelState = (_level: HierarchyLevel): LevelState => ({
    viewMode: 'aggregated',
    anchor: new Date().toISOString(),
    breadcrumb: [],
});

const STORAGE_KEY = (trackerId: string) => `ce-state-${trackerId}`;

const loadStates = (trackerId: string): Record<HierarchyLevel, LevelState> => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY(trackerId));
        if (raw) return JSON.parse(raw);
    } catch {/* ignore */
    }
    return {
        day: defaultLevelState('day'),
        week: defaultLevelState('week'),
        month: defaultLevelState('month'),
        quarter: defaultLevelState('quarter'),
        all: defaultLevelState('all'),
    };
};

const saveStates = (trackerId: string, states: Record<HierarchyLevel, LevelState>) => {
    try {
        localStorage.setItem(STORAGE_KEY(trackerId), JSON.stringify(states));
    } catch {/* ignore */
    }
};

// ================================================================
// PROPS
// ================================================================
interface ChartEngineProps {
    trackerId: string;
    records: UnifiedRecord[];
    unit: string;
    color: string;
    onDelete: (ids: string[]) => void;
}

// ================================================================
// КОМПОНЕНТ
// ================================================================
// ================================================================
// Кастомный бар — надёжно ловит клики через SVG rect
// ================================================================
interface BarShapeProps {
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    payload?: ChartPoint;
    selectedKey?: string;
    selectedLabel?: string;
    color: string;
    onClickPoint?: (pt: ChartPoint) => void;
}

function ClickableBar({
                          x = 0,
                          y = 0,
                          width = 0,
                          height = 0,
                          payload,
                          selectedKey,
                          selectedLabel,
                          color,
                          onClickPoint = () => {
                          }
                      }: BarShapeProps) {
    if (!payload?.hasData) return null;

    // Минимальная высота 3px — чтобы бар был виден даже при малом значении
    const actualHeight = Math.max(height, 3);
    // Корректируем y чтобы бар "рос снизу" при использовании минимальной высоты
    const actualY = y + height - actualHeight;

    const isSel = payload.periodKey === selectedKey && payload.xLabel === selectedLabel;

    return (
        <rect
            x={x + 1}
            y={actualY}
            width={Math.max(width - 2, 1)}
            height={actualHeight}
            rx={4} ry={4}
            fill={isSel ? color : `${color}99`}
            stroke={isSel ? color : 'none'}
            strokeWidth={isSel ? 2 : 0}
            style={{cursor: 'pointer', outline: 'none'}}
            tabIndex={-1}
            onClick={(e) => {
                e.stopPropagation();
                onClickPoint(payload);
            }}
        />
    );
}

export function ChartEngine({trackerId, records, unit, color, onDelete}: ChartEngineProps) {

    // Активный уровень
    const [level, setLevel] = useState<HierarchyLevel>('week');

    // Состояния всех уровней
    const [levelStates, setLevelStates] = useState<Record<HierarchyLevel, LevelState>>(
        () => loadStates(trackerId)
    );

    // Выбранная точка
    const [selected, setSelected] = useState<ChartPoint | null>(null);

    // All-time datepicker
    const [jumpDate, setJumpDate] = useState<dayjs.Dayjs | null>(null);

    // Текущее состояние активного уровня
    const cur = levelStates[level];
    const anchor = new Date(cur.anchor);
    const viewMode = cur.viewMode;
    const breadcrumb = cur.breadcrumb;

    // Сохраняем в localStorage при изменении
    useEffect(() => {
        saveStates(trackerId, levelStates);
    }, [trackerId, levelStates]);

    // Обновить состояние конкретного уровня
    const updateLevel = useCallback((
        lv: HierarchyLevel,
        patch: Partial<LevelState>
    ) => {
        setLevelStates(prev => {
            const next = {...prev, [lv]: {...prev[lv], ...patch}};
            return next;
        });
    }, []);

    // ── данные графика ─────────────────────────────────────────────
    const data = useMemo(
        () => buildData(records, level, viewMode, anchor),
        [records, level, viewMode, anchor.toISOString().slice(0, 10)]  // eslint-disable-line
    );

    const scroll = needsScroll(data, level);
    const minW = scroll ? chartWidth(data) : undefined;

    // ── переключение уровней ───────────────────────────────────────
    const handleLevelClick = (newLevel: HierarchyLevel) => {
        setSelected(null);
        if (newLevel === level) {
            // Клик по текущему уровню — сбрасываем на «сейчас»
            updateLevel(level, {
                anchor: new Date().toISOString(),
                viewMode: 'aggregated',
                breadcrumb: [],
            });
        } else {
            // Переход на другой уровень — восстанавливаем его сохранённое состояние
            setLevel(newLevel);
        }
    };

    // ── drill-down (клик «Перейти к...») ──────────────────────────
    const drillDown = (point: ChartPoint) => {
        if (!point.hasData) return;

        // Добавляем текущее состояние в breadcrumb
        const bcEntry: BreadcrumbEntry = {
            level, viewMode, anchorDate: anchor,
            title: periodTitle(level, anchor),
        };
        updateLevel(level, {
            breadcrumb: [...breadcrumb, bcEntry],
        });

        let newLevel: HierarchyLevel;
        let newAnchor: Date;

        if (point.periodLevel === 'month') {
            newLevel = 'month';
            const [y, m] = point.periodKey.split('-').map(Number);
            newAnchor = new Date(y, m - 1, 1, 12, 0, 0);
        } else if (point.periodLevel === 'week') {
            newLevel = 'week';
            const [y, mo, d] = point.periodKey.split('-').map(Number);
            newAnchor = new Date(y, mo - 1, d, 12, 0, 0);
        } else {
            newLevel = 'day';
            const [y, mo, d] = point.periodKey.split('-').map(Number);
            newAnchor = new Date(y, mo - 1, d, 12, 0, 0);
        }

        updateLevel(newLevel, {
            anchor: newAnchor.toISOString(),
            viewMode: 'aggregated',
            breadcrumb: [...breadcrumb, bcEntry],
        });
        setLevel(newLevel);
        setSelected(null);
    };

    // ── breadcrumb navigation ──────────────────────────────────────
    const jumpBack = (entry: BreadcrumbEntry, idx: number) => {
        updateLevel(entry.level, {
            viewMode: entry.viewMode,
            anchor: entry.anchorDate.toISOString ? entry.anchorDate.toISOString() : new Date(entry.anchorDate).toISOString(),
            breadcrumb: breadcrumb.slice(0, idx),
        });
        setLevel(entry.level);
        setSelected(null);
    };

    // ── prev/next ──────────────────────────────────────────────────
    const shift = (dir: 1 | -1) => {
        const newAnchor = shiftAnchor(level, anchor, dir);
        updateLevel(level, {anchor: newAnchor.toISOString()});
        setSelected(null);
    };

    // ── viewMode ───────────────────────────────────────────────────
    const changeViewMode = (vm: ViewMode) => {
        updateLevel(level, {viewMode: vm});
        setSelected(null);
    };

    // ── all-time jump ──────────────────────────────────────────────
    const handleJump = (jumpLevel: 'day' | 'week' | 'month') => {
        if (!jumpDate) return;
        const d = jumpDate.toDate();
        const bcEntry: BreadcrumbEntry = {
            level, viewMode, anchorDate: anchor,
            title: periodTitle(level, anchor),
        };
        const newAnchor = jumpLevel === 'month' ? getMonthStart(d) : d;
        updateLevel(jumpLevel, {
            anchor: newAnchor.toISOString(),
            viewMode: 'aggregated',
            breadcrumb: [...breadcrumb, bcEntry],
        });
        setLevel(jumpLevel);
        setSelected(null);
    };

    // ── клик по точке/бару ─────────────────────────────────────────
    const handlePointClick = (pt: ChartPoint) => {
        if (!pt.hasData) {
            setSelected(null);
            return;
        }
        // toggle: повторный клик снимает выделение
        if (selected?.periodKey === pt.periodKey && selected?.xLabel === pt.xLabel) {
            setSelected(null);
        } else {
            setSelected(pt);
        }
    };

    // ── вспомогательные флаги ──────────────────────────────────────
    const curPeriod = isCurrentPeriod(level, anchor);
    const canDrill = level !== 'day' && selected?.hasData;
    const noData = data.every(p => !p.hasData);

    const drillLabel: Record<HierarchyLevel, string> = {
        day: '',
        week: 'Перейти к этому дню',
        month: viewMode === 'aggregated' ? 'Перейти к этой неделе' : 'Перейти к этому дню',
        quarter: selected?.periodLevel === 'month' ? 'Перейти к этому месяцу' : 'Перейти к этой неделе',
        all: 'Перейти к этому месяцу',
    };

    // ── tooltip ────────────────────────────────────────────────────
    const CustomTooltip = ({payload}: { payload?: Array<{ payload: ChartPoint }> }) => {
        if (!payload?.length || !payload[0].payload.hasData) return null;
        const p = payload[0].payload;
        return (
            <div style={{
                background: 'white', borderRadius: 8, padding: '8px 12px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.14)', fontSize: 12,
                border: `1px solid ${color}30`,
            }}>
                <Text strong style={{display: 'block', marginBottom: 2, fontSize: 12}}>
                    {p.tooltipLabel}
                </Text>
                <Text style={{color, fontSize: 13}}>
                    {p.label ? `${p.label} ${p.value} ${unit}` : `${p.value} ${unit}`}
                </Text>
                {level !== 'day' && (
                    <Text type="secondary" style={{display: 'block', fontSize: 10, marginTop: 3}}>
                        Нажмите чтобы выбрать
                    </Text>
                )}
            </div>
        );
    };

    // ── рендер графика ─────────────────────────────────────────────
    const useBar = level !== 'day' && !(level === 'week' && viewMode === 'detailed');

    const renderChart = () => {
        const yAxis = (
            <YAxis
                tick={{fontSize: 10, fill: '#8c8c8c'}} tickLine={false}
                axisLine={false} domain={['auto', 'auto']} width={38}
            />
        );
        const grid = <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false}/>;

        if (useBar) {
            return (
                <BarChart
                    data={data}
                    margin={{top: 8, right: 4, bottom: 8, left: -8}}
                >
                    {grid}
                    <XAxis
                        dataKey="xLabel"
                        tick={(props) => {
                            const {x, y, payload} = props;
                            const lines: string[] = String(payload.value).split('\n');
                            return (
                                <g transform={`translate(${x},${y})`}>
                                    {lines.map((l: string, i: number) => (
                                        <text key={i} x={0} y={0} dy={14 + i * 11}
                                              textAnchor="middle" fontSize={10} fill="#8c8c8c">
                                            {l}
                                        </text>
                                    ))}
                                </g>
                            );
                        }}
                        tickLine={false}
                        height={level === 'week' ? 44 : 30}
                        interval={0}
                    />
                    {yAxis}
                    <Tooltip content={<CustomTooltip/>} cursor={{fill: 'rgba(0,0,0,0.04)'}}/>
                    <Bar
                        dataKey="value"
                        maxBarSize={48}
                        isAnimationActive={false}
                        shape={(props: any) => (
                            <ClickableBar
                                {...(props as any)}
                                selectedKey={selected?.periodKey}
                                selectedLabel={selected?.xLabel}
                                color={color}
                                onClickPoint={handlePointClick}
                            />
                        )}
                    />
                </BarChart>
            );
        }

        // LineChart для day и week-detailed
        return (
            <LineChart
                data={data}
                margin={{top: 8, right: 4, bottom: 4, left: -8}}
                onClick={(e: any) => {
                    if (e && e.activePayload && e.activePayload.length > 0) {
                        handlePointClick(e.activePayload[0].payload as ChartPoint);
                    }
                }}
                style={{cursor: 'pointer'}}
            >
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"/>
                <XAxis
                    dataKey="xLabel"
                    tick={{fontSize: 10, fill: '#8c8c8c'}} tickLine={false}
                    angle={data.length > 8 ? -30 : 0}
                    textAnchor={data.length > 8 ? 'end' : 'middle'}
                    height={data.length > 8 ? 46 : 28}
                />
                {yAxis}
                <Tooltip content={<CustomTooltip/>}/>
                <Line
                    type="monotone" dataKey="value"
                    stroke={color} strokeWidth={2.5}
                    isAnimationActive={false}
                    dot={(props) => {
                        const {cx, cy, payload} = props;
                        const pt = payload as ChartPoint;
                        const isSel = selected?.periodKey === pt.periodKey && selected?.xLabel === pt.xLabel;
                        return (
                            <circle
                                key={`d-${cx}-${cy}`}
                                cx={cx} cy={cy}
                                r={isSel ? 7 : 5}
                                fill={isSel ? color : `${color}cc`}
                                stroke="white" strokeWidth={2}
                                style={{cursor: 'pointer', outline: 'none'}}
                                tabIndex={-1}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    handlePointClick(pt);
                                }}
                            />
                        );
                    }}
                    activeDot={false}
                />
            </LineChart>
        );
    };

    // ── панель действий ────────────────────────────────────────────
    const renderActionPanel = () => {
        if (!selected) return null;

        // periodDesc определяется по уровню ТОЧКИ (periodLevel), а не по уровню вкладки
        // Так "удалить за этот день" показывается даже в режиме "Все точки" недели
        const periodDesc =
            selected.periodLevel === 'day' ? 'за этот день' :
                selected.periodLevel === 'week' ? 'за эту неделю' :
                    'за этот месяц';

        return (
            <div style={{
                marginTop: 10,
                background: `${color}0e`,
                border: `1.5px solid ${color}40`,
                borderRadius: 12,
                padding: '12px 16px',
            }}>
                {/* Инфо о выбранной точке */}
                <Flex align="center" gap={10} style={{marginBottom: 10}}>
                    <div style={{
                        width: 8, height: 8, borderRadius: '50%',
                        background: color, flexShrink: 0,
                    }}/>
                    <div>
                        <Text strong style={{fontSize: 13}}>{selected.tooltipLabel}</Text>
                        <Text style={{fontSize: 14, marginLeft: 8, color}}>
                            {selected.label
                                ? `${selected.label} ${selected.value} ${unit}`
                                : `${selected.value} ${unit}`}
                        </Text>
                    </div>
                </Flex>

                {/* Кнопки */}
                <Flex gap={8} wrap="wrap">
                    {canDrill && drillLabel[level] && (
                        <Button
                            type="primary" size="small"
                            icon={<CalendarOutlined/>}
                            onClick={() => drillDown(selected)}
                            style={{background: color, border: 'none', fontSize: 12}}
                        >
                            {drillLabel[level]}
                        </Button>
                    )}
                    <Popconfirm
                        title={`Удалить записи ${periodDesc}?`}
                        description={selected.recordIds.length > 1
                            ? `Будет удалено ${selected.recordIds.length} записи`
                            : undefined}
                        onConfirm={() => {
                            onDelete(selected.recordIds);
                            setSelected(null);
                        }}
                        onCancel={() => setSelected(null)}
                        okText="Удалить" cancelText="Отмена"
                        okButtonProps={{danger: true}}
                    >
                        <Button size="small" danger icon={<DeleteOutlined/>} style={{fontSize: 12}}>
                            Удалить {periodDesc}
                        </Button>
                    </Popconfirm>
                    <Button
                        size="small" type="text"
                        onClick={() => setSelected(null)}
                        style={{fontSize: 12, color: '#8c8c8c'}}
                    >
                        Отмена
                    </Button>
                </Flex>
            </div>
        );
    };

    // ── empty state ────────────────────────────────────────────────
    if (records.length === 0) {
        return <Text type="secondary" style={{fontSize: 12}}>Добавьте первую запись чтобы увидеть график</Text>;
    }

    return (
        <div style={{outline: 'none'}}>
            <style>{`
                .recharts-wrapper svg:focus,
                .recharts-wrapper svg *:focus,
                .recharts-surface { outline: none !important; }
            `}</style>
            {/* ── Вкладки уровней ── */}
            <Flex gap={4} wrap="wrap" style={{marginBottom: 10}}>
                {LEVELS.map(l => (
                    <button
                        key={l}
                        onClick={() => handleLevelClick(l)}
                        title={level === l ? 'Нажмите ещё раз чтобы вернуться к текущему периоду' : undefined}
                        style={{
                            padding: '4px 12px', borderRadius: 20, border: 'none',
                            cursor: 'pointer', fontSize: 12, fontWeight: 600,
                            transition: 'all 0.15s',
                            background: level === l ? color : '#f0f0f0',
                            color: level === l ? 'white' : '#595959',
                        }}
                    >
                        {LEVEL_LABELS[l]}
                    </button>
                ))}
            </Flex>

            {/* ── Хлебные крошки ── */}
            {breadcrumb.length > 0 && (
                <Flex align="center" gap={4} style={{marginBottom: 8, flexWrap: 'wrap'}}>
                    {breadcrumb.map((bc, i) => (
                        <span key={i} style={{display: 'flex', alignItems: 'center', gap: 4}}>
                            <button
                                onClick={() => jumpBack(bc, i)}
                                style={{
                                    background: 'none', border: 'none', cursor: 'pointer',
                                    color: '#667eea', fontSize: 11, padding: '2px 4px',
                                    borderRadius: 4, textDecoration: 'underline',
                                }}
                            >
                                {bc.title}
                            </button>
                            <Text type="secondary" style={{fontSize: 11}}>›</Text>
                        </span>
                    ))}
                    <Text style={{fontSize: 11, color: '#434343', fontWeight: 600}}>
                        {periodTitle(level, anchor)}
                    </Text>
                </Flex>
            )}

            {/* ── Навигация + viewMode ── */}
            <Flex justify="space-between" align="center" style={{marginBottom: 8}} wrap="wrap">
                <Flex align="center" gap={4}>
                    {HAS_PREVNEXT.includes(level) && (
                        <Button size="small" type="text" icon={<LeftOutlined/>} onClick={() => shift(-1)}/>
                    )}
                    <Text strong style={{fontSize: 12, color: '#434343', minWidth: 80, textAlign: 'center'}}>
                        {periodTitle(level, anchor)}
                    </Text>
                    {HAS_PREVNEXT.includes(level) && (
                        <Button size="small" type="text" icon={<RightOutlined/>}
                                disabled={curPeriod} onClick={() => shift(1)}/>
                    )}
                    {HAS_PREVNEXT.includes(level) && !curPeriod && (
                        <Button size="small" type="text" icon={<ReloadOutlined/>}
                                title="Вернуться к текущему периоду"
                                onClick={() => updateLevel(level, {anchor: new Date().toISOString()})}
                                style={{color: '#667eea', fontSize: 11}}
                        />
                    )}
                </Flex>

                {HAS_VIEWMODE.includes(level) && (
                    <Segmented
                        size="small"
                        value={viewMode}
                        onChange={v => changeViewMode(v as ViewMode)}
                        options={[
                            {
                                value: 'aggregated',
                                label: level === 'week' ? 'По дням'
                                    : level === 'month' ? 'По неделям'
                                        : 'По месяцам',
                            },
                            {
                                value: 'detailed',
                                label: level === 'week' ? 'Все точки'
                                    : level === 'month' ? 'По дням'
                                        : 'По неделям',
                            },
                        ]}
                    />
                )}
            </Flex>

            {/* ── All-time: переход по дате ── */}
            {level === 'all' && (
                <div style={{
                    background: '#fafafa', borderRadius: 8,
                    padding: '10px 12px', marginBottom: 10,
                    border: '1px solid #f0f0f0',
                }}>
                    <Text type="secondary" style={{fontSize: 11, display: 'block', marginBottom: 6}}>
                        Перейти к конкретной дате:
                    </Text>
                    <Flex gap={8} align="center" wrap="wrap">
                        <DatePicker
                            value={jumpDate}
                            onChange={setJumpDate}
                            size="small" format="DD.MM.YYYY"
                            placeholder="дд.мм.гггг"
                            style={{width: 130}}
                        />
                        <Button size="small" disabled={!jumpDate} onClick={() => handleJump('day')}>
                            За день
                        </Button>
                        <Button size="small" disabled={!jumpDate} onClick={() => handleJump('week')}>
                            За неделю
                        </Button>
                        <Button size="small" disabled={!jumpDate} onClick={() => handleJump('month')}>
                            За месяц
                        </Button>
                    </Flex>
                </div>
            )}

            {/* ── График ── */}
            {noData ? (
                <div style={{
                    height: 80, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#8c8c8c', fontSize: 12,
                }}>
                    Нет данных за {periodTitle(level, anchor)}
                </div>
            ) : (
                <div style={{
                    overflowX: scroll ? 'auto' : 'visible',
                    overflowY: 'visible',
                    outline: 'none',
                    userSelect: 'none'
                }} tabIndex={-1}>
                    <div style={{minWidth: minW ?? '100%', width: minW ?? '100%'}}>
                        <ResponsiveContainer width="100%" height={180} style={{outline: "none"}}>
                            {renderChart()}
                        </ResponsiveContainer>
                    </div>
                </div>
            )}

            {/* ── Панель действий ── */}
            {renderActionPanel()}
        </div>
    );
}