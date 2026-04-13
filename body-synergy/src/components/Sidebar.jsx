// src/components/Sidebar.jsx
import '../styles/Sidebar.css'
import {useApp} from '../context/AppContext'

const NAV_ITEMS = [
    {
        tab: 'home', label: 'Главная',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
        </svg>,
    },
    {
        tab: 'levels', label: 'Уровни',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="12" r="6"/>
            <circle cx="12" cy="12" r="2"/>
        </svg>,
    },
    {
        tab: 'body', label: 'Атлас тела',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2a3 3 0 100 6 3 3 0 000-6z"/>
            <path d="M8 8.5C5 9.5 3 12 3 15v2h18v-2c0-3-2-5.5-5-6.5"/>
            <path d="M9 21v-4M15 21v-4"/>
            <path d="M8 14h8"/>
        </svg>,
    },
    {
        tab: 'practice', label: 'Практика',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2C7 7 4 11.5 4 14.5a8 8 0 0016 0C20 11.5 17 7 12 2z"/>
            <path d="M8.5 14.5c.5-1 1.5-1.5 2.5-1s2 1 3 .5 1.5-1.5 2-1.5" strokeLinecap="round"/>
            <circle cx="12" cy="10" r="1.5" fill="currentColor"/>
        </svg>,
    },
    {
        tab: 'workout', label: 'Тренировки',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 2C7 7 4 11.5 4 14.5a8 8 0 0016 0C20 11.5 17 7 12 2z"/>
            <path d="M7 15c1-1.5 2-2 3.5-1.5S13 15 14.5 14s2-2.5 2.5-2" strokeLinecap="round"/>
        </svg>,
    },
    {
        tab: 'poses', label: 'Секс позы',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>,
    },
    {
        tab: 'tips', label: 'Мотивация / Советы',
        icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path
                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
        </svg>,
    },
]

export default function Sidebar({onLogoClick, dispatchOverride}) {
    const {state, dispatch} = useApp()
    const doDispatch = dispatchOverride || dispatch

    return (
        <aside className="sidebar">
            <div className="sidebar__logo" onClick={onLogoClick}>
                <svg viewBox="0 0 24 24">
                    <path
                        d="M12 2c-5.33 4.55-8 8.48-8 11.8 0 4.98 3.8 8.2 8 8.2s8-3.22 8-8.2C20 10.48 17.33 6.55 12 2z"/>
                </svg>
            </div>
            <nav className="sidebar__nav">
                {NAV_ITEMS.map(({tab, label, icon}) => (
                    <div key={tab}
                         className={`sidebar__item${state.currentTab === tab ? ' sidebar__item--active' : ''}`}
                         data-tab={tab}
                         onClick={() => doDispatch({type: 'SET_TAB', tab})}>
                        {icon}
                        <span className="sidebar__tooltip">{label}</span>
                    </div>
                ))}
            </nav>
            <div className="sidebar__score">{state.synergy}</div>
        </aside>
    )
}