import {useState, useEffect, Component} from 'react';
import {Spin} from 'antd';
import {Sidebar} from './components/Sidebar.tsx';
import {TwelveWeeks} from './pages/TwelveWeeks.tsx';
import {LifeWheel} from './pages/LifeWheel.tsx';
import {Progress} from './pages/Progress.tsx';
import {Profile} from './pages/Profile.tsx';
import {Login} from './pages/auth/Login.tsx';
import {Register} from './pages/auth/Register.tsx';
import {BoardPage} from './pages/BoardPage.tsx';
import {FitnessPage} from './pages/FitnessPage.tsx';
import {GuidePage} from "./pages/GuidePage.tsx";
import {useAuthStore} from './store/auth/authStore.ts';
import {useAppData} from './hooks/useAppData.ts';
import './styles/mobile.css';

const VALID_TABS = ['profile','12weeks','life','progress','board','fitness','guide'] as const;
type TabKey = typeof VALID_TABS[number];
const isValidTab = (v: string | null): v is TabKey => VALID_TABS.includes(v as TabKey);

class BottomNav extends Component<{ onChange: (tab: string) => void, activeKey: string }> {
    render() {
        return null;
    }
}

function AppContent() {
    const {user} = useAuthStore();
    useAppData(user?.id);

    const [activeTab, setActiveTabRaw] = useState<TabKey>(() => {
        const saved = localStorage.getItem('app-active-tab');
        return isValidTab(saved) ? saved : '12weeks';
    });

    const setActiveTab = (tab: string) => {
        if (isValidTab(tab)) {
            localStorage.setItem('app-active-tab', tab);
            setActiveTabRaw(tab);
        }
    };

    const renderPage = () => {
        switch (activeTab) {
            case 'profile':
                return <Profile/>;
            case '12weeks':
                return <TwelveWeeks/>;
            case 'life':
                return <LifeWheel/>;
            case 'progress':
                return <Progress/>;
            case 'board':
                return <BoardPage/>;
            case 'fitness':
                return <FitnessPage/>;
            case 'guide':
                return <GuidePage/>
            default:
                return <TwelveWeeks/>;
        }
    };

    return (
        <div style={{display: 'flex', minHeight: '100vh'}}>
            <Sidebar activeKey={activeTab} onChange={setActiveTab}/> {/* десктоп sidebar */}
            <div className="tp-content">
                {renderPage()}
            </div>
            <BottomNav activeKey={activeTab} onChange={setActiveTab}/> {/* отдельный компонент для мобилки */}
        </div>
    );
}

export default function App() {
    const {user, isInitialized, init} = useAuthStore();
    const [authPage, setAuthPage] = useState<'login' | 'register'>('login');

    useEffect(() => {
        init();
    }, []);

    if (!isInitialized) {
        return (
            <div style={{
                minHeight: '100vh', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            }}>
                <Spin size="large"/>
            </div>
        );
    }

    if (!user) {
        return authPage === 'login'
            ? <Login onGoRegister={() => setAuthPage('register')}/>
            : <Register onGoLogin={() => setAuthPage('login')}/>;
    }

    return <AppContent/>;
}