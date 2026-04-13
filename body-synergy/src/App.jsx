// src/App.jsx
import {useState, useRef} from 'react'
import './styles/Detail.css'
import {useApp} from './context/AppContext'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Levels from './pages/Levels'
import Body from './pages/Body'
import Practice from './pages/Practice'
import Workout from './pages/Workout'
import Poses from './pages/Poses'
import Tips from './pages/Tips'
import DetailView from './components/DetailView'
import Onboarding from './components/Onboarding'
import {isOnboarded} from './data/dashboard'

const TAB_ORDER = ['home', 'levels', 'body', 'practice', 'workout', 'poses', 'tips']

export default function App() {
    const {state, dispatch} = useApp()
    const [showOnboarding, setShowOnboarding] = useState(() => !isOnboarded())
    const [transitionKey, setTransitionKey] = useState(0)
    const [transitionDir, setTransitionDir] = useState('right')
    const prevTabRef = useRef(state.currentTab)

    const dispatchWithTransition = (action) => {
        if (action.type === 'SET_TAB') {
            const prevIdx = TAB_ORDER.indexOf(prevTabRef.current)
            const nextIdx = TAB_ORDER.indexOf(action.tab)
            setTransitionDir(nextIdx >= prevIdx ? 'right' : 'left')
            setTransitionKey(k => k + 1)
            prevTabRef.current = action.tab
        }
        dispatch(action)
    }

    function renderPage() {
        switch (state.currentTab) {
            case 'home':
                return <Dashboard/>
            case 'levels':
                return <Levels/>
            case 'body':
                return <Body/>
            case 'practice':
                return <Practice/>
            case 'workout':
                return <Workout/>
            case 'poses':
                return <Poses/>
            case 'tips':
                return <Tips/>
            default:
                return <Dashboard/>
        }
    }

    return (
        <div className="app-layout">
            <Sidebar onLogoClick={() => setShowOnboarding(true)} dispatchOverride={dispatchWithTransition}/>
            <main className="app-main">
                <div key={transitionKey}
                     className={transitionDir === 'left' ? 'page-transition--left' : 'page-transition'}>
                    {renderPage()}
                </div>
            </main>
            {state.currentZone && <DetailView/>}
            {showOnboarding && <Onboarding onClose={() => setShowOnboarding(false)}/>}
        </div>
    )
}