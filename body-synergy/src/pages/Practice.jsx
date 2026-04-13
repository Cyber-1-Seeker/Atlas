// src/pages/Practice.jsx
import {useState} from 'react'
import '../styles/Practice.css'
import {
    PRACTICE_SECTIONS,
    loadPracticeProgress, toggleTechniqueLog, getTechniqueTriedCount,
} from '../data/practice'

// ── Icons ─────────────────────────────────────────────────
const ChevronDown = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9"/>
    </svg>
)
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
        <polyline points="20 6 9 17 4 12"/>
    </svg>
)

// ════════════════════════════════════════════════════════
// TECHNIQUE CARD
// ════════════════════════════════════════════════════════
function TechniqueCard({tech, section, onToggle}) {
    const [expanded, setExpanded] = useState(false)
    const [activeTab, setActiveTab] = useState('steps')
    const [prog, setProg] = useState(loadPracticeProgress)

    const today = new Date().toISOString().slice(0, 10)
    const todayKey = `${tech.id}-${today}`
    const isDoneToday = !!prog[todayKey]
    const triedTotal = getTechniqueTriedCount(tech.id)

    function handleToggle(e) {
        e.stopPropagation()
        const updated = toggleTechniqueLog(tech.id)
        setProg(updated)
        onToggle()
    }

    const TABS = [
        {id: 'steps', label: 'Шаги'},
        {id: 'why', label: 'Зачем'},
        {id: 'science', label: 'Наука'},
    ]

    return (
        <div className={`technique-card${isDoneToday ? ' done' : ''}${expanded ? ' expanded' : ''}`}>
            <div className="technique-card__header" onClick={() => setExpanded(v => !v)}>
                <div className="technique-card__check" onClick={handleToggle}>
                    {isDoneToday && <CheckIcon/>}
                </div>

                <div className="technique-card__info">
                    <div className="technique-card__name">{tech.name}</div>
                    <div className="technique-card__meta">
            <span className="technique-card__level"
                  style={{borderColor: `${section.color}40`, color: section.color}}>
              Ур.{tech.level}
            </span>
                        <span className="technique-card__duration">⏱ {tech.duration}</span>
                        {triedTotal > 0 && (
                            <span className="technique-card__tries">✓ {triedTotal} раз</span>
                        )}
                    </div>
                </div>

                <div className="technique-card__chevron"><ChevronDown/></div>
            </div>

            {expanded && (
                <div className="technique-detail">
                    <div className="technique-detail__desc">{tech.description}</div>

                    <div className="technique-detail__tabs">
                        {TABS.map(t => (
                            <button key={t.id}
                                    className={`tech-tab${activeTab === t.id ? ' active' : ''}`}
                                    onClick={() => setActiveTab(t.id)}>
                                {t.label}
                            </button>
                        ))}
                    </div>

                    {activeTab === 'steps' && (
                        <div className="technique-detail__steps">
                            {tech.steps.map((step, i) => (
                                <div key={i} className="technique-step">
                                    <div className="technique-step__num"
                                         style={{color: section.color}}>
                                        {i + 1}
                                    </div>
                                    <div className="technique-step__text">{step}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {activeTab === 'why' && (
                        <div className="technique-detail__why">{tech.why}</div>
                    )}

                    {activeTab === 'science' && (
                        <div className="technique-detail__science">
                            {tech.science}
                            {tech.source && (
                                <div className="technique-detail__source">{tech.source}</div>
                            )}
                        </div>
                    )}

                    <div className="technique-detail__actions">
                        <button
                            className={`technique-try-btn technique-try-btn--${isDoneToday ? 'done' : 'idle'}`}
                            onClick={isDoneToday ? undefined : handleToggle}
                        >
                            {isDoneToday
                                ? <><CheckIcon/> Отмечено сегодня</>
                                : '○ Отметить как выполненное сегодня'
                            }
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ════════════════════════════════════════════════════════
// SECTION CARD
// ════════════════════════════════════════════════════════
function SectionCard({section}) {
    const [open, setOpen] = useState(false)
    const [, forceUpdate] = useState(0)

    const prog = loadPracticeProgress()
    const today = new Date().toISOString().slice(0, 10)
    const doneTodayCount = section.techniques.filter(t =>
        prog[`${t.id}-${today}`]
    ).length
    const pct = Math.round((doneTodayCount / section.techniques.length) * 100)

    return (
        <div className={`practice-section${open ? ' open' : ''}`}>
            <div className="practice-section__header" onClick={() => setOpen(v => !v)}>
                <div className="practice-section__icon" style={{
                    background: `${section.color}14`,
                    border: `1px solid ${section.color}30`,
                }}>
                    {section.icon}
                </div>

                <div className="practice-section__info">
                    <div className="practice-section__name" style={{color: section.colorGlow}}>
                        {section.name}
                    </div>
                    <div className="practice-section__tagline">{section.tagline}</div>
                </div>

                <div className="practice-section__meta">
                    <div className="practice-section__count">
                        {section.techniques.length} техник
                    </div>
                    <div className="practice-section__prog-track">
                        <div className="practice-section__prog-fill" style={{
                            width: `${pct}%`,
                            background: section.color,
                            boxShadow: `0 0 6px ${section.color}60`,
                        }}/>
                    </div>
                </div>

                <div className="practice-section__chevron"><ChevronDown/></div>
            </div>

            {open && (
                <div className="techniques-list">
                    {/* Section description */}
                    <div style={{
                        padding: '16px 26px',
                        borderBottom: '1px solid rgba(255,255,255,0.05)',
                        fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.7,
                    }}>
                        {section.description}
                    </div>

                    {section.techniques.map(tech => (
                        <TechniqueCard
                            key={tech.id}
                            tech={tech}
                            section={section}
                            onToggle={() => forceUpdate(n => n + 1)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════
export default function Practice() {
    const prog = loadPracticeProgress()
    const today = new Date().toISOString().slice(0, 10)

    const totalTechniques = PRACTICE_SECTIONS.reduce((a, s) => a + s.techniques.length, 0)
    const doneTodayTotal = PRACTICE_SECTIONS.reduce((a, s) =>
        a + s.techniques.filter(t => prog[`${t.id}-${today}`]).length, 0)
    const totalTried = Object.keys(prog).filter(k => prog[k]).length

    return (
        <div className="practice-page page-enter">
            <div className="practice-hero">
                <div className="practice-hero__glow"/>
                <div className="practice-hero__eyebrow">Мастерство</div>
                <div className="practice-hero__title">КОНТРОЛЬ И ПРАКТИКА</div>
                <div className="practice-hero__sub">
                    Техники осознанной мастурбации, контроля оргазма, множественных оргазмов
                    и развития чувствительности. Каждая техника — с научным обоснованием.
                </div>
                <div className="practice-stats">
                    <div className="practice-stat">
                        <div className="practice-stat__val">{PRACTICE_SECTIONS.length}</div>
                        <div className="practice-stat__lbl">Разделов</div>
                    </div>
                    <div className="practice-stat">
                        <div className="practice-stat__val">{totalTechniques}</div>
                        <div className="practice-stat__lbl">Техник</div>
                    </div>
                    <div className="practice-stat">
                        <div className="practice-stat__val">{doneTodayTotal}</div>
                        <div className="practice-stat__lbl">Сегодня</div>
                    </div>
                    <div className="practice-stat">
                        <div className="practice-stat__val">{totalTried}</div>
                        <div className="practice-stat__lbl">Всего сессий</div>
                    </div>
                </div>
            </div>

            <div className="practice-sections">
                {PRACTICE_SECTIONS.map(section => (
                    <SectionCard key={section.id} section={section}/>
                ))}
            </div>
        </div>
    )
}