// src/pages/Levels.jsx
import {useState} from 'react'
import '../styles/Levels.css'
import {LEVELS_DATA, ZONES_ORDER} from '../data/levels'

// ── localStorage for user metrics ────────────────────────
const SK_METRICS = 'bs_metrics_v1'

function loadMetrics() {
    try {
        return JSON.parse(localStorage.getItem(SK_METRICS)) || {}
    } catch {
        return {}
    }
}

function saveMetrics(m) {
    try {
        localStorage.setItem(SK_METRICS, JSON.stringify(m))
    } catch {
    }
}

// ── Icons ─────────────────────────────────────────────────
const BackArrow = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="19" y1="12" x2="5" y2="12"/>
        <polyline points="12 19 5 12 12 5"/>
    </svg>
)
const ArrowRight = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12"/>
        <polyline points="12 5 19 12 12 19"/>
    </svg>
)
const PersonIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="8" r="4"/>
        <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
    </svg>
)

// ── Progress helpers ──────────────────────────────────────
function zoneProgress(zone, metrics) {
    const all = zone.subdirections.flatMap(sd => sd.levels)
    if (!all.length) return 0
    let completed = 0
    zone.subdirections.forEach(sd => {
        if (!sd.metricId) return
        const val = metrics[sd.metricId] || 0
        sd.levels.forEach(lvl => {
            if (val >= lvl.minMetric) completed++
        })
    })
    return Math.round((completed / all.length) * 100)
}

function getCurrentLevel(sd, metrics) {
    const val = metrics[sd.metricId] || 0
    let cur = sd.levels[0]
    for (const lvl of sd.levels) {
        if (val >= lvl.minMetric) cur = lvl
    }
    return cur
}

function getLevelProgress(sd, metrics) {
    const val = metrics[sd.metricId] || 0
    for (let i = 0; i < sd.levels.length; i++) {
        const lvl = sd.levels[i]
        const next = sd.levels[i + 1]
        if (!next) return {pct: 100, cur: lvl, next: null, val}
        if (val >= lvl.minMetric && val < next.minMetric) {
            const range = next.minMetric - lvl.minMetric
            const progress = val - lvl.minMetric
            return {pct: Math.round((progress / range) * 100), cur: lvl, next, val}
        }
    }
    return {pct: 0, cur: sd.levels[0], next: sd.levels[1] || null, val}
}

// ════════════════════════════════════════════════════════
// SCREEN 1 — Zone selection
// ════════════════════════════════════════════════════════
function ZoneSelectionScreen({onSelectZone}) {
    const metrics = loadMetrics()
    const bgImages = {hands: '/images/home1.png', legs: '/images/home2.png', groin: '/images/home3.png'}

    return (
        <div className="levels-home page-enter">
            <div className="levels-home__header">
                <div className="levels-home__title">УРОВНИ</div>
                <div className="levels-home__sub">Выбери направление</div>
            </div>
            <div className="levels-zones">
                {ZONES_ORDER.map(zoneId => {
                    const zone = LEVELS_DATA[zoneId]
                    const pct = zoneProgress(zone, metrics)
                    const totalLevels = zone.subdirections.reduce((a, sd) => a + sd.levels.length, 0)
                    return (
                        <div key={zoneId} className="lz-card" data-zone={zoneId} onClick={() => onSelectZone(zoneId)}>
                            <div className="lz-card__bg" style={{backgroundImage: `url('${bgImages[zoneId]}')`}}/>
                            <div className="lz-card__glow"/>
                            <div className="lz-card__content">
                                <div className="lz-card__emoji">{zone.emoji}</div>
                                <div className="lz-card__name">{zone.name}</div>
                                <div className="lz-card__desc">{zone.tagline}</div>
                                <div className="lz-card__progress">
                                    <div className="lz-card__prog-track">
                                        <div className="lz-card__prog-fill" style={{width: `${pct}%`}}/>
                                    </div>
                                    <span className="lz-card__prog-pct">{pct}%</span>
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// SCREEN 2 — Subdirections
// ════════════════════════════════════════════════════════
function SubdirectionsScreen({zoneId, onBack, onSelectSub}) {
    const zone = LEVELS_DATA[zoneId]
    const metrics = loadMetrics()
    const bgImages = {hands: '/images/home1.png', legs: '/images/home2.png', groin: '/images/home3.png'}

    const totalDone = zone.subdirections.reduce((a, sd) => {
        if (!sd.metricId) return a
        const val = metrics[sd.metricId] || 0
        return a + sd.levels.filter(l => val >= l.minMetric).length
    }, 0)
    const totalLevels = zone.subdirections.reduce((a, sd) => a + sd.levels.length, 0)

    return (
        <div className="subdirs-page page-enter">
            <div className="subdirs-hero">
                <div className="subdirs-hero__bg" style={{backgroundImage: `url('${bgImages[zoneId]}')`}}/>
                <div className="subdirs-hero__overlay"/>
                <button className="subdirs-back" onClick={onBack}><BackArrow/> Назад</button>
                <div className="subdirs-hero__badge" style={{borderColor: zone.colorRaw, color: zone.colorRaw}}>
                    {totalDone}/{totalLevels}
                </div>
                <div className="subdirs-hero__name">{zone.name}</div>
                <div className="subdirs-hero__tagline">{zone.tagline}</div>
            </div>

            <div className="subdirs-grid">
                {zone.subdirections.map(sd => {
                    const prog = sd.metricId ? getLevelProgress(sd, metrics) : null
                    return (
                        <div key={sd.id} className="sd-card" onClick={() => onSelectSub(sd.id)}
                             style={{'--sd-color': sd.color}}>
                            <div className="sd-card__bg-img" style={{backgroundImage: `url('${bgImages[zoneId]}')`}}/>
                            <div className="sd-card__bg-color"
                                 style={{background: `radial-gradient(ellipse 100% 100% at 50% 100%, ${sd.color}28 0%, transparent 70%)`}}/>
                            <div className="sd-card__content">
                                <div className="sd-card__top">
                                    <div className="sd-card__icon"
                                         style={{background: `${sd.color}18`, border: `1px solid ${sd.color}35`}}>
                                        {sd.icon}
                                    </div>
                                    <div>
                                        <div className="sd-card__name">{sd.name}</div>
                                        <div className="sd-card__desc">{sd.description}</div>
                                    </div>
                                </div>
                                {prog && (
                                    <div style={{marginTop: 14}}>
                                        <div style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            fontSize: 11,
                                            color: 'var(--text-muted)',
                                            marginBottom: 6
                                        }}>
                                            <span>Ур.{prog.cur.level} — {prog.cur.name}</span>
                                            <span style={{color: sd.color, fontWeight: 700}}>{prog.pct}%</span>
                                        </div>
                                        <div style={{
                                            height: 3,
                                            borderRadius: 100,
                                            background: 'rgba(255,255,255,0.06)',
                                            overflow: 'hidden'
                                        }}>
                                            <div style={{
                                                height: '100%',
                                                width: `${prog.pct}%`,
                                                background: sd.color,
                                                borderRadius: 100,
                                                boxShadow: `0 0 6px ${sd.color}60`,
                                                transition: 'width .5s'
                                            }}/>
                                        </div>
                                        {prog.next && (
                                            <div style={{fontSize: 10, color: 'var(--text-muted)', marginTop: 4}}>
                                                До
                                                Ур.{prog.next.level}: {prog.next.minMetric - prog.val} {sd.metricLabel}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="sd-card__levels" style={{marginTop: 12}}>
                                    {sd.levels.map(l => {
                                        const val = metrics[sd.metricId] || 0
                                        const unlocked = !sd.metricId || val >= l.minMetric
                                        return (
                                            <span key={l.id}
                                                  className={`sd-level-pill sd-level-pill--${unlocked ? 'done' : 'locked'}`}>
                        {unlocked ? '✓' : '○'} Ур.{l.level}
                      </span>
                                        )
                                    })}
                                </div>
                            </div>
                            <div className="sd-card__arrow"><ArrowRight/></div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// LEVEL CARD — single level with scenario + metric input
// ════════════════════════════════════════════════════════
function LevelCard({lvl, sd, zoneId, metrics, onMetricSave, idx}) {
    const [showScenario, setShowScenario] = useState(false)
    const [showAbilities, setShowAbilities] = useState(false)
    const val = metrics[sd.metricId] || 0
    const isReached = !sd.metricId || val >= lvl.minMetric
    const isNext = !isReached && (idx === 0 || (metrics[sd.metricId] || 0) >= sd.levels[idx - 1]?.minMetric)

    const statusLabel = !sd.metricId ? 'Субъективный' : isReached ? 'Достигнут' : isNext ? 'Следующий' : 'Недоступен'
    const statusColor = isReached ? '#4ade80' : isNext ? 'var(--red-glow)' : 'var(--text-muted)'
    const borderColor = isReached ? 'rgba(34,197,94,0.2)' : isNext ? 'rgba(232,48,74,0.18)' : 'rgba(255,255,255,0.06)'

    // progress within this level
    let lvlPct = 0
    if (sd.metricId && lvl.maxMetric !== 999) {
        const range = lvl.maxMetric - lvl.minMetric
        lvlPct = Math.min(100, Math.round(((val - lvl.minMetric) / range) * 100))
    } else if (isReached) {
        lvlPct = 100
    }

    return (
        <div className="lvl-card" style={{borderColor, animationDelay: `${idx * 0.07}s`}}>
            <div className="lvl-card__top">
                <span className="lvl-card__badge">УРОВЕНЬ {lvl.level}</span>
                <span className="lvl-card__time" style={{display: 'flex', alignItems: 'center', gap: 5}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{width: 13, height: 13}}>
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
                    {lvl.duration}
        </span>
                <span className="lvl-card__status"
                      style={{color: statusColor, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 5}}>
          <span style={{
              width: 6, height: 6, borderRadius: '50%', background: statusColor, display: 'inline-block',
              boxShadow: isNext ? `0 0 6px var(--red)` : 'none',
              animation: isNext ? 'sessionBlink 2s infinite' : 'none'
          }}/>
                    {statusLabel}
        </span>
            </div>

            <div className="lvl-card__body">
                <div>
                    <div className="lvl-card__name">{lvl.name}</div>
                    <div className="lvl-card__desc">{lvl.description}</div>

                    {/* Abilities toggle */}
                    <button
                        onClick={() => setShowAbilities(v => !v)}
                        style={{
                            marginTop: 12, background: 'none', border: 'none', cursor: 'pointer',
                            fontSize: 12, color: 'var(--text-muted)', fontFamily: 'Manrope,sans-serif',
                            display: 'flex', alignItems: 'center', gap: 5, padding: 0
                        }}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                             style={{
                                 width: 13,
                                 height: 13,
                                 transform: showAbilities ? 'rotate(180deg)' : 'none',
                                 transition: '.2s'
                             }}>
                            <polyline points="6 9 12 15 18 9"/>
                        </svg>
                        {showAbilities ? 'Скрыть навыки' : 'Что ты умеешь на этом уровне'}
                    </button>

                    {showAbilities && (
                        <div style={{marginTop: 10, display: 'flex', flexDirection: 'column', gap: 6}}>
                            {lvl.abilities.map((a, i) => (
                                <div key={i}
                                     style={{display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-secondary)'}}>
                                    <span style={{color: sd.color, fontWeight: 700, flexShrink: 0}}>✦</span>
                                    {a}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Scenario toggle */}
                    <button
                        onClick={() => setShowScenario(v => !v)}
                        style={{
                            marginTop: 12, padding: '7px 14px', borderRadius: 100,
                            background: showScenario ? `${sd.color}18` : 'rgba(255,255,255,0.05)',
                            border: `1px solid ${showScenario ? `${sd.color}35` : 'rgba(255,255,255,0.1)'}`,
                            color: showScenario ? sd.color : 'var(--text-muted)',
                            fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            fontFamily: 'Manrope,sans-serif', transition: 'all .2s',
                            display: 'inline-flex', alignItems: 'center', gap: 6
                        }}>
                        🎬 {showScenario ? 'Скрыть сценарий' : 'Сценарий этого уровня'}
                    </button>

                    {showScenario && (
                        <div style={{
                            marginTop: 12, padding: '16px 18px',
                            background: 'linear-gradient(135deg,rgba(232,48,74,.06),rgba(139,60,255,.06))',
                            border: '1px solid rgba(232,48,74,.12)', borderRadius: 12,
                            fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.8,
                            fontStyle: 'italic', animation: 'fadeUp .3s ease'
                        }}>
                            {lvl.scenario}
                        </div>
                    )}

                    {lvl.tip && (
                        <div className="lvl-card__tip" style={{marginTop: 12}}>{lvl.tip}</div>
                    )}
                </div>

                {/* Right: metric input + progress */}
                <div className="lvl-card__right">
                    {sd.metricId && (
                        <>
                            <div className="lvl-card__prog-label">
                                <span>{isReached ? 'Уровень пройден' : 'Прогресс к уровню'}</span>
                                <span className="lvl-card__prog-pct"
                                      style={{color: sd.color}}>{Math.max(0, lvlPct)}%</span>
                            </div>
                            <div className="lvl-card__prog-track">
                                <div className="lvl-card__prog-fill" style={{
                                    width: `${Math.max(0, Math.min(100, lvlPct))}%`,
                                    background: isReached
                                        ? 'linear-gradient(90deg,#22c55e,#4ade80)'
                                        : `linear-gradient(90deg,${sd.color},${sd.colorSecondary})`,
                                }}/>
                            </div>
                            <div style={{fontSize: 11, color: 'var(--text-muted)', marginBottom: 14, marginTop: 4}}>
                                Требуется: {lvl.minMetric}+ {sd.metricLabel}
                            </div>
                        </>
                    )}

                    {/* Metric input for this subdirection */}
                    {sd.metricId && (
                        <MetricInput sd={sd} metrics={metrics} onSave={onMetricSave}/>
                    )}

                    {!sd.metricId && (
                        <div style={{fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', lineHeight: 1.6}}>
                            Оцени себя субъективно после практики
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

// ── Metric input ──────────────────────────────────────────
function MetricInput({sd, metrics, onSave}) {
    const [val, setVal] = useState(metrics[sd.metricId] || '')
    const [saved, setSaved] = useState(false)

    function handleSave() {
        if (!val) return
        onSave(sd.metricId, Number(val))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    return (
        <div style={{display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap'}}>
            <input
                type="number" value={val}
                onChange={e => {
                    setVal(e.target.value);
                    setSaved(false)
                }}
                placeholder="0"
                style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid rgba(255,255,255,${val ? '0.18' : '0.1'})`,
                    borderRadius: 9, padding: '9px 12px',
                    fontSize: 16, fontWeight: 700, fontFamily: 'Unbounded,sans-serif',
                    color: 'var(--text-primary)', width: 100, textAlign: 'center',
                    transition: 'border-color .2s'
                }}
            />
            <span style={{fontSize: 11, color: 'var(--text-muted)', flex: 1}}>{sd.metricLabel}</span>
            <button
                onClick={handleSave}
                style={{
                    padding: '9px 16px', borderRadius: 9,
                    background: saved ? 'rgba(34,197,94,0.12)' : 'rgba(255,255,255,0.06)',
                    border: `1px solid ${saved ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.12)'}`,
                    color: saved ? '#4ade80' : 'var(--text-secondary)',
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    fontFamily: 'Manrope,sans-serif', transition: 'all .2s',
                    display: 'flex', alignItems: 'center', gap: 5
                }}>
                {saved ? '✓ Сохранено' : '💾 Записать'}
            </button>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// SCREEN 3 — Level list
// ════════════════════════════════════════════════════════
function LevelListScreen({zoneId, subdirId, onBack, onBackToZones}) {
    const zone = LEVELS_DATA[zoneId]
    const subdir = zone.subdirections.find(sd => sd.id === subdirId)
    const [metrics, setMetrics] = useState(loadMetrics)
    const bgImages = {hands: '/images/home1.png', legs: '/images/home2.png', groin: '/images/home3.png'}

    function handleMetricSave(metricId, val) {
        const updated = {...metrics, [metricId]: val}
        setMetrics(updated)
        saveMetrics(updated)
    }

    const prog = subdir.metricId ? getLevelProgress(subdir, metrics) : null

    return (
        <div className="levellist-page page-enter">
            <div className="levellist-hero">
                <div className="levellist-hero__bg" style={{backgroundImage: `url('${bgImages[zoneId]}')`}}/>
                <div className="levellist-hero__overlay"/>
                <div className="levellist-hero__lvl-badge"
                     style={{borderColor: subdir.color, color: subdir.color}}>
                    {subdir.icon}
                </div>
                <div className="levellist-hero__name">{subdir.name}</div>
                <div className="levellist-hero__desc">{subdir.description}</div>

                {/* Current metric display */}
                {subdir.metricId && prog && (
                    <div style={{
                        position: 'relative', zIndex: 2, marginTop: 16,
                        padding: '10px 20px', borderRadius: 100,
                        background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)',
                        border: `1px solid ${subdir.color}30`,
                        display: 'flex', alignItems: 'center', gap: 12, fontSize: 13
                    }}>
                        <span style={{color: 'var(--text-muted)'}}>Твой результат:</span>
                        <span style={{
                            fontFamily: 'Unbounded,sans-serif', fontWeight: 700,
                            color: subdir.color, fontSize: 16
                        }}>
              {metrics[subdir.metricId] || 0}
            </span>
                        <span style={{color: 'var(--text-muted)'}}>{subdir.metricLabel}</span>
                        <span style={{color: 'var(--text-muted)', margin: '0 4px'}}>·</span>
                        <span style={{color: 'var(--text-secondary)'}}>Ур.{prog.cur.level} — {prog.cur.name}</span>
                    </div>
                )}
            </div>

            <div className="levellist-cards">
                {subdir.levels.map((lvl, idx) => (
                    <LevelCard
                        key={lvl.id} lvl={lvl} sd={subdir}
                        zoneId={zoneId} metrics={metrics}
                        onMetricSave={handleMetricSave} idx={idx}
                    />
                ))}
            </div>

            <div className="levellist-footer">
                <button className="levellist-footer__btn levellist-footer__btn--back" onClick={onBack}>
                    <BackArrow/> Назад
                </button>
                <button className="levellist-footer__btn levellist-footer__btn--body" onClick={onBackToZones}>
                    <PersonIcon/> К телу
                </button>
            </div>
        </div>
    )
}

// ════════════════════════════════════════════════════════
// ROOT
// ════════════════════════════════════════════════════════
export default function Levels() {
    const [screen, setScreen] = useState('zones')
    const [activeZone, setActiveZone] = useState(null)
    const [activeSubdir, setActiveSubdir] = useState(null)

    return screen === 'zones'
        ? <ZoneSelectionScreen onSelectZone={id => {
            setActiveZone(id);
            setScreen('subdirs')
        }}/>
        : screen === 'subdirs'
            ? <SubdirectionsScreen zoneId={activeZone}
                                   onBack={() => setScreen('zones')}
                                   onSelectSub={id => {
                                       setActiveSubdir(id);
                                       setScreen('levels')
                                   }}/>
            : <LevelListScreen zoneId={activeZone} subdirId={activeSubdir}
                               onBack={() => {
                                   setScreen('subdirs');
                                   setActiveSubdir(null)
                               }}
                               onBackToZones={() => {
                                   setScreen('zones');
                                   setActiveZone(null);
                                   setActiveSubdir(null)
                               }}/>
}