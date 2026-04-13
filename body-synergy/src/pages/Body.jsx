// src/pages/Body.jsx
import {useState, useEffect} from 'react'
import '../styles/Body.css'
import {
    BLOCKS, MEASUREMENTS, BLOCK_WEIGHTS,
    computeBlockScore, computeTotalScore, getScoreLabel,
    loadBodyValues, saveBodyValues,
} from '../data/body'

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

// ── Score color ───────────────────────────────────────────
function scoreColor(score) {
    if (score === null) return 'var(--text-muted)'
    if (score >= 85) return '#fbbf24'
    if (score >= 70) return '#4ade80'
    if (score >= 55) return '#60a5fa'
    if (score >= 40) return '#a855f7'
    return '#e8304a'
}

// ════════════════════════════════════════════════════════
// MEASUREMENT ROW
// ════════════════════════════════════════════════════════
function MeasRow({m, value, blockColor, allValues, onSave}) {
    const [expanded, setExpanded] = useState(false)
    const [activeTab, setActiveTab] = useState('howto')
    const [inputVal, setInputVal] = useState(value !== undefined ? String(value) : '')
    const [saved, setSaved] = useState(false)

    const score = value !== undefined && value !== ''
        ? Math.round(m.scoring(Number(value), allValues))
        : null

    function handleSave() {
        if (!inputVal) return
        onSave(m.id, Number(inputVal))
        setSaved(true)
        setTimeout(() => setSaved(false), 2000)
    }

    const scoreC = scoreColor(score)

    return (
        <div className={`meas-row${expanded ? ' expanded' : ''}`}>
            <div className="meas-row__header" onClick={() => setExpanded(v => !v)}>
                <span className="meas-row__icon">{m.icon}</span>
                <div className="meas-row__info">
                    <div className="meas-row__name">{m.name}</div>
                    <div className="meas-row__optimal">Оптимум: {m.optimal}</div>
                </div>

                {/* Score bar */}
                <div className="meas-row__score">
                    <div className="meas-score-bar">
                        <div className="meas-score-fill" style={{
                            width: score !== null ? `${score}%` : '0%',
                            background: scoreC,
                            boxShadow: score !== null ? `0 0 6px ${scoreC}60` : 'none',
                        }}/>
                    </div>
                    <div className="meas-row__score-num" style={{color: scoreC}}>
                        {score !== null ? score : '—'}
                    </div>
                </div>

                {/* Input */}
                <div className="meas-row__input-wrap" onClick={e => e.stopPropagation()}>
                    <input
                        className="meas-input"
                        type="number"
                        placeholder="—"
                        value={inputVal}
                        onChange={e => {
                            setInputVal(e.target.value);
                            setSaved(false)
                        }}
                        style={{borderColor: inputVal ? `${blockColor}50` : undefined}}
                    />
                    <span className="meas-unit">{m.unit}</span>
                    <button
                        className={`meas-save meas-save--${saved ? 'saved' : 'idle'}`}
                        onClick={handleSave}
                        disabled={saved}
                    >
                        {saved ? <CheckIcon/> : '💾'}
                    </button>
                </div>

                <div className="meas-row__chevron" style={{
                    transform: expanded ? 'rotate(180deg)' : 'none', transition: '.3s',
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                    <ChevronDown/>
                </div>
            </div>

            {expanded && (
                <div className="meas-detail">
                    <div className="meas-detail__tabs">
                        {[
                            {id: 'howto', label: 'Как измерить'},
                            {id: 'research', label: 'Исследования'},
                        ].map(t => (
                            <button key={t.id}
                                    className={`meas-dtab${activeTab === t.id ? ' active' : ''}`}
                                    onClick={() => setActiveTab(t.id)}>
                                {t.label}
                            </button>
                        ))}
                    </div>
                    {activeTab === 'howto' && (
                        <div className="meas-detail__content meas-detail__content--howto">{m.howToMeasure}</div>
                    )}
                    {activeTab === 'research' && (
                        <div className="meas-detail__content meas-detail__content--research">
                            {m.research}
                            <div className="meas-detail__source">{m.source}</div>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ════════════════════════════════════════════════════════
// BLOCK CARD
// ════════════════════════════════════════════════════════
function BlockCard({block, values, allValues, onSave}) {
    const [open, setOpen] = useState(false)
    const blockMeasurements = MEASUREMENTS.filter(m => m.block === block.id)
    const blockScore = computeBlockScore(block.id, values)
    const scoreLabel = getScoreLabel(blockScore)
    const filledCount = blockMeasurements.filter(m =>
        values[m.id] !== undefined && values[m.id] !== ''
    ).length

    return (
        <div className={`body-block${open ? ' open' : ''}`}>
            <div className="body-block__header" onClick={() => setOpen(v => !v)}>
                <div className="body-block__icon" style={{
                    background: `${block.color}15`,
                    border: `1px solid ${block.color}30`,
                }}>
                    {block.icon}
                </div>
                <div className="body-block__info">
                    <div className="body-block__name">{block.name}</div>
                    <div className="body-block__desc">{filledCount}/{blockMeasurements.length} замеров
                        · {block.description}</div>
                </div>
                <div className="body-block__score-badge">
                    <div className="body-block__score-num" style={{color: scoreColor(blockScore)}}>
                        {blockScore !== null ? blockScore : '—'}
                    </div>
                </div>
                <div className="body-block__chevron"><ChevronDown/></div>
            </div>

            {open && (
                <div className="body-measurements">
                    {blockMeasurements.map(m => (
                        <MeasRow
                            key={m.id} m={m}
                            value={values[m.id]}
                            blockColor={block.color}
                            allValues={allValues}
                            onSave={onSave}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ════════════════════════════════════════════════════════
// ROOT PAGE
// ════════════════════════════════════════════════════════
export default function Body() {
    const [values, setValues] = useState(loadBodyValues)
    const {total, blockScores} = computeTotalScore(values)
    const totalLabel = getScoreLabel(total)

    const filledTotal = MEASUREMENTS.filter(m =>
        values[m.id] !== undefined && values[m.id] !== ''
    ).length

    function handleSave(id, val) {
        const updated = {...values, [id]: val}
        setValues(updated)
        saveBodyValues(updated)
    }

    const scoreC = scoreColor(total)

    return (
        <div className="body-page page-enter">
            <div className="body-hero">
                <div className="body-hero__glow"/>
                <div className="body-hero__title">АТЛАС ТЕЛА</div>
                <div className="body-hero__sub">
                    Введи замеры — получи точный балл привлекательности основанный на научных данных и опросах.
                </div>

                <div className="body-score-row">
                    {/* Total score circle */}
                    <div className="body-total-score">
                        <div className="body-score-circle" style={{
                            borderColor: scoreC,
                            boxShadow: `0 0 30px ${scoreC}30, 0 0 60px ${scoreC}15`,
                        }}>
                            <div className="body-score-circle__num">{total !== null ? total : '—'}</div>
                            <div className="body-score-circle__label">Body Score</div>
                        </div>
                        <div className="body-score-meta">
                            <div className="body-score-grade" style={{color: scoreC}}>
                                {totalLabel.label}
                            </div>
                            <div className="body-score-filled">
                                Заполнено {filledTotal} из {MEASUREMENTS.length} замеров
                            </div>
                        </div>
                    </div>

                    {/* Block mini scores */}
                    <div className="body-block-scores">
                        {BLOCKS.map(block => {
                            const bs = blockScores[block.id]
                            const bc = scoreColor(bs)
                            return (
                                <div key={block.id} className="block-score-chip" style={{
                                    borderColor: `${block.color}30`,
                                    background: `${block.color}08`,
                                }}>
                                    <div className="block-score-chip__name" style={{color: block.color}}>
                                        {block.icon} {block.name}
                                    </div>
                                    <div className="block-score-chip__val" style={{color: bc}}>
                                        {bs !== null ? bs : '—'}
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            <div className="body-blocks">
                {BLOCKS.map(block => (
                    <BlockCard
                        key={block.id}
                        block={block}
                        values={values}
                        allValues={values}
                        onSave={handleSave}
                    />
                ))}
            </div>
        </div>
    )
}