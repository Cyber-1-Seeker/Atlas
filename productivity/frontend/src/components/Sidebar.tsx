/**
 * Sidebar — с кнопкой сворачивания на десктопе.
 * Состояние свёрнутости сохраняется в localStorage.
 */
import {useState} from 'react';
import {Avatar, Typography, Tooltip} from 'antd';
import {CalendarOutlined, PieChartOutlined, LineChartOutlined, UserOutlined} from '@ant-design/icons';
import {LayoutDashboard, BookOpen} from 'lucide-react';
import {ChevronLeft, ChevronRight, Dumbbell} from 'lucide-react';
import {useAuthStore} from '../store/auth/authStore.ts';

const {Text} = Typography;
const GRADIENT = 'linear-gradient(180deg, #667eea 0%, #764ba2 100%)';

const NAV = [
    {key:'profile',  label:'Профиль',       mLabel:'Профиль',  icon:<UserOutlined/>},
    {key:'guide', label:'Руководство', mLabel:'Гайд', icon:<BookOpen size={16}/>},
    {key:'12weeks',  label:'12 недель',       mLabel:'Недели',   icon:<CalendarOutlined/>},
    {key:'life',     label:'Жизненный круг',  mLabel:'Круг',     icon:<PieChartOutlined/>},
    {key:'progress', label:'Прогресс',        mLabel:'Прогресс', icon:<LineChartOutlined/>},
    {key:'board',    label:'Доски',           mLabel:'Доски',    icon:<LayoutDashboard size={16}/>},
    {key:'fitness', label:'Фитнес', mLabel:'Фитнес', icon:<Dumbbell size={16}/>},
];

type Props = {activeKey: string; onChange: (key: string) => void;};

export function Sidebar({activeKey, onChange}: Props) {
    const {user} = useAuthStore();
    const initials = user?.username.slice(0,2).toUpperCase() ?? '??';

    const [collapsed, setCollapsed] = useState(() =>
        localStorage.getItem('sidebar-collapsed') === '1'
    );

    const toggleCollapse = () => {
        const next = !collapsed;
        setCollapsed(next);
        localStorage.setItem('sidebar-collapsed', next ? '1' : '0');
        // Уведомляем CSS через CSS custom property
        document.documentElement.style.setProperty('--sidebar-w', next ? '60px' : '260px');
    };

    // Устанавливаем CSS переменную при монтировании
    if (typeof document !== 'undefined') {
        document.documentElement.style.setProperty('--sidebar-w', collapsed ? '60px' : '260px');
    }

    const w = collapsed ? 60 : 260;

    return (
        <>
            {/* ── Десктоп sidebar ───────────────────────────────── */}
            <div style={{
                width: w, height:'100vh', position:'fixed', left:0, top:0,
                background: GRADIENT,
                boxShadow:'4px 0 12px rgba(0,0,0,0.1)',
                display:'flex', flexDirection:'column', zIndex:1000,
                transition:'width 0.25s ease',
                overflow:'hidden',
            }} className="tp-sidebar">

                {/* Лого + кнопка сворачивания */}
                <div style={{
                    padding: collapsed ? '20px 0' : '20px 16px',
                    borderBottom:'1px solid rgba(255,255,255,0.1)',
                    display:'flex', alignItems:'center',
                    justifyContent: collapsed ? 'center' : 'space-between',
                    flexShrink:0,
                }}>
                    {!collapsed && (
                        <div style={{display:'flex',alignItems:'center',gap:10}}>
                            <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:16,fontWeight:700,flexShrink:0}}>✓</div>
                            <div>
                                <div style={{color:'white',fontSize:14,fontWeight:700,lineHeight:1.2}}>True</div>
                                <div style={{color:'rgba(255,255,255,0.75)',fontSize:11,lineHeight:1.2}}>Productivity</div>
                            </div>
                        </div>
                    )}
                    {collapsed && (
                        <div style={{width:32,height:32,borderRadius:8,background:'rgba(255,255,255,0.2)',display:'flex',alignItems:'center',justifyContent:'center',color:'white',fontSize:16,fontWeight:700}}>✓</div>
                    )}
                    {!collapsed && (
                        <button onClick={toggleCollapse} style={{
                            background:'rgba(255,255,255,0.15)',border:'none',
                            borderRadius:8,width:28,height:28,cursor:'pointer',
                            display:'flex',alignItems:'center',justifyContent:'center',
                            color:'white',flexShrink:0,
                        }}>
                            <ChevronLeft size={14}/>
                        </button>
                    )}
                </div>

                {/* Кнопка развернуть (когда свёрнут) */}
                {collapsed && (
                    <button onClick={toggleCollapse} style={{
                        background:'rgba(255,255,255,0.1)',border:'none',
                        width:'100%',padding:'8px 0',cursor:'pointer',
                        display:'flex',alignItems:'center',justifyContent:'center',
                        color:'white',flexShrink:0,
                    }}>
                        <ChevronRight size={14}/>
                    </button>
                )}

                {/* Аватар пользователя */}
                {!collapsed && user && (
                    <div style={{padding:'10px 12px',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                        <div onClick={()=>onChange('profile')} style={{
                            display:'flex',alignItems:'center',gap:10,
                            padding:'6px 8px',borderRadius:10,
                            background:'rgba(255,255,255,0.1)',cursor:'pointer',
                        }}>
                            <Avatar size={28} style={{background:user.avatar_color,fontSize:11,fontWeight:700,flexShrink:0}}>{initials}</Avatar>
                            <Text style={{color:'white',fontSize:12,fontWeight:500}} ellipsis>{user.username}</Text>
                        </div>
                    </div>
                )}
                {collapsed && user && (
                    <div style={{padding:'8px 0',display:'flex',justifyContent:'center',borderBottom:'1px solid rgba(255,255,255,0.1)'}}>
                        <Tooltip title={user.username} placement="right">
                            <Avatar size={32} style={{background:user.avatar_color,fontSize:11,fontWeight:700,cursor:'pointer'}}
                                    onClick={()=>onChange('profile')}>{initials}</Avatar>
                        </Tooltip>
                    </div>
                )}

                {/* Меню */}
                <div style={{flex:1,padding: collapsed?'8px 0':'12px 8px',overflowY:'auto'}}>
                    {NAV.map(item => {
                        const isActive = activeKey === item.key;
                        return collapsed ? (
                            <Tooltip key={item.key} title={item.label} placement="right">
                                <button onClick={()=>onChange(item.key)} style={{
                                    width:'100%',padding:'10px 0',border:'none',
                                    background:isActive?'rgba(255,255,255,0.2)':'transparent',
                                    cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',
                                    color:'white',borderRadius:0,margin:'1px 0',
                                }}>
                                    <span style={{fontSize:18}}>{item.icon}</span>
                                </button>
                            </Tooltip>
                        ) : (
                            <button key={item.key} onClick={()=>onChange(item.key)} style={{
                                width:'100%',padding:'10px 12px',border:'none',
                                background:isActive?'rgba(255,255,255,0.2)':'transparent',
                                cursor:'pointer',display:'flex',alignItems:'center',gap:12,
                                color:'white',borderRadius:8,margin:'1px 0',
                                fontSize:14,fontWeight:isActive?600:400,
                                transition:'background 0.15s',
                            }}
                            onMouseEnter={e=>{if(!isActive)e.currentTarget.style.background='rgba(255,255,255,0.1)';}}
                            onMouseLeave={e=>{if(!isActive)e.currentTarget.style.background='transparent';}}
                            >
                                <span style={{fontSize:16,flexShrink:0}}>{item.icon}</span>
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </div>

                {!collapsed && (
                    <div style={{padding:'10px 16px',borderTop:'1px solid rgba(255,255,255,0.1)',color:'rgba(255,255,255,0.4)',fontSize:10}}>
                        Version 2.0.0
                    </div>
                )}
            </div>

            {/* ── Мобильная нижняя навигация ── */}
            <div className="tp-bottomnav" style={{
                position:'fixed',bottom:0,left:0,right:0,zIndex:1000,
                background:GRADIENT,boxShadow:'0 -2px 16px rgba(0,0,0,0.18)',
                height:60,alignItems:'center',
            }}>
                {NAV.map(item=>{
                    const isActive=activeKey===item.key;
                    return(
                        <button key={item.key} onClick={()=>onChange(item.key)} style={{
                            flex:1,height:'100%',border:'none',background:'transparent',
                            display:'flex',flexDirection:'column',
                            alignItems:'center',justifyContent:'center',gap:3,
                            cursor:'pointer',padding:0,
                            color:isActive?'white':'rgba(255,255,255,0.5)',
                            borderTop:isActive?'2px solid white':'2px solid transparent',
                        }}>
                            <span style={{fontSize:18}}>{item.icon}</span>
                            <span style={{fontSize:9,fontWeight:isActive?700:400}}>{item.mLabel}</span>
                        </button>
                    );
                })}
            </div>
        </>
    );
}
