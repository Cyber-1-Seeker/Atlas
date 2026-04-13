// src/components/Onboarding.jsx
import {useState} from 'react'
import {setOnboarded} from '../data/dashboard'

const STEPS = [
    {
        icon: '🔥',
        color: 'var(--red-glow)',
        title: 'Добро пожаловать в Body Synergy',
        text: 'Это твой личный инструмент для физического и сексуального совершенства. Каждая тренировка, каждый уровень — шаг к полному контролю над своим телом.',
        sub: null,
    },
    {
        icon: '🏠',
        color: 'var(--red-glow)',
        title: 'Главная — твой дашборд',
        text: 'Здесь отображается весь прогресс: синергия, активность за неделю, дневник тренировок, избранное и поиск по всему сайту.',
        sub: 'Нажми Ctrl+K чтобы искать что угодно',
    },
    {
        icon: '⭕',
        color: 'var(--purple-glow)',
        title: 'Уровни — твоя программа роста',
        text: 'Три направления: Руки, Ноги/Таз, Паховая зона. В каждом — поднаправления с уровнями. Вводи свои результаты из воскресных замеров и наблюдай за прогрессом.',
        sub: null,
    },
    {
        icon: '💧',
        color: '#2dd4bf',
        title: 'Тренировки — ежедневная рутина',
        text: '3-дневный цикл повторяется дважды в неделю. Пн-Ср и Чт-Сб. Каждое воскресенье — замер рекордов. Приложение само знает какой день сегодня.',
        sub: 'Как делать → Зачем → Наука → Совет',
    },
    {
        icon: '❤️',
        color: 'var(--blue-glow)',
        title: 'Советы — откровенно и по делу',
        text: 'Научные факты, техники, личные сценарии и дневной фокус. Каждый раз — новый порядок, чтобы не привыкать.',
        sub: null,
    },
    {
        icon: '👥',
        color: 'var(--pink)',
        title: 'Позы — практическое руководство',
        text: 'Фильтры по категории, проникновению, клиторальной стимуляции, БДСМ и игрушкам. Каждая поза — с техникой, советами и связью с твоими тренировками.',
        sub: 'Добавляй свои фото и гифки в poses.js',
    },
]

export default function Onboarding({onClose}) {
    const [step, setStep] = useState(0)
    const current = STEPS[step]
    const isLast = step === STEPS.length - 1

    function handleNext() {
        if (isLast) {
            setOnboarded()
            onClose()
        } else {
            setStep(s => s + 1)
        }
    }

    return (
        <div
            style={{
                position: 'fixed', inset: 0, zIndex: 600,
                background: 'rgba(0,0,0,0.85)',
                backdropFilter: 'blur(14px)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                padding: '20px',
                animation: 'fadeIn 0.25s ease',
            }}
            onClick={e => e.target === e.currentTarget && onClose()}
        >
            <div style={{
                background: 'var(--bg-card)',
                border: '1px solid rgba(255,255,255,0.09)',
                borderRadius: '28px',
                padding: '44px 40px',
                maxWidth: '480px', width: '100%',
                animation: 'slideUp 0.35s var(--ease)',
                position: 'relative',
            }}>
                {/* Close */}
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute', top: 20, right: 20,
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '50%', width: 32, height: 32,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', color: 'var(--text-muted)', fontSize: 16,
                    }}
                >×
                </button>

                {/* Step dots */}
                <div style={{display: 'flex', gap: 6, marginBottom: 32}}>
                    {STEPS.map((_, i) => (
                        <div
                            key={i}
                            style={{
                                height: 3, borderRadius: 100,
                                flex: i === step ? 3 : 1,
                                background: i === step ? current.color : 'rgba(255,255,255,0.1)',
                                transition: 'all 0.3s var(--ease)',
                            }}
                        />
                    ))}
                </div>

                {/* Icon */}
                <div style={{
                    width: 72, height: 72, borderRadius: 20,
                    background: `${current.color}15`,
                    border: `1px solid ${current.color}30`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 32, marginBottom: 24,
                    boxShadow: `0 0 24px ${current.color}20`,
                }}>
                    {current.icon}
                </div>

                {/* Content */}
                <div style={{
                    fontFamily: 'Unbounded, sans-serif',
                    fontSize: 20, fontWeight: 700,
                    color: 'var(--text-primary)',
                    marginBottom: 14, lineHeight: 1.3,
                }}>
                    {current.title}
                </div>

                <div style={{
                    fontSize: 14, color: 'var(--text-secondary)',
                    lineHeight: 1.75, marginBottom: current.sub ? 12 : 32,
                }}>
                    {current.text}
                </div>

                {current.sub && (
                    <div style={{
                        fontSize: 12, color: 'var(--text-muted)',
                        fontStyle: 'italic', marginBottom: 32,
                        paddingLeft: 12,
                        borderLeft: `2px solid rgba(255,255,255,0.1)`,
                    }}>
                        {current.sub}
                    </div>
                )}

                {/* Buttons */}
                <div style={{display: 'flex', gap: 10}}>
                    {step > 0 && (
                        <button
                            onClick={() => setStep(s => s - 1)}
                            style={{
                                padding: '12px 20px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.06)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                color: 'var(--text-secondary)', fontWeight: 600,
                                fontSize: 13, cursor: 'pointer',
                                fontFamily: 'Manrope, sans-serif', transition: 'all 0.2s',
                            }}
                        >
                            Назад
                        </button>
                    )}
                    <button
                        onClick={handleNext}
                        style={{
                            flex: 1, padding: '13px 20px', borderRadius: 12,
                            background: current.color === 'var(--red-glow)' ? 'var(--red)' : current.color,
                            border: 'none', color: '#fff',
                            fontFamily: 'Manrope, sans-serif',
                            fontWeight: 700, fontSize: 14,
                            cursor: 'pointer', transition: 'all 0.2s',
                            boxShadow: `0 4px 20px ${current.color}30`,
                        }}
                    >
                        {isLast ? 'Начать' : 'Далее →'}
                    </button>
                </div>

                {/* Step counter */}
                <div style={{
                    textAlign: 'center', marginTop: 16,
                    fontSize: 11, color: 'var(--text-muted)',
                }}>
                    {step + 1} / {STEPS.length}
                </div>
            </div>
        </div>
    )
}