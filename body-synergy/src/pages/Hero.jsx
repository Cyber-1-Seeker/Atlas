// src/pages/Hero.jsx
import '../styles/Hero.css'
import {useApp} from '../context/AppContext'
import {ZONES} from '../data/zones'

const TICKER_ITEMS = [
    {
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ticker__svg">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>,
        text: 'ТВОЯ ЭНЕРГИЯ НА ПИКЕ. НЕ ОСТАНАВЛИВАЙСЯ.',
    },
    {
        icon: <svg viewBox="0 0 24 24" fill="currentColor" className="ticker__svg">
            <path d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z"/>
        </svg>,
        text: 'ЖАР ВНУТРИ ТРЕБУЕТ ВЫХОДА.',
    },
    {
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker__svg">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="3"/>
        </svg>,
        text: 'КАПЛЯ ПОТА — ШАГ К СОВЕРШЕНСТВУ.',
    },
    {
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker__svg">
            <polygon
                points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
        </svg>,
        text: 'КОНТРОЛЬ — ТВОЁ ГЛАВНОЕ ОРУЖИЕ.',
    },
    {
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker__svg">
            <path
                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>,
        text: 'КАЖДОЕ ДВИЖЕНИЕ — ИНВЕСТИЦИЯ В СЕБЯ.',
    },
    {
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker__svg">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        </svg>,
        text: 'СИЛА — ЭТО ПРИВЫЧКА, А НЕ СОСТОЯНИЕ.',
    },
    {
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="ticker__svg">
            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
        </svg>,
        text: 'ГЛУБИНА ЧУВСТВ РОЖДАЕТСЯ В ДИСЦИПЛИНЕ.',
    },
    {
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="ticker__svg">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>,
        text: 'ТЕЛО ПОМНИТ КАЖДУЮ ТРЕНИРОВКУ.',
    },
]

const TICKER_DOUBLED = [...TICKER_ITEMS, ...TICKER_ITEMS]

function ZoneCard({zone}) {
    const {state, dispatch} = useApp()
    const score = state.scores[zone.id]

    return (
        <div
            className="zone-card"
            data-zone={zone.id}
            onClick={() => dispatch({type: 'OPEN_ZONE', zoneId: zone.id})}
        >
            <div className="zone-card__bg"/>
            <div className="zone-card__overlay"/>
            <div className="zone-card__hover-glow"/>

            <div className="zone-card__top">
                <span className="zone-card__dot"/>
                <div className="zone-card__title">{zone.name}</div>
            </div>

            <div className="zone-card__bottom">
                <div>
                    <div className="zone-card__metric-label">{zone.metricLabel}</div>
                    <div className="zone-card__metric-value">{score}</div>
                </div>
                <div className="zone-card__arrow">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                        <polyline points="12 5 19 12 12 19"/>
                    </svg>
                </div>
            </div>
        </div>
    )
}

export default function Hero() {
    const {state} = useApp()

    return (
        <div className="hero-page page-enter">
            <div className="hero-page__bg"/>

            <div className="hero-page__session">
                <span className="hero-page__session-dot"/>
                SESSION ACTIVE
            </div>

            <div className="hero-section">
                <div className="orb">
                    <div className="orb__ring orb__ring--3"/>
                    <div className="orb__ring orb__ring--2"/>
                    <div className="orb__ring orb__ring--1"/>
                    <div className="orb__core">
                        <span className="orb__number">{state.synergy}</span>
                        <span className="orb__label">TOTAL SYNERGY</span>
                    </div>
                </div>

                <div className="hero-copy">
                    <h1 className="hero-copy__headline">
                        Почувствуй свой{' '}
                        <span className="hero-copy__accent">предел</span>. И шагни дальше.
                    </h1>
                    <p className="hero-copy__sub">
                        Твоё тело — идеальный инструмент. Каждое движение приближает
                        к абсолютной власти над собой.
                    </p>
                </div>
            </div>

            <div className="cards-grid">
                {Object.values(ZONES).map(zone => (
                    <ZoneCard key={zone.id} zone={zone}/>
                ))}
            </div>

            <div className="ticker">
                <div className="ticker__track">
                    {TICKER_DOUBLED.map((item, i) => (
                        <div className="ticker__item" key={i}>
                            {item.icon}
                            <span>{item.text}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}