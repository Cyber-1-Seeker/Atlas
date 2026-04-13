// src/pages/Workout.jsx
import {useState, useEffect, useRef, useCallback} from 'react'
import '../styles/Workout.css'
import {PROGRAM, SUNDAY_TESTS, getTodaySchedule} from '../data/workout.js'

// ── localStorage keys ────────────────────────────────────
const SK_DONE = 'ws_done_v1'    // { 'day1-s1-ex1-2024-01-15': true }
const SK_TIMER = 'ws_session_v1' // { date, seconds }
const SK_SUNDAY = 'ws_sunday_v1'  // { 'finger_speed-2024-01-21': 95 }

function todayKey() {
    return new Date().toISOString().slice(0, 10)
}

// ── Icons ─────────────────────────────────────────────────
const PlayIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <polygon points="5 3 19 12 5 21 5 3"/>
    </svg>
)
const StopIcon = () => (
    <svg viewBox="0 0 24 24" fill="currentColor">
        <rect x="3" y="3" width="18" height="18" rx="2"/>
    </svg>
)
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
)
const ChevronDown = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9"/>
    </svg>
)
const ClockIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <polyline points="12 6 12 12 16 14"/>
    </svg>
)
const SaveIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M19 21H5a2 2 0 01-2-2V5a2 2 0 012-2h11l5 5v11a2 2 0 01-2 2z"/>
        <polyline points="17 21 17 13 7 13 7 21"/>
    </svg>
)

// ── Format time ───────────────────────────────────────────
function fmtSec(s) {
    const m = Math.floor(s / 60), r = s % 60
    return `${String(m).padStart(2, '0')}:${String(r).padStart(2, '0')}`
}

// ════════════════════════════════════════════════════════
// SESSION TIMER
// ════════════════════════════════════════════════════════
function useSessionTimer() {
    const [running, setRunning] = useState(false)
    const [seconds, setSeconds] = useState(() => {
        try {
            const d = JSON.parse(localStorage.getItem(SK_TIMER))
            if (d && d.date === todayKey()) return d.seconds
        } catch {
        }
        return 0
    })
    const ref = useRef(null)

    useEffect(() => {
        if (running) {
            ref.current = setInterval(() => {
                setSeconds(s => {
                    const next = s + 1
                    localStorage.setItem(SK_TIMER, JSON.stringify({date: todayKey(), seconds: next}))
                    return next
                })
            }, 1000)
        } else {
            clearInterval(ref.current)
        }
        return () => clearInterval(ref.current)
    }, [running])

    return {running, seconds, start: () => setRunning(true), stop: () => setRunning(false)}
}

// ════════════════════════════════════════════════════════
// EXERCISE TIMER (countdown)
// ════════════════════════════════════════════════════════
function ExerciseTimer({duration}) {
    const [rem, setRem] = useState(duration)
    const [running, setRunning] = useState(false)
    const [done, setDone] = useState(false)
    const ref = useRef(null)

    useEffect(() => () => clearInterval(ref.current), [])

    function toggle() {
        if (done) {
            setRem(duration);
            setDone(false);
            setRunning(false);
            return
        }
        if (running) {
            clearInterval(ref.current);
            setRunning(false);
            return
        }
        setRunning(true)
        ref.current = setInterval(() => {
            setRem(prev => {
                if (prev <= 1) {
                    clearInterval(ref.current)
                    setRunning(false);
                    setDone(true)
                    if (navigator.vibrate) navigator.vibrate([200, 100, 200])
                    return 0
                }
                return prev - 1
            })
        }, 1000)
    }

    const cls = done ? 'done-t' : running ? 'running' : ''
    const label = done ? '✓ Готово!' : fmtSec(rem)

    return (
        <div className="exercise-timer">
            <div className={`exercise-timer__display ${cls}`}>{label}</div>
            <button
                className={`exercise-timer__btn ${running ? 'exercise-timer__btn--stop' : 'exercise-timer__btn--start'}`}
                onClick={toggle}
            >
                {running ? <StopIcon/> : done ? '↺' : <PlayIcon/>}
                {running ? 'Стоп' : done ? 'Заново' : 'Пуск'}
            </button>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// EXERCISE ROW
// ════════════════════════════════════════════════════════
function ExerciseRow({ex, sectionColor, dayId, sectionId, onToggleDone}) {
    const [expanded, setExpanded] = useState(false)
    const [activeTab, setActiveTab] = useState('howto')

    const doneKey = `${dayId}-${sectionId}-${ex.id}-${todayKey()}`
    const [isDone, setIsDone] = useState(() => {
        try {
            return !!JSON.parse(localStorage.getItem(SK_DONE))?.[doneKey]
        } catch {
            return false
        }
    })

    function handleCheck(e) {
        e.stopPropagation()
        const next = !isDone
        setIsDone(next)
        try {
            const all = JSON.parse(localStorage.getItem(SK_DONE)) || {}
            all[doneKey] = next
            localStorage.setItem(SK_DONE, JSON.stringify(all))
        } catch {
        }
        onToggleDone(doneKey, next)
    }

    const goalColors = {
        'Скорость': {bg: 'rgba(232,48,74,0.1)', border: 'rgba(232,48,74,0.25)', color: 'var(--red-glow)'},
        'Точность': {bg: 'rgba(139,60,255,0.1)', border: 'rgba(139,60,255,0.25)', color: 'var(--purple-glow)'},
        'Выносливость': {bg: 'rgba(59,130,246,0.1)', border: 'rgba(59,130,246,0.25)', color: 'var(--blue-glow)'},
        'Сила': {bg: 'rgba(232,48,74,0.1)', border: 'rgba(232,48,74,0.25)', color: 'var(--red-glow)'},
        'Контроль': {bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', color: 'var(--gold-glow)'},
    }
    const gc = goalColors[ex.goal] || goalColors['Контроль']

    const TABS = [
        {id: 'howto', label: 'Как делать'},
        {id: 'why', label: 'Зачем'},
        {id: 'science', label: 'Наука'},
        {id: 'tip', label: 'Совет'},
    ]

    return (
        <div className={`exercise-row${isDone ? ' done' : ''}${expanded ? ' expanded' : ''}`}>
            <div className="exercise-row__header" onClick={() => setExpanded(v => !v)}>
                <div className="exercise-row__check" onClick={handleCheck}>
                    {isDone && <CheckIcon/>}
                </div>

                <div className="exercise-row__name">{ex.name}</div>

                <span
                    className="exercise-row__goal"
                    style={{background: gc.bg, borderColor: gc.border, color: gc.color}}
                >
          {ex.goal}
        </span>

                <span className="exercise-row__reps">
          {ex.duration ? fmtSec(ex.duration) : ex.reps}
        </span>

                <div className="exercise-row__chevron"><ChevronDown/></div>
            </div>

            {expanded && (
                <div className="exercise-detail">
                    <div className="exercise-detail__tabs">
                        {TABS.map(t => (
                            <button
                                key={t.id}
                                className={`detail-tab${activeTab === t.id ? ' active' : ''}`}
                                onClick={() => setActiveTab(t.id)}
                            >
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'howto' && <div className="detail-content detail-content--howto">{ex.howTo}</div>}
                    {activeTab === 'why' && <div className="detail-content">{ex.why}</div>}
                    {activeTab === 'science' &&
                        <div className="detail-content detail-content--science">{ex.science}</div>}
                    {activeTab === 'tip' && <div className="detail-content detail-content--tip">{ex.tip}</div>}

                    {ex.duration && <ExerciseTimer duration={ex.duration}/>}
                </div>
            )}
        </div>
    )
}

// ════════════════════════════════════════════════════════
// SECTION CARD
// ════════════════════════════════════════════════════════
function SectionCard({section, dayId}) {
    const [open, setOpen] = useState(false)
    const [doneMap, setDoneMap] = useState({})

    const totalEx = section.exercises.length
    const doneCount = Object.values(doneMap).filter(Boolean).length
    const pct = totalEx ? Math.round((doneCount / totalEx) * 100) : 0
    const complete = doneCount === totalEx

    function handleToggle(key, val) {
        setDoneMap(prev => ({...prev, [key]: val}))
    }

    return (
        <div className={`section-card${open ? ' open' : ''}${complete ? ' complete' : ''}`}>
            <div className="section-card__header" onClick={() => setOpen(v => !v)}>
                <div
                    className="section-card__icon-wrap"
                    style={{background: `${section.color}14`, border: `1px solid ${section.color}28`}}
                >
                    {section.icon}
                </div>

                <div className="section-card__info">
                    <div className="section-card__name">{section.name}</div>
                    <div className="section-card__meta">
                        <span>{totalEx}</span> упражнений
                    </div>
                </div>

                <div className="section-card__mini-prog">
                    <div className="section-card__mini-track">
                        <div
                            className="section-card__mini-fill"
                            style={{
                                width: `${pct}%`,
                                background: section.color,
                                boxShadow: `0 0 6px ${section.color}60`
                            }}
                        />
                    </div>
                    <div className="section-card__mini-pct" style={{color: section.color}}>
                        {pct}%
                    </div>
                </div>

                <div className="section-card__chevron"><ChevronDown/></div>
            </div>

            {open && (
                <div className="exercises-list">
                    {section.exercises.map(ex => (
                        <ExerciseRow
                            key={ex.id}
                            ex={ex}
                            sectionColor={section.color}
                            dayId={dayId}
                            sectionId={section.id}
                            onToggleDone={handleToggle}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ════════════════════════════════════════════════════════
// WORKOUT DAY PAGE
// ════════════════════════════════════════════════════════
function WorkoutDayPage({day}) {
    const session = useSessionTimer()
    const [doneKeys, setDoneKeys] = useState({})

    const totalEx = day.sections.reduce((a, s) => a + s.exercises.length, 0)
    const doneCount = Object.values(doneKeys).filter(Boolean).length
    const pct = totalEx ? Math.round((doneCount / totalEx) * 100) : 0

    const WEEKDAYS = ['', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота']
    const weekday = WEEKDAYS[new Date().getDay()] || ''

    const dayColors = {
        day1: {a: 'rgba(168,85,247,0.1)', b: 'rgba(232,48,74,0.06)', badge: '#a855f7'},
        day2: {a: 'rgba(232,48,74,0.12)', b: 'rgba(245,158,11,0.06)', badge: '#e8304a'},
        day3: {a: 'rgba(96,165,250,0.1)', b: 'rgba(139,60,255,0.06)', badge: '#60a5fa'},
    }
    const dc = dayColors[day.id] || dayColors.day1

    return (
        <div className="workout-page">
            {/* Hero */}
            <div className="workout-hero">
                <div
                    className="workout-hero__glow"
                    style={{'--day-color-a': dc.a, '--day-color-b': dc.b}}
                />

                <div className="workout-hero__top">
                    <div className="workout-hero__icon">{day.icon}</div>
                    <span
                        className="workout-hero__day-badge"
                        style={{color: dc.badge, borderColor: `${dc.badge}40`, background: `${dc.badge}12`}}
                    >
            День {day.dayNumber}
          </span>
                    <span className="workout-hero__weekday">{weekday}</span>
                </div>

                <div className="workout-hero__title">{day.name}</div>
                <div className="workout-hero__theme">{day.theme}</div>
                <div className="workout-hero__motivation">{day.motivation}</div>

                <div className="workout-hero__timer-row">
                    <div className={`session-timer${session.running ? '' : ' session-timer--stopped'}`}>
                        <span className="session-timer__dot"/>
                        {fmtSec(session.seconds)}
                    </div>

                    {!session.running
                        ? <button className="workout-start-btn workout-start-btn--start" onClick={session.start}>
                            <PlayIcon/> Начать сессию
                        </button>
                        : <button className="workout-start-btn workout-start-btn--stop" onClick={session.stop}>
                            <StopIcon/> Пауза
                        </button>
                    }
                </div>
            </div>

            {/* Overall progress */}
            <div className="workout-overall-progress">
                <div className="workout-overall-progress__label">
                    <span>Прогресс дня</span>
                    <span className="workout-overall-progress__pct">{doneCount}/{totalEx} · {pct}%</span>
                </div>
                <div className="workout-overall-progress__track">
                    <div className="workout-overall-progress__fill" style={{width: `${pct}%`}}/>
                </div>
            </div>

            {/* Sections */}
            <div className="workout-sections">
                {day.sections.map(section => (
                    <SectionCard
                        key={section.id}
                        section={section}
                        dayId={day.id}
                    />
                ))}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// SUNDAY PAGE
// ════════════════════════════════════════════════════════
function TestCard({test}) {
    const storageKey = `${test.id}-${todayKey()}`
    const [value, setValue] = useState(() => {
        try {
            const all = JSON.parse(localStorage.getItem(SK_SUNDAY)) || {}
            return all[storageKey] || ''
        } catch {
            return ''
        }
    })
    const [saved, setSaved] = useState(() => {
        try {
            const all = JSON.parse(localStorage.getItem(SK_SUNDAY)) || {}
            return !!all[storageKey]
        } catch {
            return false
        }
    })

    function handleSave() {
        if (!value) return
        try {
            const all = JSON.parse(localStorage.getItem(SK_SUNDAY)) || {}
            all[storageKey] = Number(value)
            localStorage.setItem(SK_SUNDAY, JSON.stringify(all))
            setSaved(true)
        } catch {
        }
    }

    const numVal = Number(value) || 0
    const {beginner, intermediate, advanced} = test.target

    // progress to next target
    let levelPct = 0, levelLabel = ''
    if (numVal < beginner) {
        levelPct = Math.round((numVal / beginner) * 100)
        levelLabel = `До начального уровня: ${beginner - numVal} ${test.unit}`
    } else if (numVal < intermediate) {
        levelPct = Math.round(((numVal - beginner) / (intermediate - beginner)) * 100)
        levelLabel = `До среднего уровня: ${intermediate - numVal} ${test.unit}`
    } else if (numVal < advanced) {
        levelPct = Math.round(((numVal - intermediate) / (advanced - intermediate)) * 100)
        levelLabel = `До продвинутого уровня: ${advanced - numVal} ${test.unit}`
    } else {
        levelPct = 100
        levelLabel = '🏆 Продвинутый уровень достигнут!'
    }

    return (
        <div className={`test-card${saved ? ' recorded' : ''}`}>
            <div className="test-card__top">
                <div style={{flex: 1}}>
                    <div className="test-card__name">{test.name}</div>
                    <div className="test-card__howto">{test.howTo}</div>
                    <div className="test-card__why">{test.whyMatters}</div>
                </div>
            </div>

            <div className="test-card__targets">
                <span className="target-badge target-badge--beg">Начало: {beginner}+</span>
                <span className="target-badge target-badge--mid">Средний: {intermediate}+</span>
                <span className="target-badge target-badge--adv">Продвинутый: {advanced}+</span>
            </div>

            <div className="test-card__input-row">
                <input
                    className="test-input"
                    type="number"
                    placeholder="0"
                    value={value}
                    onChange={e => {
                        setValue(e.target.value);
                        setSaved(false)
                    }}
                />
                <span className="test-input-unit">{test.unit}</span>
                <button
                    className={`test-save-btn${saved ? ' test-save-btn--saved' : ' test-save-btn--save'}`}
                    onClick={handleSave}
                    disabled={saved}
                >
                    <SaveIcon/>
                    {saved ? 'Сохранено' : 'Записать'}
                </button>
            </div>

            {numVal > 0 && (
                <div className="test-card__level-progress">
                    <div className="test-card__level-label">{levelLabel}</div>
                    <div className="test-card__level-track">
                        <div className="test-card__level-fill" style={{width: `${Math.min(levelPct, 100)}%`}}/>
                    </div>
                </div>
            )}
        </div>
    )
}

function SundayPage() {
    // group tests by section
    const sections = [...new Set(SUNDAY_TESTS.map(t => t.section))]

    // week stats from localStorage
    const weekStats = (() => {
        try {
            const all = JSON.parse(localStorage.getItem(SK_DONE)) || {}
            const today = new Date()
            // count done entries this week (Mon-Sat)
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() - today.getDay() + 1)
            const weekStartStr = weekStart.toISOString().slice(0, 10)
            const done = Object.keys(all).filter(k => k >= weekStartStr && all[k]).length
            return {done}
        } catch {
            return {done: 0}
        }
    })()

    return (
        <div className="sunday-page">
            <div className="sunday-hero">
                <div className="sunday-hero__glow"/>
                <div className="sunday-hero__label">Воскресный замер</div>
                <div className="sunday-hero__title">Измерь свой прогресс</div>
                <div className="sunday-hero__sub">
                    Выполни каждый тест и запиши результат. Эти цифры — твоя точка отсчёта.
                    Перенеси их в раздел Уровни чтобы увидеть как ты растёшь.
                </div>
            </div>

            <div className="sunday-week-summary">
                <div className="week-stat">
                    <div className="week-stat__label">Упражнений за неделю</div>
                    <div className="week-stat__value">{weekStats.done}</div>
                </div>
                <div className="week-stat">
                    <div className="week-stat__label">Тестов сегодня</div>
                    <div className="week-stat__value">{SUNDAY_TESTS.length}</div>
                </div>
                <div className="week-stat">
                    <div className="week-stat__label">Разделов</div>
                    <div className="week-stat__value">{sections.length}</div>
                </div>
            </div>

            <div className="sunday-tests">
                {sections.map(sec => {
                    const secTests = SUNDAY_TESTS.filter(t => t.section === sec)
                    const first = secTests[0]
                    return (
                        <div key={sec}>
                            <div className="sunday-section-title">
                                {first.sectionIcon} {sec}
                            </div>
                            {secTests.map(test => (
                                <TestCard key={test.id} test={test}/>
                            ))}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// ROOT — picks today's schedule
// ════════════════════════════════════════════════════════
export default function Workout() {
    const schedule = getTodaySchedule()

    if (schedule.type === 'sunday') {
        return <SundayPage/>
    }

    return <WorkoutDayPage day={schedule.day}/>
}