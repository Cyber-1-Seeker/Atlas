import {
    Button, Checkbox, Empty, Flex, Progress,
    Statistic, Space, Tabs, Typography,
} from 'antd';
import {DeleteOutlined, EditOutlined, PlusOutlined} from '@ant-design/icons';
import {ChevronLeft, ChevronRight, Trophy, Calendar} from 'lucide-react';
import {useState} from 'react';
import {useTaskStore} from '../../store/twelveWeeks/taskStore.ts';
import {useGoalStore, calculateGoalProgress} from '../../store/twelveWeeks/goalStore.ts';
import type {taskType, Task, TimeSlot} from '../../types/twelveWeeks/task.ts';
import {GoalModal} from './GoalModal.tsx';
import {TaskModal} from './TaskModal.tsx';
import {DiaryButton} from './AchievementDiary.tsx';
import {useBreakpoint} from '../../hooks/useBreakpoint.ts';

const {Text, Title} = Typography;

const TASK_COLORS: Record<taskType, string> = {
    important: '#faad14', rest: '#52c41a', simple: '#1890ff',
};
const TASK_BG: Record<taskType, {bg:string;border:string}> = {
    important: {bg:'#fff7e6',border:'#ffd591'},
    rest:      {bg:'#f6ffed',border:'#b7eb8f'},
    simple:    {bg:'#f0f5ff',border:'#adc6ff'},
};

const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const DAYS_FULL  = ['понедельник','вторник','среду','четверг','пятницу','субботу','воскресенье'];
const GRADIENT   = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';

const fmtTime = (t: TimeSlot) => `${t.hour}:${String(t.minute).padStart(2,'0')}`;
const fmtRange = (s?:TimeSlot,e?:TimeSlot) => s&&e ? `${fmtTime(s)}–${fmtTime(e)}` : '';

export function TaskList() {
    const {isMobile} = useBreakpoint();

    const [currentWeek, setCurrentWeekRaw] = useState<number>(() => {
        const p = parseInt(localStorage.getItem('tw-current-week')||'1', 10);
        return p >= 1 && p <= 12 ? p : 1;
    });
    const [currentDay, setCurrentDayRaw] = useState<number>(() => {
        const p = parseInt(localStorage.getItem('tw-current-day')||'0', 10);
        return p >= 0 && p <= 6 ? p : 0;
    });

    const setCurrentWeek = (fn: number|((w:number)=>number)) => {
        setCurrentWeekRaw(prev => {
            const next = typeof fn==='function' ? fn(prev) : fn;
            localStorage.setItem('tw-current-week', String(next));
            return next;
        });
    };
    const setCurrentDay = (val: number) => {
        setCurrentDayRaw(val);
        localStorage.setItem('tw-current-day', String(val));
    };

    const [goalModal, setGoalModal] = useState<{open:boolean;id:string|null;text:string}>(
        {open:false,id:null,text:''}
    );
    const [taskModal, setTaskModal] = useState<{open:boolean;id:string|null;data:Task|null}>(
        {open:false,id:null,data:null}
    );

    const {tasks, addTask, toggleTask, removeTask, updateTask} = useTaskStore();
    const {goals, addGoal, toggleGoal, updateGoal, removeGoal}  = useGoalStore();

    const weekTasks       = tasks.filter(t => t.week === currentWeek);
    const weekProgress    = weekTasks.length > 0
        ? Math.round((weekTasks.filter(t=>t.done).length / weekTasks.length) * 100) : 0;
    const overallProgress = tasks.length > 0
        ? Math.round((tasks.filter(t=>t.done).length / tasks.length) * 100) : 0;
    const currentDayTasks = tasks.filter(t => t.week === currentWeek && t.dayOfWeek === currentDay);

    const openAddGoal  = () => setGoalModal({open:true,id:null,text:''});
    const openEditGoal = (id:string, text:string) => setGoalModal({open:true,id,text});
    const handleSaveGoal = (text:string) => {
        if (goalModal.id) updateGoal(goalModal.id, text); else addGoal(text);
        setGoalModal({open:false,id:null,text:''});
    };
    const openAddTask  = () => setTaskModal({open:true,id:null,data:null});
    const openEditTask = (task:Task) => setTaskModal({open:true,id:task.id,data:task});
    const handleSaveTask = (
        text:string, type:taskType,
        startTime?:TimeSlot, endTime?:TimeSlot,
        goalId?:string, week?:number, dayOfWeek?:number,
    ) => {
        if (taskModal.id) {
            const ok = updateTask(taskModal.id, text, type, goalId, startTime, endTime);
            if (!ok) {alert('Время занято'); return;}
        } else {
            const ok = addTask(text, type, startTime, endTime, goalId, week, dayOfWeek);
            if (!ok) {alert('Время занято'); return;}
        }
        setTaskModal({open:false,id:null,data:null});
    };

    // ── MOBILE RENDER ────────────────────────────────────────────
    if (isMobile) {
        return (
            <div style={{minHeight:'100vh', background:'#f5f7fa'}}>

                {/* Заголовок */}
                <div style={{
                    padding: '12px 16px 0',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                    <Title level={4} style={{margin:0, color:'#434343'}}>12 недель</Title>
                </div>

                {/* Вкладки */}
                <Tabs
                    defaultActiveKey="calendar"
                    style={{padding: '0 16px'}}
                    size="small"
                    items={[
                        {
                            key: 'goals',
                            label: <span><Trophy size={13} style={{marginRight:4}}/>Цели</span>,
                            children: (
                                <div>
                                    <Button type="primary" block icon={<PlusOutlined/>}
                                            onClick={openAddGoal}
                                            style={{
                                                background: GRADIENT, border:'none',
                                                borderRadius:12, height:46,
                                                fontSize:15, marginBottom:14,
                                            }}>
                                        Добавить цель
                                    </Button>

                                    {goals.length === 0 ? (
                                        <Empty description="Добавьте первую цель на 12 недель"
                                               image={Empty.PRESENTED_IMAGE_SIMPLE}
                                               style={{padding:'32px 0'}}/>
                                    ) : (
                                        <div>
                                            {goals.map(goal => {
                                                const prog = calculateGoalProgress(goal.id, tasks);
                                                return (
                                                    <div key={goal.id} style={{
                                                        background:'white', borderRadius:14,
                                                        padding:'14px 16px', marginBottom:10,
                                                        boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                                                    }}>
                                                        <Flex justify="space-between" align="flex-start">
                                                            <Checkbox checked={goal.done}
                                                                      onChange={() => toggleGoal(goal.id)}
                                                                      style={{flex:1}}>
                                                                <Text delete={goal.done} strong
                                                                      style={{fontSize:14, lineHeight:1.4}}>
                                                                    {goal.text}
                                                                </Text>
                                                            </Checkbox>
                                                            <Space size={2} style={{flexShrink:0, marginLeft:8}}>
                                                                <Button type="text" size="small"
                                                                        icon={<EditOutlined/>}
                                                                        onClick={() => openEditGoal(goal.id, goal.text)}
                                                                        style={{color:'#667eea'}}/>
                                                                <Button type="text" size="small"
                                                                        icon={<DeleteOutlined/>}
                                                                        onClick={() => removeGoal(goal.id)} danger/>
                                                            </Space>
                                                        </Flex>
                                                        <Progress percent={prog}
                                                                  strokeColor={{'0%':'#667eea','100%':'#764ba2'}}
                                                                  strokeWidth={5}
                                                                  style={{marginTop:8}}/>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            ),
                        },
                        {
                            key: 'calendar',
                            label: <span><Calendar size={13} style={{marginRight:4}}/>Календарь</span>,
                            children: (
                                <div>
                                    {/* Навигация по неделям */}
                                    <div style={{
                                        background: 'white', borderRadius:14,
                                        padding:'12px 14px', marginBottom:10,
                                        boxShadow:'0 2px 8px rgba(0,0,0,0.06)',
                                    }}>
                                        <Flex justify="space-between" align="center">
                                            <Flex align="center" gap={6}>
                                                <Button icon={<ChevronLeft size={15}/>} size="small"
                                                        onClick={() => setCurrentWeek(w => Math.max(1,w-1))}
                                                        disabled={currentWeek===1}/>
                                                <Text strong style={{fontSize:13, minWidth:80, textAlign:'center'}}>
                                                    Неделя {currentWeek}/12
                                                </Text>
                                                <Button icon={<ChevronRight size={15}/>} size="small"
                                                        onClick={() => setCurrentWeek(w => Math.min(12,w+1))}
                                                        disabled={currentWeek===12}/>
                                                <DiaryButton type="week" weekNum={currentWeek}/>
                                            </Flex>
                                            <Flex gap={12}>
                                                <div style={{textAlign:'center'}}>
                                                    <div style={{fontSize:16,fontWeight:700,color:'#667eea',lineHeight:1}}>
                                                        {weekProgress}%
                                                    </div>
                                                    <div style={{fontSize:9,color:'#8c8c8c'}}>неделя</div>
                                                </div>
                                                <div style={{textAlign:'center'}}>
                                                    <div style={{fontSize:16,fontWeight:700,color:'#764ba2',lineHeight:1}}>
                                                        {overallProgress}%
                                                    </div>
                                                    <div style={{fontSize:9,color:'#8c8c8c'}}>всего</div>
                                                </div>
                                            </Flex>
                                        </Flex>
                                    </div>

                                    {/* Дни недели — 7 кнопок */}
                                    <div style={{
                                        display:'grid', gridTemplateColumns:'repeat(7,1fr)',
                                        gap:4, marginBottom:10,
                                    }}>
                                        {DAYS_SHORT.map((day, index) => {
                                            const dt  = tasks.filter(t => t.week===currentWeek && t.dayOfWeek===index);
                                            const tot = dt.length;
                                            const dn  = dt.filter(t => t.done).length;
                                            const pct = tot > 0 ? (dn/tot)*100 : 0;
                                            const isSel = index === currentDay;
                                            return (
                                                <div key={day} onClick={() => setCurrentDay(index)} style={{
                                                    textAlign:'center',
                                                    padding:'8px 2px',
                                                    borderRadius:10,
                                                    cursor:'pointer',
                                                    background: isSel ? GRADIENT : 'white',
                                                    color: isSel ? 'white' : '#434343',
                                                    fontWeight: isSel ? 700 : 500,
                                                    fontSize:11,
                                                    boxShadow: isSel
                                                        ? '0 4px 12px rgba(102,126,234,0.4)'
                                                        : '0 1px 4px rgba(0,0,0,0.07)',
                                                    transition:'all 0.15s',
                                                }}>
                                                    <div>{day}</div>
                                                    {tot > 0 && (
                                                        <div style={{
                                                            width:'70%', height:2, borderRadius:1,
                                                            background: isSel ? 'rgba(255,255,255,0.4)' : '#f0f0f0',
                                                            margin:'3px auto 0', overflow:'hidden',
                                                        }}>
                                                            <div style={{
                                                                width:`${pct}%`, height:'100%',
                                                                background: dn===tot ? '#52c41a' : isSel ? 'white' : '#667eea',
                                                            }}/>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Заголовок текущего дня */}
                                    <Flex justify="space-between" align="center" style={{marginBottom:10}}>
                                        <Flex align="center" gap={8}>
                                            <Text strong style={{fontSize:14}}>
                                                {DAYS_SHORT[currentDay]}, нед. {currentWeek}
                                            </Text>
                                            <DiaryButton type="day" weekNum={currentWeek} dayOfWeek={currentDay}/>
                                        </Flex>
                                        <Button type="primary" size="small" icon={<PlusOutlined/>}
                                                onClick={openAddTask}
                                                style={{
                                                    background:GRADIENT, border:'none',
                                                    borderRadius:8,
                                                }}>
                                            Добавить
                                        </Button>
                                    </Flex>

                                    {/* Задачи дня */}
                                    {currentDayTasks.length === 0 ? (
                                        <div style={{
                                            background:'white', borderRadius:14, padding:'28px 16px',
                                            textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,0.06)',
                                        }}>
                                            <Text type="secondary" style={{fontSize:13}}>
                                                Нет задач на этот день
                                            </Text>
                                        </div>
                                    ) : (
                                        <div>
                                            {currentDayTasks.map(task => (
                                                <div key={task.id} style={{
                                                    background: TASK_BG[task.type].bg,
                                                    border: `1px solid ${TASK_BG[task.type].border}`,
                                                    borderLeft: `4px solid ${TASK_COLORS[task.type]}`,
                                                    borderRadius:12, padding:'11px 12px',
                                                    marginBottom:8,
                                                    display:'flex', alignItems:'center',
                                                    justifyContent:'space-between',
                                                }}>
                                                    <Flex align="center" gap={10} style={{flex:1,minWidth:0}}>
                                                        <Checkbox checked={task.done}
                                                                  onChange={() => toggleTask(task.id)}/>
                                                        <div style={{minWidth:0}}>
                                                            {task.startTime && task.endTime && (
                                                                <Text type="secondary" style={{
                                                                    fontSize:10, fontWeight:600,
                                                                    display:'block',
                                                                }}>
                                                                    {fmtRange(task.startTime,task.endTime)}
                                                                </Text>
                                                            )}
                                                            <Text delete={task.done} style={{
                                                                fontSize:14, color:'#434343',
                                                                wordBreak:'break-word',
                                                            }}>
                                                                {task.text}
                                                            </Text>
                                                        </div>
                                                    </Flex>
                                                    <Space size={2} style={{flexShrink:0, marginLeft:8}}>
                                                        <Button type="text" size="small"
                                                                icon={<EditOutlined/>}
                                                                onClick={() => openEditTask(task)}/>
                                                        <Button type="text" size="small"
                                                                icon={<DeleteOutlined/>}
                                                                onClick={() => removeTask(task.id)} danger/>
                                                    </Space>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ),
                        },
                    ]}
                />

                <GoalModal open={goalModal.open}
                           onClose={() => setGoalModal({open:false,id:null,text:''})}
                           onSave={handleSaveGoal}
                           initialValue={goalModal.text}
                           title={goalModal.id ? 'Редактировать цель' : 'Добавить цель'}/>
                <TaskModal open={taskModal.open}
                           onClose={() => setTaskModal({open:false,id:null,data:null})}
                           onSave={handleSaveTask}
                           initialText={taskModal.data?.text}
                           initialType={taskModal.data?.type}
                           initialStartTime={taskModal.data?.startTime}
                           initialEndTime={taskModal.data?.endTime}
                           initialGoalId={taskModal.data?.goalId}
                           initialWeek={taskModal.data?.week ?? currentWeek}
                           initialDayOfWeek={taskModal.data?.dayOfWeek ?? currentDay}
                           editingId={taskModal.id ?? undefined}
                           title={taskModal.id ? 'Редактировать задачу' : 'Добавить задачу'}/>
            </div>
        );
    }

    // ── DESKTOP (оригинальный) ─────────────────────────────────
    return (
        <div style={{maxWidth:1200, margin:'0 auto'}}>
            <div style={{marginBottom:28}}>
                <Title level={2} style={{margin:0, color:'#434343'}}>12-недельная система</Title>
                <Text type="secondary" style={{fontSize:15}}>Планируйте и достигайте целей по неделям</Text>
            </div>
            <div style={{background:'white', borderRadius:16, boxShadow:'0 4px 16px rgba(0,0,0,0.08)', padding:24}}>
                <Tabs defaultActiveKey="calendar" size="large"
                    items={[
                        {
                            key:'goals',
                            label:<span style={{display:'flex',alignItems:'center',gap:6}}><Trophy size={16} strokeWidth={2}/>Цели на 12 недель</span>,
                            children:(
                                <div>
                                    <Flex justify="flex-end" style={{marginBottom:20}}>
                                        <Button type="primary" icon={<PlusOutlined/>} onClick={openAddGoal} style={{background:GRADIENT,border:'none'}}>
                                            Добавить цель
                                        </Button>
                                    </Flex>
                                    {goals.length === 0 ? (
                                        <Empty description="Добавьте первую цель на 12 недель" image={Empty.PRESENTED_IMAGE_SIMPLE}/>
                                    ) : goals.map(goal => {
                                        const prog = calculateGoalProgress(goal.id, tasks);
                                        return (
                                            <div key={goal.id} style={{background:'#fafafa',borderRadius:12,padding:'16px 20px',marginBottom:12,border:'1px solid #e8e8e8'}}>
                                                <Flex justify="space-between">
                                                    <Checkbox checked={goal.done} onChange={()=>toggleGoal(goal.id)} style={{flex:1}}>
                                                        <Text delete={goal.done} strong style={{fontSize:15}}>{goal.text}</Text>
                                                    </Checkbox>
                                                    <Space>
                                                        <Button type="text" icon={<EditOutlined/>} onClick={()=>openEditGoal(goal.id,goal.text)} style={{color:'#667eea'}}/>
                                                        <Button type="text" icon={<DeleteOutlined/>} onClick={()=>removeGoal(goal.id)} danger/>
                                                    </Space>
                                                </Flex>
                                                <Progress percent={prog} strokeColor={{'0%':'#667eea','100%':'#764ba2'}} strokeWidth={8} style={{marginTop:10}}/>
                                            </div>
                                        );
                                    })}
                                </div>
                            ),
                        },
                        {
                            key:'calendar',
                            label:<span style={{display:'flex',alignItems:'center',gap:6}}><Calendar size={16} strokeWidth={2}/>Календарь недели</span>,
                            children:(
                                <div>
                                    <Flex justify="space-between" align="center" style={{marginBottom:24}}>
                                        <Space>
                                            <Button icon={<ChevronLeft size={16}/>} onClick={()=>setCurrentWeek(w=>Math.max(1,w-1))} disabled={currentWeek===1}/>
                                            <Flex align="center" gap={10}>
                                                <Title level={4} style={{margin:0,minWidth:160,textAlign:'center'}}>Неделя {currentWeek} из 12</Title>
                                                <DiaryButton type="week" weekNum={currentWeek}/>
                                            </Flex>
                                            <Button icon={<ChevronRight size={16}/>} onClick={()=>setCurrentWeek(w=>Math.min(12,w+1))} disabled={currentWeek===12}/>
                                        </Space>
                                        <Space size={32}>
                                            <Statistic title="Прогресс недели" value={weekProgress} suffix="%" formatter={v=><span style={{color:'#667eea',fontSize:20}}>{v}</span>}/>
                                            <Statistic title="Общий прогресс" value={overallProgress} suffix="%" formatter={v=><span style={{color:'#764ba2',fontSize:20}}>{v}</span>}/>
                                        </Space>
                                    </Flex>
                                    <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:12,marginBottom:28}}>
                                        {DAYS_SHORT.map((day,index)=>{
                                            const dt=tasks.filter(t=>t.week===currentWeek&&t.dayOfWeek===index);
                                            const tot=dt.length,dn=dt.filter(t=>t.done).length;
                                            const pct=tot>0?(dn/tot)*100:0,isSel=index===currentDay;
                                            return(
                                                <div key={day} onClick={()=>setCurrentDay(index)} style={{
                                                    textAlign:'center',padding:'20px 12px',borderRadius:12,
                                                    cursor:'pointer',fontSize:15,fontWeight:600,
                                                    border:'2px solid transparent',transition:'all 0.3s',
                                                    background:isSel?GRADIENT:'#f5f5f5',color:isSel?'white':'#595959',
                                                    transform:isSel?'scale(1.05)':'scale(1)',
                                                }}>
                                                    <div style={{marginBottom:8}}>{day}</div>
                                                    {tot>0&&<div style={{width:'100%',height:5,background:isSel?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.1)',borderRadius:3,overflow:'hidden',marginBottom:6}}>
                                                        <div style={{width:`${pct}%`,height:'100%',background:dn===tot?'#52c41a':isSel?'white':'#1890ff',borderRadius:3}}/>
                                                    </div>}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    <Flex justify="space-between" align="center" style={{marginBottom:16}}>
                                        <Flex align="center" gap={10}>
                                            <Title level={5} style={{margin:0}}>Задачи на {DAYS_FULL[currentDay]}</Title>
                                            <DiaryButton type="day" weekNum={currentWeek} dayOfWeek={currentDay}/>
                                        </Flex>
                                        <Button type="primary" icon={<PlusOutlined/>} onClick={openAddTask} style={{background:GRADIENT,border:'none'}}>Добавить задачу</Button>
                                    </Flex>
                                    {currentDayTasks.length===0?(
                                        <Empty description="Нет задач на этот день" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{padding:'32px 0'}}/>
                                    ):currentDayTasks.map(task=>{
                                        const bg=TASK_BG[task.type];
                                        return(
                                            <div key={task.id} style={{
                                                background:bg.bg,border:`1px solid ${bg.border}`,
                                                borderLeft:`4px solid ${TASK_COLORS[task.type]}`,
                                                borderRadius:10,padding:'12px 16px',marginBottom:8,
                                                display:'flex',alignItems:'center',justifyContent:'space-between',
                                            }}>
                                                <Flex align="center" gap={12}>
                                                    <Checkbox checked={task.done} onChange={()=>toggleTask(task.id)}/>
                                                    <div>
                                                        {task.startTime&&task.endTime&&<Text type="secondary" style={{fontSize:12,fontWeight:600,display:'block'}}>{fmtRange(task.startTime,task.endTime)}</Text>}
                                                        <Text delete={task.done} style={{fontSize:15,color:'#434343'}}>{task.text}</Text>
                                                    </div>
                                                </Flex>
                                                <Space>
                                                    <Button type="text" size="small" icon={<EditOutlined/>} onClick={()=>openEditTask(task)}/>
                                                    <Button type="text" size="small" icon={<DeleteOutlined/>} onClick={()=>removeTask(task.id)} danger/>
                                                </Space>
                                            </div>
                                        );
                                    })}
                                </div>
                            ),
                        },
                    ]}
                />
            </div>
            <GoalModal open={goalModal.open} onClose={()=>setGoalModal({open:false,id:null,text:''})} onSave={handleSaveGoal} initialValue={goalModal.text} title={goalModal.id?'Редактировать цель':'Добавить цель'}/>
            <TaskModal open={taskModal.open} onClose={()=>setTaskModal({open:false,id:null,data:null})} onSave={handleSaveTask}
                initialText={taskModal.data?.text} initialType={taskModal.data?.type}
                initialStartTime={taskModal.data?.startTime} initialEndTime={taskModal.data?.endTime}
                initialGoalId={taskModal.data?.goalId} initialWeek={taskModal.data?.week??currentWeek}
                initialDayOfWeek={taskModal.data?.dayOfWeek??currentDay} editingId={taskModal.id??undefined}
                title={taskModal.id?'Редактировать задачу':'Добавить задачу'}/>
        </div>
    );
}
