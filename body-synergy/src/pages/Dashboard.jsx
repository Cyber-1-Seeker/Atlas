// src/pages/Dashboard.jsx
import {useState, useEffect, useRef, useCallback} from 'react'
import '../styles/Dashboard.css'
import {useApp} from '../context/AppContext'
import {ZONES} from '../data/zones'
import {POSES} from '../data/poses'
import {TIPS, SCENARIOS} from '../data/tips'
import {LEVELS_DATA} from '../data/levels'
import {TICKER_ITEMS} from '../data/zones'
import {
    loadDiary, addDiaryEntry, deleteDiaryEntry,
    loadFavorites, toggleFavorite,
    loadSynergyHistory, recordSynergy,
    loadWorkoutHistory,
    loadTheme, saveTheme,
    buildSearchIndex, searchIndex,
    requestNotifPermission, loadNotifSettings, saveNotifSettings,
    formatDate, todayStr, getLast7Days,
    MOODS,
} from '../data/dashboard'

// ── Icons ─────────────────────────────────────────────────
const SearchIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="11" cy="11" r="8"/>
        <line x1="21" y1="21" x2="16.65" y2="16.65"/>
    </svg>
)
const PlusIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
)
const TrashIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6"/>
        <path d="M19 6l-1 14H6L5 6"/>
        <path d="M10 11v6M14 11v6"/>
    </svg>
)
const HeartIcon = ({filled}) => (
    <svg viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path
            d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
    </svg>
)
const ArrowRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
    </svg>
)
const XIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="18" y1="6" x2="6" y2="18"/>
        <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
)

const TICKER_DOUBLED = [...TICKER_ITEMS, ...TICKER_ITEMS]

// ── Greeting ──────────────────────────────────────────────
function getGreeting() {
    const h = new Date().getHours()
    if (h < 6) return 'Поздняя ночь'
    if (h < 12) return 'Доброе утро'
    if (h < 17) return 'День'
    if (h < 22) return 'Добрый вечер'
    return 'Ночь'
}

function getWeekday() {
    return ['Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'][new Date().getDay()]
}

// ════════════════════════════════════════════════════════
// SEARCH
// ════════════════════════════════════════════════════════
function SearchBar({onAction}) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [focused, setFocused] = useState(false)
    const indexRef = useRef(null)
    const inputRef = useRef(null)

    useEffect(() => {
        indexRef.current = buildSearchIndex(ZONES, LEVELS_DATA, POSES, TIPS, SCENARIOS)
    }, [])

    // Ctrl+K
    useEffect(() => {
        function onKey(e) {
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault()
                inputRef.current?.focus()
            }
            if (e.key === 'Escape') {
                setQuery('');
                setResults([]);
                inputRef.current?.blur()
            }
        }

        window.addEventListener('keydown', onKey)
        return () => window.removeEventListener('keydown', onKey)
    }, [])

    function handleInput(val) {
        setQuery(val)
        if (indexRef.current) setResults(searchIndex(indexRef.current, val))
        else setResults([])
    }

    function handleSelect(item) {
        onAction(item.action)
        setQuery('');
        setResults([]);
        inputRef.current?.blur()
    }

    const TYPE_LABELS = {
        exercise: 'Упражнение', level: 'Уровень', pose: 'Поза',
        tip: 'Совет', scenario: 'Сценарий',
    }

    return (
        <div className="dash-search">
            <div className="dash-search__input-wrap">
                <span className="dash-search__icon"><SearchIcon/></span>
                <input
                    ref={inputRef}
                    className="dash-search__input"
                    placeholder="Поиск по упражнениям, позам, советам..."
                    value={query}
                    onChange={e => handleInput(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={() => setTimeout(() => setFocused(false), 150)}
                />
                <span className="dash-search__shortcut">Ctrl+K</span>
            </div>

            {focused && query.length >= 2 && (
                <div className="dash-search__results">
                    {results.length === 0
                        ? <div className="search-no-results">Ничего не найдено по «{query}»</div>
                        : results.map(item => (
                            <div key={item.id} className="search-result" onClick={() => handleSelect(item)}>
                                <div className="search-result__type-dot" style={{background: item.color}}/>
                                <div className="search-result__info">
                                    <div className="search-result__title">{item.title}</div>
                                    <div className="search-result__sub">{item.subtitle}</div>
                                </div>
                                <span className="search-result__tag">{TYPE_LABELS[item.type]}</span>
                            </div>
                        ))
                    }
                </div>
            )}
        </div>
    )
}

// ════════════════════════════════════════════════════════
// SYNERGY CHART — 7-day sparkline bars
// ════════════════════════════════════════════════════════
function SynergyChart({currentSynergy}) {
    const history = loadSynergyHistory()
    const days = getLast7Days()
    const today = todayStr()

    const DAYS_SHORT = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс']
    const DAY_MAP = {1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 0: 'Вс'}

    const bars = days.map(dateStr => {
        const hist = history.find(h => h.date === dateStr)
        const val = hist ? hist.value : (dateStr === today ? currentSynergy : 0)
        return {
            dateStr, val, isToday: dateStr === today,
            dayLabel: DAY_MAP[new Date(dateStr).getDay()]
        }
    })

    const maxVal = Math.max(...bars.map(b => b.val), 1)

    return (
        <div className="synergy-chart">
            <div className="synergy-chart__title">Активность за неделю</div>
            <div className="synergy-chart__bars">
                {bars.map(bar => (
                    <div key={bar.dateStr} className="synergy-bar-wrap">
                        <div
                            className={`synergy-bar${bar.isToday ? ' today' : ''}`}
                            style={{height: `${Math.max((bar.val / maxVal) * 100, 5)}%`}}
                            title={`${bar.val} · ${bar.dateStr}`}
                        />
                        <div className={`synergy-bar__day${bar.isToday ? ' heatmap-label--today' : ''}`}>
                            {bar.dayLabel}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// HEATMAP
// ════════════════════════════════════════════════════════
function ActivityHeatmap() {
    const workoutHistory = loadWorkoutHistory()
    const days = getLast7Days()
    const today = todayStr()
    const DAY_MAP = {1: 'Пн', 2: 'Вт', 3: 'Ср', 4: 'Чт', 5: 'Пт', 6: 'Сб', 0: 'Вс'}

    return (
        <div className="dash-heatmap">
            <div className="dash-heatmap__title">7 дней активности</div>
            <div className="heatmap-grid">
                {days.map(dateStr => {
                    const rec = workoutHistory.find(h => h.date === dateStr)
                    const pct = rec ? rec.doneCount / Math.max(rec.totalCount, 1) : 0
                    const lvl = !rec ? 'empty' : pct < 0.4 ? 'low' : pct < 0.75 ? 'medium' : 'high'
                    const isToday = dateStr === today
                    return (
                        <div key={dateStr} className="heatmap-day">
                            <div
                                className={`heatmap-cell heatmap-cell--${lvl}${isToday ? ' heatmap-cell--today' : ''}`}
                                title={`${dateStr}: ${rec ? `${rec.doneCount}/${rec.totalCount} упражнений` : 'нет данных'}`}
                            />
                            <div className={`heatmap-label${isToday ? ' heatmap-label--today' : ''}`}>
                                {DAY_MAP[new Date(dateStr).getDay()]}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// ZONE CARD
// ════════════════════════════════════════════════════════
function ZoneCard({zone, style}) {
    const {state, dispatch} = useApp()
    const [favs, setFavs] = useState(loadFavorites)
    const score = state.scores[zone.id]
    const isFav = favs.some(f => f.id === zone.id && f.type === 'zone')

    const ZONE_META = {
        hands: {metricLabel: 'НАПРЯЖЕНИЕ', prog: 42},
        legs: {metricLabel: 'КОНТРОЛЬ', prog: 65},
        groin: {metricLabel: 'ЧУВСТВИТЕЛЬНОСТЬ', prog: 75},
    }
    const meta = ZONE_META[zone.id]

    function handleFav(e) {
        e.stopPropagation()
        const updated = toggleFavorite({id: zone.id, type: 'zone', title: zone.name, color: zone.colorRaw})
        setFavs(updated)
    }

    return (
        <div
            className="dash-zone-card"
            data-zone={zone.id}
            style={style}
            onClick={() => dispatch({type: 'OPEN_ZONE', zoneId: zone.id})}
        >
            <div className="dash-zone-card__bg"/>
            <div className="dash-zone-card__overlay"/>
            <div className="dash-zone-card__glow"/>
            <div className="dash-zone-card__content">
                <div className="dash-zone-card__top">
                    <span className="dash-zone-card__dot"/>
                    <button className={`dash-zone-card__fav${isFav ? ' active' : ''}`} onClick={handleFav}>
                        <HeartIcon filled={isFav}/>
                    </button>
                </div>
                <div className="dash-zone-card__bottom">
                    <div>
                        <div className="dash-zone-card__name">{zone.name}</div>
                        <div className="dash-zone-card__metric-row">
                            <div>
                                <div className="dash-zone-card__metric-lbl">{meta.metricLabel}</div>
                                <div className="dash-zone-card__metric-val">{score}</div>
                            </div>
                            <div className="dash-zone-card__arrow"><ArrowRight/></div>
                        </div>
                        <div className="dash-zone-card__prog">
                            <div className="dash-zone-card__prog-fill" style={{width: `${Math.min(score, 100)}%`}}/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// DIARY
// ════════════════════════════════════════════════════════
function DiaryPanel() {
    const [entries, setEntries] = useState(loadDiary)
    const [showForm, setShowForm] = useState(false)
    const [text, setText] = useState('')
    const [mood, setMood] = useState(null)

    function handleSave() {
        if (!text.trim()) return
        const updated = addDiaryEntry({text: text.trim(), mood})
        setEntries(updated)
        setText('');
        setMood(null);
        setShowForm(false)
    }

    function handleDelete(id) {
        setEntries(deleteDiaryEntry(id))
    }

    return (
        <div className="diary-panel">
            <div className="diary-panel__header">
                <div className="diary-panel__title">Дневник</div>
                <button className="diary-add-btn" onClick={() => setShowForm(v => !v)}>
                    <PlusIcon/> Запись
                </button>
            </div>

            {showForm && (
                <div className="diary-form">
                    <div className="diary-form__moods">
                        {MOODS.map(m => (
                            <button
                                key={m.id}
                                className={`diary-mood-btn${mood === m.id ? ' active' : ''}`}
                                onClick={() => setMood(m.id)}
                            >
                                {m.emoji} {m.label}
                            </button>
                        ))}
                    </div>
                    <textarea
                        className="diary-textarea"
                        placeholder="Как прошла тренировка? Что почувствовал? Что хочешь запомнить..."
                        value={text}
                        onChange={e => setText(e.target.value)}
                        autoFocus
                    />
                    <div className="diary-form__actions">
                        <button className="diary-cancel-btn" onClick={() => {
                            setShowForm(false);
                            setText('');
                            setMood(null)
                        }}>
                            Отмена
                        </button>
                        <button className="diary-save-btn" onClick={handleSave}>Сохранить</button>
                    </div>
                </div>
            )}

            <div className="diary-entries">
                {entries.length === 0 && !showForm && (
                    <div className="diary-empty">
                        Пока нет записей. Добавь первую после тренировки.
                    </div>
                )}
                {entries.map(entry => {
                    const moodData = MOODS.find(m => m.id === entry.mood)
                    return (
                        <div key={entry.id} className="diary-entry">
                            <div className="diary-entry__top">
                                {moodData && <span className="diary-entry__mood">{moodData.emoji}</span>}
                                <span className="diary-entry__date">{formatDate(entry.date)}</span>
                                <button className="diary-entry__delete" onClick={() => handleDelete(entry.id)}>
                                    <TrashIcon/>
                                </button>
                            </div>
                            <div className="diary-entry__text">{entry.text}</div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// FAVORITES
// ════════════════════════════════════════════════════════
function FavsPanel({onAction}) {
    const [favs, setFavs] = useState(loadFavorites)

    function handleRemove(e, fav) {
        e.stopPropagation()
        const updated = toggleFavorite(fav)
        setFavs(updated)
    }

    const TYPE_LABELS = {zone: 'Зона', pose: 'Поза', tip: 'Совет', level: 'Уровень'}
    const TYPE_ACTIONS = {
        zone: (f) => ({type: 'OPEN_ZONE', zoneId: f.id}),
        pose: () => ({type: 'SET_TAB', tab: 'poses'}),
        tip: () => ({type: 'SET_TAB', tab: 'tips'}),
        level: () => ({type: 'SET_TAB', tab: 'levels'}),
    }

    return (
        <div className="favs-panel">
            <div className="favs-panel__title">Избранное</div>
            <div className="favs-list">
                {favs.length === 0 && (
                    <div className="favs-empty">
                        Нажми ❤ на карточке зоны чтобы добавить в избранное
                    </div>
                )}
                {favs.map(fav => (
                    <div
                        key={`${fav.type}-${fav.id}`}
                        className="fav-item"
                        onClick={() => onAction(TYPE_ACTIONS[fav.type]?.(fav))}
                    >
                        <div className="fav-item__dot" style={{background: fav.color || 'var(--purple-glow)'}}/>
                        <div className="fav-item__info">
                            <div className="fav-item__title">{fav.title}</div>
                            <div className="fav-item__type">{TYPE_LABELS[fav.type]}</div>
                        </div>
                        <button className="fav-item__remove" onClick={e => handleRemove(e, fav)}>
                            <XIcon/>
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// NOTIFICATION BANNER
// ════════════════════════════════════════════════════════
function NotifBanner() {
    const [show, setShow] = useState(() => {
        if (!('Notification' in window)) return false
        return Notification.permission === 'default'
    })
    const [notifSettings, setNotifSettings] = useState(loadNotifSettings)

    async function handleEnable() {
        const perm = await requestNotifPermission()
        if (perm === 'granted') {
            const updated = {...notifSettings, enabled: true}
            saveNotifSettings(updated)
            setNotifSettings(updated)
        }
        setShow(false)
    }

    if (!show) return null

    return (
        <div className="notif-banner">
            <span className="notif-banner__icon">🔔</span>
            <div className="notif-banner__text">
                Включи уведомления чтобы не пропускать утренние тренировки
            </div>
            <button className="notif-banner__btn" onClick={handleEnable}>Включить</button>
            <button className="notif-banner__dismiss" onClick={() => setShow(false)}>×</button>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// STATS CHIPS
// ════════════════════════════════════════════════════════
function StatsRow({synergy}) {
    const workoutHistory = loadWorkoutHistory()
    const diary = loadDiary()
    const favs = loadFavorites()
    const today = todayStr()

    const weekDays = getLast7Days()
    const workoutsThisWeek = workoutHistory.filter(h => weekDays.includes(h.date)).length
    const totalDiaryEntries = diary.length
    const streak = (() => {
        let s = 0
        const days = [...weekDays].reverse()
        for (const d of days) {
            if (workoutHistory.find(h => h.date === d)) s++
            else break
        }
        return s
    })()

    const chips = [
        {icon: '🔥', val: `${synergy}`, label: 'Total Synergy'},
        {icon: '📅', val: `${workoutsThisWeek}`, label: 'Тренировок за неделю'},
        {icon: '⚡', val: `${streak}`, label: 'Дней подряд'},
        {icon: '📓', val: `${totalDiaryEntries}`, label: 'Записей в дневнике'},
    ]

    return (
        <div className="dash-stats-row">
            {chips.map((c, i) => (
                <div key={i} className="stat-chip" style={{animationDelay: `${i * 0.06}s`}}>
                    <div className="stat-chip__icon">{c.icon}</div>
                    <div className="stat-chip__val">{c.val}</div>
                    <div className="stat-chip__label">{c.label}</div>
                </div>
            ))}
        </div>
    )
}

// ════════════════════════════════════════════════════════
// TICKER
// ════════════════════════════════════════════════════════
function DashTicker() {
    return (
        <div className="ticker dash-ticker">
            <div className="ticker__track">
                {TICKER_DOUBLED.map((item, i) => (
                    <div className="ticker__item" key={i}>
                        {item.icon} <span>{item.text}</span>
                    </div>
                ))}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// THEME TOGGLE
// ════════════════════════════════════════════════════════
function ThemeToggle({theme, onToggle}) {
    return (
        <div className="theme-toggle">
            <button className={`theme-btn${theme === 'dark' ? ' active' : ''}`} onClick={() => onToggle('dark')}
                    title="Тёмная тема">🌑
            </button>
            <button className={`theme-btn${theme === 'red' ? ' active' : ''}`} onClick={() => onToggle('red')}
                    title="Красная тема">🔴
            </button>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// ROOT DASHBOARD
// ════════════════════════════════════════════════════════
export default function Dashboard() {
    const {state, dispatch} = useApp()
    const [theme, setTheme] = useState(loadTheme)

    // record synergy on load
    useEffect(() => {
        recordSynergy(state.synergy)
    }, [state.synergy])

    // apply theme class to root
    useEffect(() => {
        const root = document.getElementById('root')
        root?.classList.toggle('theme-red', theme === 'red')
        saveTheme(theme)
    }, [theme])

    function handleAction(action) {
        if (!action) return
        dispatch(action)
    }

    const ZONE_STYLES = [
        {},
        {marginTop: '-16px'},
        {},
    ]

    return (
        <div className={`dash${theme === 'red' ? ' theme-red' : ''}`}>
            <div className="dash-bg"/>

            <div className="dash-content">
                {/* Top bar */}
                <div className="dash-topbar">
                    <div className="dash-greeting">
                        <div className="dash-greeting__time">{getWeekday()} · {getGreeting()}</div>
                        <div className="dash-greeting__name">
                            Body <span>Synergy</span>
                        </div>
                    </div>
                    <ThemeToggle theme={theme} onToggle={setTheme}/>
                </div>

                {/* Notifications */}
                <NotifBanner/>

                {/* Search */}
                <SearchBar onAction={handleAction}/>

                {/* Synergy row */}
                <div className="dash-synergy-row">
                    <div className="synergy-card">
                        <div className="synergy-card__glow"/>
                        <div className="synergy-card__label">TOTAL SYNERGY</div>
                        <div className="synergy-card__number">{state.synergy}</div>
                        <div className="synergy-card__sub">
                            <span className="synergy-card__change">↑ +{state.synergy - 69} за всё время</span>
                        </div>
                    </div>
                    <SynergyChart currentSynergy={state.synergy}/>
                </div>

                {/* Zone cards */}
                <div className="dash-zones">
                    {Object.values(ZONES).map((zone, i) => (
                        <ZoneCard key={zone.id} zone={zone} style={ZONE_STYLES[i]}/>
                    ))}
                </div>

                {/* Stats chips */}
                <StatsRow synergy={state.synergy}/>

                {/* Activity heatmap */}
                <ActivityHeatmap/>

                {/* Diary + Favorites */}
                <div className="dash-bottom">
                    <DiaryPanel/>
                    <FavsPanel onAction={handleAction}/>
                </div>

                {/* Ticker */}
                <DashTicker/>
            </div>
        </div>
    )
}