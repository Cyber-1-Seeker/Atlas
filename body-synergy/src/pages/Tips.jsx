// src/pages/Tips.jsx
import {useState, useEffect} from 'react'
import '../styles/Tips.css'
import {DAILY_FOCUS, WHY_IT_WORKS, TIPS, SCENARIOS} from '../data/tips'

const RefreshIcon = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="23 4 23 10 17 10"/>
        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
)
const ChevronDown = () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="6 9 12 15 18 9"/>
    </svg>
)

function DailyFocus() {
    const [idx, setIdx] = useState(() => Math.floor(Math.random() * DAILY_FOCUS.length))
    const item = DAILY_FOCUS[idx]

    function refresh() {
        setIdx(i => {
            let next = Math.floor(Math.random() * DAILY_FOCUS.length)
            while (next === i && DAILY_FOCUS.length > 1) next = Math.floor(Math.random() * DAILY_FOCUS.length)
            return next
        })
    }

    return (
        <div className="daily-focus">
            <div className="daily-focus__label">Фокус дня</div>
            <div className="daily-focus__icon">{item.icon}</div>
            <div className="daily-focus__title">{item.title}</div>
            <div className="daily-focus__text">{item.text}</div>
            <button className="daily-focus__refresh" onClick={refresh}>
                <RefreshIcon/> Другой
            </button>
        </div>
    )
}

function WhySection() {
    return (
        <div>
            <div className="tips-section__title">Почему это работает</div>
            <div className="why-scroll">
                {WHY_IT_WORKS.map(item => (
                    <div key={item.id} className="why-card">
                        <div className="why-card__icon">{item.icon}</div>
                        <div className="why-card__title">{item.title}</div>
                        <div className="why-card__text">{item.text}</div>
                        <div className="why-card__source">{item.source}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function TipsSection() {
    // Show random order on each visit
    const [shuffled] = useState(() => [...TIPS].sort(() => Math.random() - 0.5))

    return (
        <div>
            <div className="tips-section__title">Техники и советы</div>
            <div className="tips-grid">
                {shuffled.map(tip => (
                    <div
                        key={tip.id}
                        className="tip-card"
                        style={{'--tip-color': tip.color}}
                    >
                        <div className="tip-card__top">
                            <span className="tip-card__icon">{tip.icon}</span>
                            <span className="tip-card__category">{tip.categoryLabel}</span>
                        </div>
                        <div className="tip-card__title">{tip.title}</div>
                        <div className="tip-card__text">{tip.text}</div>
                    </div>
                ))}
            </div>
        </div>
    )
}

function ScenariosSection() {
    const [openId, setOpenId] = useState(null)

    return (
        <div>
            <div className="tips-section__title">Личные сценарии</div>
            <div className="scenarios-list">
                {SCENARIOS.map(sc => {
                    const isOpen = openId === sc.id
                    return (
                        <div
                            key={sc.id}
                            className={`scenario-card${isOpen ? ' open' : ''}`}
                            onClick={() => setOpenId(isOpen ? null : sc.id)}
                        >
                            <div className="scenario-card__header">
                <span
                    className="scenario-card__mood"
                    style={{
                        color: sc.moodColor,
                        borderColor: `${sc.moodColor}40`,
                        background: `${sc.moodColor}12`,
                    }}
                >
                  {sc.mood}
                </span>
                                <div className="scenario-card__title">{sc.title}</div>
                                <div className="scenario-card__meta">{sc.duration}</div>
                                <div className="scenario-card__chevron"><ChevronDown/></div>
                            </div>

                            {!isOpen && (
                                <div className="scenario-card__preview">{sc.preview}</div>
                            )}

                            {isOpen && (
                                <div className="scenario-card__body">
                                    <div className="scenario-card__text">{sc.text}</div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default function Tips() {
    return (
        <div className="tips-page page-enter">
            <div className="tips-header">
                <div className="tips-header__title">МОТИВАЦИЯ / СОВЕТЫ</div>
                <div className="tips-header__sub">Откровенно. По делу. Без воды.</div>
            </div>

            <DailyFocus/>

            <div className="tips-sections">
                <WhySection/>
                <TipsSection/>
                <ScenariosSection/>
            </div>
        </div>
    )
}