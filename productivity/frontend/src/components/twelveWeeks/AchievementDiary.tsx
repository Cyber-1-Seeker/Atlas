import {useState, useEffect} from 'react';
import {Modal, Input, Button, Typography, Flex, Empty} from 'antd';
import {PlusOutlined, DeleteOutlined} from '@ant-design/icons';
import {
    BookOpen, Flame, Star, Target, Zap,
    Trophy, Heart, Rocket, CheckCircle2, Lightbulb,
    PartyPopper, Medal,
} from 'lucide-react';
import {twelveWeeksApi, type ApiDiaryEntry} from '../../api/twelveWeeks.ts';

const {Text, Title} = Typography;
const {TextArea} = Input;

// ================================================================
// ТИПЫ
// ================================================================

type DiaryType = 'day' | 'week';

interface AchievementDiaryProps {
    open: boolean;
    onClose: () => void;
    type: DiaryType;
    weekNum: number;
    dayOfWeek?: number;
}

// ================================================================
// ИКОНКИ — Lucide, MIT лицензия, бесплатно для коммерческого использования
// ================================================================

const ICON_OPTIONS: Array<{ key: string; Icon: React.ElementType; color: string; label: string }> = [
    {key: 'trophy', Icon: Trophy, color: '#f5a623', label: 'Трофей'},
    {key: 'star', Icon: Star, color: '#facc15', label: 'Звезда'},
    {key: 'target', Icon: Target, color: '#ef4444', label: 'Цель'},
    {key: 'flame', Icon: Flame, color: '#f97316', label: 'Огонь'},
    {key: 'zap', Icon: Zap, color: '#a855f7', label: 'Молния'},
    {key: 'heart', Icon: Heart, color: '#ec4899', label: 'Сердце'},
    {key: 'rocket', Icon: Rocket, color: '#3b82f6', label: 'Ракета'},
    {key: 'check', Icon: CheckCircle2, color: '#22c55e', label: 'Готово'},
    {key: 'bulb', Icon: Lightbulb, color: '#eab308', label: 'Идея'},
    {key: 'party', Icon: PartyPopper, color: '#8b5cf6', label: 'Праздник'},
    {key: 'medal', Icon: Medal, color: '#06b6d4', label: 'Медаль'},
];

const getIconData = (key: string) =>
    ICON_OPTIONS.find(o => o.key === key) ?? ICON_OPTIONS[0];

// ================================================================
// УТИЛИТЫ
// ================================================================

const DAYS_RU = ['Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота', 'Воскресенье'];

const getStorageKey = (type: DiaryType, weekNum: number, dayOfWeek?: number): string =>
    type === 'week' ? `diary-week-${weekNum}` : `diary-day-${weekNum}-${dayOfWeek ?? 0}`;

const MOTIVATIONAL_QUOTES = [
    'Каждое достижение — это шаг к мечте!',
    'Ты делаешь это! Гордись собой.',
    'Маленькие победы складываются в большой успех.',
    'Прогресс важнее совершенства.',
    'Сегодняшние усилия — завтрашние результаты.',
];

// ================================================================
// КОМПОНЕНТ ДНЕВНИКА
// ================================================================

export function AchievementDiary({open, onClose, type, weekNum, dayOfWeek}: AchievementDiaryProps) {
    const storageKey = getStorageKey(type, weekNum, dayOfWeek);
    const [entries, setEntries] = useState<ApiDiaryEntry[]>([]);
    const [newText, setNewText] = useState('');
    const [selectedIconKey, setSelectedIconKey] = useState('trophy');
    const [loading, setLoading] = useState(false);
    const [quote] = useState(() =>
        MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]
    );

    useEffect(() => {
        if (!open) return;
        setNewText('');
        setLoading(true);
        twelveWeeksApi.getDiary({type, week: weekNum, day_of_week: type === 'day' ? (dayOfWeek ?? 0) : undefined})
            .then(({data}) => setEntries(data))
            .finally(() => setLoading(false));
    }, [open, storageKey, type, weekNum, dayOfWeek]);

    const handleAdd = () => {
        if (!newText.trim()) return;
        const payload = {
            type,
            week: weekNum,
            day_of_week: type === 'day' ? (dayOfWeek ?? 0) : null,
            text: newText.trim(),
            icon_key: selectedIconKey,
            date: new Date().toISOString(),
        } satisfies Omit<ApiDiaryEntry, 'id' | 'created_at'>;

        setLoading(true);
        twelveWeeksApi.addDiaryEntry(payload)
            .then(({data}) => {
                setEntries(prev => [data, ...prev]);
                setNewText('');
            })
            .finally(() => setLoading(false));
    };

    const handleDelete = (id: number) => {
        setLoading(true);
        twelveWeeksApi.deleteDiaryEntry(id)
            .then(() => setEntries(prev => prev.filter(e => e.id !== id)))
            .finally(() => setLoading(false));
    };

    const formatDate = (iso: string): string => {
        const d = new Date(iso);
        const isToday = d.toDateString() === new Date().toDateString();
        const time = d.toLocaleTimeString('ru-RU', {hour: '2-digit', minute: '2-digit'});
        return isToday
            ? `Сегодня, ${time}`
            : d.toLocaleDateString('ru-RU', {day: 'numeric', month: 'short'}) + `, ${time}`;
    };

    const titleText = type === 'week'
        ? `Дневник недели ${weekNum}`
        : `Дневник: ${DAYS_RU[dayOfWeek ?? 0]}, неделя ${weekNum}`;

    const entriesWord =
        entries.length === 1 ? 'достижение'
            : entries.length < 5 ? 'достижения'
                : 'достижений';

    return (
        <Modal
            open={open}
            onCancel={onClose}
            footer={null}
            width={520}
            title={null}
            styles={{body: {padding: 0}}}
        >
            {/* Шапка */}
            <div style={{
                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                borderRadius: '8px 8px 0 0',
                padding: '28px 28px 20px',
                color: 'white',
            }}>
                <Flex align="center" gap={12} style={{marginBottom: 10}}>
                    <div style={{
                        width: 44, height: 44, borderRadius: 14,
                        background: 'rgba(255,255,255,0.22)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                        <BookOpen size={24} color="white" strokeWidth={1.8}/>
                    </div>
                    <div>
                        <Title level={5} style={{margin: 0, color: 'white', fontSize: 16}}>
                            {titleText}
                        </Title>
                        <Text style={{color: 'rgba(255,255,255,0.8)', fontSize: 12}}>
                            {entries.length > 0
                                ? `${entries.length} ${entriesWord}`
                                : 'Запишите свои победы!'}
                        </Text>
                    </div>
                </Flex>
                <div style={{
                    background: 'rgba(255,255,255,0.15)',
                    borderRadius: 10,
                    padding: '8px 12px',
                    fontSize: 13,
                    fontStyle: 'italic',
                    color: 'rgba(255,255,255,0.92)',
                }}>
                    <Star size={12} style={{marginRight: 6, verticalAlign: 'middle'}}/>
                    {quote}
                </div>
            </div>

            {/* Тело */}
            <div style={{padding: '20px 24px 24px'}}>

                {/* Добавление */}
                <div style={{
                    background: '#fafafa', borderRadius: 12,
                    padding: '14px 16px', marginBottom: 20,
                    border: '1px solid #f0f0f0',
                }}>
                    <Text strong style={{fontSize: 13, display: 'block', marginBottom: 10, color: '#434343'}}>
                        Добавить достижение
                    </Text>

                    {/* Выбор иконки */}
                    <div style={{marginBottom: 10}}>
                        <Text type="secondary" style={{fontSize: 11, display: 'block', marginBottom: 6}}>
                            Значок:
                        </Text>
                        <Flex gap={6} wrap="wrap">
                            {ICON_OPTIONS.map(({key, Icon, color, label}) => {
                                const isSelected = selectedIconKey === key;
                                return (
                                    <div
                                        key={key}
                                        title={label}
                                        onClick={() => setSelectedIconKey(key)}
                                        style={{
                                            width: 36, height: 36, borderRadius: 10,
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            cursor: 'pointer',
                                            background: isSelected ? color : 'white',
                                            border: `2px solid ${isSelected ? color : '#e8e8e8'}`,
                                            transition: 'all 0.18s',
                                            transform: isSelected ? 'scale(1.15)' : 'scale(1)',
                                            boxShadow: isSelected ? `0 4px 12px ${color}55` : 'none',
                                        }}
                                    >
                                        <Icon
                                            size={18}
                                            color={isSelected ? 'white' : color}
                                            strokeWidth={isSelected ? 2.5 : 2}
                                        />
                                    </div>
                                );
                            })}
                        </Flex>
                    </div>

                    <Flex gap={8} align="flex-start">
                        <TextArea
                            placeholder="Что вы сегодня достигли? Чем гордитесь?"
                            value={newText}
                            onChange={e => setNewText(e.target.value)}
                            autoSize={{minRows: 2, maxRows: 4}}
                            style={{flex: 1, borderRadius: 8}}
                            maxLength={300}
                            onKeyDown={e => {
                                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd();
                            }}
                        />
                        <Button
                            type="primary"
                            icon={<PlusOutlined/>}
                            onClick={handleAdd}
                            disabled={!newText.trim() || loading}
                            loading={loading}
                            style={{
                                background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                border: 'none', height: 40,
                            }}
                        >
                            Записать
                        </Button>
                    </Flex>
                    <Text type="secondary" style={{fontSize: 11, marginTop: 4, display: 'block'}}>
                        Ctrl+Enter для быстрого сохранения
                    </Text>
                </div>

                {/* Список */}
                {loading ? (
                    <Empty description="Загрузка..." style={{padding: '16px 0'}} />
                ) : entries.length === 0 ? (
                    <Empty
                        image={
                            <div style={{
                                width: 64, height: 64, borderRadius: 20, margin: '0 auto',
                                background: 'linear-gradient(135deg, #f093fb22 0%, #f5576c22 100%)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                <Trophy size={32} color="#f5576c" strokeWidth={1.5}/>
                            </div>
                        }
                        description={
                            <div style={{marginTop: 8}}>
                                <Text strong style={{display: 'block', color: '#595959'}}>Пока пусто</Text>
                                <Text type="secondary" style={{fontSize: 13}}>
                                    Даже маленькая победа — это победа!
                                </Text>
                            </div>
                        }
                        style={{padding: '16px 0'}}
                    />
                ) : (
                    <div style={{maxHeight: 340, overflowY: 'auto', paddingRight: 2}}>
                        {entries.map(entry => {
                            const {Icon, color} = getIconData(entry.icon_key);
                            return (
                                <div key={entry.id} style={{
                                    background: 'white', border: '1px solid #f0f0f0',
                                    borderRadius: 12, padding: '12px 14px', marginBottom: 10,
                                    borderLeft: `3px solid ${color}`,
                                    transition: 'all 0.2s',
                                }}>
                                    <Flex justify="space-between" align="flex-start">
                                        <Flex gap={10} align="flex-start" style={{flex: 1}}>
                                            <div style={{
                                                width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                                                background: `${color}18`,
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            }}>
                                                <Icon size={18} color={color} strokeWidth={2}/>
                                            </div>
                                            <div style={{flex: 1}}>
                                                <Text style={{
                                                    fontSize: 14, color: '#262626',
                                                    display: 'block', lineHeight: 1.5,
                                                }}>
                                                    {entry.text}
                                                </Text>
                                                <Text type="secondary"
                                                      style={{fontSize: 11, marginTop: 3, display: 'block'}}>
                                                    {formatDate(entry.date)}
                                                </Text>
                                            </div>
                                        </Flex>
                                        <Button
                                            type="text" size="small"
                                            icon={<DeleteOutlined/>}
                                            onClick={() => handleDelete(entry.id)}
                                            danger
                                            style={{opacity: 0.4, flexShrink: 0}}
                                        />
                                    </Flex>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </Modal>
    );
}

// ================================================================
// КНОПКА-ТРИГГЕР
// ================================================================

interface DiaryButtonProps {
    type: DiaryType;
    weekNum: number;
    dayOfWeek?: number;
}

export function DiaryButton({type, weekNum, dayOfWeek}: DiaryButtonProps) {
    const [open, setOpen] = useState(false);
    const storageKey = getStorageKey(type, weekNum, dayOfWeek);
    const [count, setCount] = useState(0);

    useEffect(() => {
        twelveWeeksApi.getDiary({type, week: weekNum, day_of_week: type === 'day' ? (dayOfWeek ?? 0) : undefined})
            .then(({data}) => setCount(data.length))
            .catch(() => setCount(0));
    }, [storageKey, type, weekNum, dayOfWeek]);

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                title={type === 'week' ? 'Дневник недели' : 'Дневник дня'}
                style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5,
                    padding: '4px 10px', borderRadius: 20,
                    border: `1.5px solid ${count > 0 ? '#f5576c' : '#e8e8e8'}`,
                    cursor: 'pointer', background: count > 0 ? '#fff0f3' : 'white',
                    transition: 'all 0.2s', color: count > 0 ? '#f5576c' : '#8c8c8c',
                    fontSize: 12, fontWeight: count > 0 ? 600 : 400,
                }}
                onMouseEnter={e => {
                    e.currentTarget.style.borderColor = '#f5576c';
                    e.currentTarget.style.color = '#f5576c';
                }}
                onMouseLeave={e => {
                    e.currentTarget.style.borderColor = count > 0 ? '#f5576c' : '#e8e8e8';
                    e.currentTarget.style.color = count > 0 ? '#f5576c' : '#8c8c8c';
                }}
            >
                <BookOpen size={14} strokeWidth={2}/>
                {count > 0 ? `${count}` : type === 'week' ? 'Итоги' : 'Дневник'}
            </button>

            <AchievementDiary
                open={open}
                onClose={() => setOpen(false)}
                type={type}
                weekNum={weekNum}
                dayOfWeek={dayOfWeek}
            />
        </>
    );
}