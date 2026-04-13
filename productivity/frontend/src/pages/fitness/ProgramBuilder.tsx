import {useEffect, useState} from 'react';
import {Button, Card, Input, InputNumber, Modal, Typography, Flex, Tag, Popconfirm, Tooltip, Empty, Badge} from 'antd';
import {PlusOutlined, DeleteOutlined, EditOutlined, CheckCircleOutlined, PlayCircleOutlined, EyeOutlined} from '@ant-design/icons';
import {useFitnessStore} from '../../store/fitness/fitnessStore.ts';
import {fitnessApi} from '../../api/fitness.ts';
import {ExerciseLibrary} from './ExerciseLibrary.tsx';
import type {TrainingProgram, TrainingDay, MuscleScore, MuscleGroup} from '../../api/fitness.ts';

const {Title, Text} = Typography;
const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const LEVEL_COLOR: Record<string,string> = {high:'#f5222d',medium:'#fa8c16',low:'#52c41a'};
const LEVEL_LABEL: Record<string,string> = {high:'🔴 Высокая',medium:'🟠 Средняя',low:'🟢 Низкая'};
const DAYS_SHORT = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];

type View = 'list'|'program'|'day';

export function ProgramBuilder({onStartWorkout}:{onStartWorkout:(day:TrainingDay)=>void}) {
    const {programs, fetchPrograms, createProgram, deleteProgram, activateProgram, fetchProgram} = useFitnessStore();
    const [view,         setView]        = useState<View>('list');
    const [activeProg,   setActiveProg]  = useState<TrainingProgram|null>(null);
    const [activeDay,    setActiveDay]   = useState<TrainingDay|null>(null);
    const [creating,     setCreating]    = useState(false);
    const [newName,      setNewName]     = useState('');
    const [newWeeks,     setNewWeeks]    = useState(1);
    const [exModal,      setExModal]     = useState(false);
    const [addingTo,     setAddingTo]    = useState<{sectionId:number;dayId:number}|null>(null);
    const [newSecTitle,  setNewSecTitle] = useState('');
    const [dayNameEdit,  setDayNameEdit] = useState('');
    const [editingDayName,setEditingDayName] = useState(false);
    const [showUncovered,setShowUncovered]   = useState(false);
    const [saving,       setSaving]      = useState(false);
    const [muscleDetail, setMuscleDetail]= useState<MuscleGroup|null>(null);

    // Восстановление состояния
    const STATE_KEY = 'fitness-builder-state';
    useEffect(()=>{
        fetchPrograms();
        const saved = localStorage.getItem(STATE_KEY);
        if(saved){
            try{
                const {v,progId,dayId}=JSON.parse(saved);
                if(v&&v!=='list') {/* восстановим после загрузки программ */}
            }catch{}
        }
    },[]);

    // Сохраняем состояние
    useEffect(()=>{
        if(view==='list') localStorage.removeItem(STATE_KEY);
        else localStorage.setItem(STATE_KEY,JSON.stringify({
            v:view, progId:activeProg?.id, dayId:activeDay?.id,
        }));
    },[view,activeProg?.id,activeDay?.id]);

    const loadProgram = async(id:number)=>{
        const full = await fetchProgram(id);
        setActiveProg(full);
        return full;
    };

    const openProgram = async(prog:TrainingProgram)=>{
        const full = await loadProgram(prog.id);
        setView('program');
    };

    const openDay = (day:TrainingDay,prog:TrainingProgram)=>{
        setActiveDay(day); setDayNameEdit(day.name); setView('day');
    };

    const handleCreate = async()=>{
        if(!newName.trim()) return;
        const prog = await createProgram(newName.trim(), newWeeks);
        setCreating(false); setNewName(''); setNewWeeks(1);
        openProgram(prog);
    };

    const handleAddDay = async()=>{
        if(!activeProg) return;
        setSaving(true);
        try{
            await fitnessApi.createDay({
                program_id: activeProg.id,
                name:'Новый день',week_index:0,day_index:0,
                order:activeProg.days.length,
            });
            const full = await loadProgram(activeProg.id);
            setActiveProg(full);
        }finally{setSaving(false);}
    };

    const handleAddSection = async()=>{
        if(!newSecTitle.trim()||!activeDay||!activeProg) return;
        setSaving(true);
        try{
            await fitnessApi.addSection(activeDay.id, newSecTitle.trim());
            setNewSecTitle('');
            const full = await loadProgram(activeProg.id);
            setActiveProg(full);
            setActiveDay(full.days.find(d=>d.id===activeDay.id)??null);
        }finally{setSaving(false);}
    };

    const handleAddEx = async(ex:any)=>{
        if(!addingTo||!activeProg||!activeDay) return;
        await fitnessApi.addExercise(addingTo.dayId,{
            section_id:addingTo.sectionId, exercise_id:ex.id, sets_count:3,
        });
        setExModal(false); setAddingTo(null);
        const full = await loadProgram(activeProg.id);
        setActiveProg(full);
        setActiveDay(full.days.find(d=>d.id===activeDay.id)??null);
    };

    const handleRemoveEx = async(deId:number)=>{
        if(!activeDay||!activeProg) return;
        await fitnessApi.removeExercise(activeDay.id,deId);
        const full = await loadProgram(activeProg.id);
        setActiveProg(full);
        setActiveDay(full.days.find(d=>d.id===activeDay.id)??null);
    };

    const handleSaveDayName = async()=>{
        if(!activeDay||!activeProg||!dayNameEdit.trim()) return;
        await fitnessApi.updateDay(activeDay.id,{name:dayNameEdit.trim()});
        const full = await loadProgram(activeProg.id);
        setActiveProg(full);
        const updated = full.days.find(d=>d.id===activeDay.id);
        setActiveDay(updated??null);
        setEditingDayName(false);
    };

    const handleDeleteDay = async(dayId:number)=>{
        if(!activeProg) return;
        await fitnessApi.deleteDay(dayId);
        const full = await loadProgram(activeProg.id);
        setActiveProg(full);
        if(activeDay?.id===dayId){ setActiveDay(null); setView('program'); }
    };

    // ── СПИСОК ПРОГРАММ ─────────────────────────────────────────
    if(view==='list') return (
        <div>
            <Flex justify="space-between" align="center" style={{marginBottom:20}} wrap="wrap" gap={10}>
                <div>
                    <Title level={3} style={{margin:0}}>🗓 Программы тренировок</Title>
                    <Text type="secondary">Составьте план и начните тренироваться</Text>
                </div>
                <Button type="primary" icon={<PlusOutlined/>} onClick={()=>setCreating(true)}
                        style={{background:GRADIENT,border:'none'}}>
                    Новая программа
                </Button>
            </Flex>

            {programs.length===0?(
                <Empty description="Нет программ" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{padding:'48px 0'}}>
                    <Button type="primary" icon={<PlusOutlined/>} onClick={()=>setCreating(true)}
                            style={{background:GRADIENT,border:'none'}}>Создать программу</Button>
                </Empty>
            ):(
                <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(280px,1fr))',gap:16}}>
                    {programs.map(prog=>(
                        <Card key={prog.id} style={{borderRadius:14,
                            boxShadow:prog.is_active?'0 4px 20px rgba(102,126,234,0.25)':'0 2px 8px rgba(0,0,0,0.07)',
                            border:prog.is_active?'2px solid #667eea':'1.5px solid #f0f0f0',
                            cursor:'pointer'}}
                              onClick={()=>openProgram(prog)}>
                            <Flex justify="space-between" align="flex-start">
                                <div style={{flex:1}}>
                                    <Flex align="center" gap={8} style={{marginBottom:4}}>
                                        <Text strong style={{fontSize:15}}>{prog.name}</Text>
                                        {prog.is_active&&<Tag color="blue">✓ Активная</Tag>}
                                    </Flex>
                                    <Text type="secondary" style={{fontSize:12}}>
                                        📅 {prog.weeks_count} нед · 💪 {(prog as any).days_count??0} дней
                                    </Text>
                                </div>
                                <Flex gap={4} onClick={e=>e.stopPropagation()}>
                                    {!prog.is_active&&(
                                        <Tooltip title="Активировать программу">
                                            <Button type="text" size="small" icon={<CheckCircleOutlined/>}
                                                    style={{color:'#667eea'}}
                                                    onClick={()=>activateProgram(prog.id)}/>
                                        </Tooltip>
                                    )}
                                    <Popconfirm title="Удалить программу?" onConfirm={()=>deleteProgram(prog.id)}
                                                okText="Удалить" cancelText="Отмена" okButtonProps={{danger:true}}>
                                        <Button type="text" size="small" icon={<DeleteOutlined/>} danger/>
                                    </Popconfirm>
                                </Flex>
                            </Flex>
                            {prog.is_active&&(
                                <Button type="primary" size="small" icon={<PlayCircleOutlined/>}
                                        style={{background:GRADIENT,border:'none',marginTop:12,width:'100%'}}
                                        onClick={async(e)=>{
                                            e.stopPropagation();
                                            const full = await loadProgram(prog.id);
                                            if(full.days.length>0) onStartWorkout(full.days[0]);
                                        }}>
                                    Начать тренировку
                                </Button>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            <Modal title="Новая программа" open={creating} onCancel={()=>setCreating(false)}
                   onOk={handleCreate} okText="Создать" cancelText="Отмена"
                   okButtonProps={{disabled:!newName.trim(),style:{background:GRADIENT,border:'none'}}}>
                <Input placeholder="Название программы" value={newName}
                       onChange={e=>setNewName(e.target.value)} style={{marginBottom:12}} size="large" autoFocus/>
                <Flex align="center" gap={12}>
                    <Text>Недель:</Text>
                    <InputNumber min={1} max={52} value={newWeeks} onChange={v=>setNewWeeks(v??1)} style={{width:80}}/>
                </Flex>
            </Modal>
        </div>
    );

    // ── ПРОГРАММА ────────────────────────────────────────────────
    if(view==='program'&&activeProg) return (
        <div>
            <Flex align="center" gap={10} style={{marginBottom:16}}>
                <Button type="text" onClick={()=>setView('list')}>← Программы</Button>
                <Title level={4} style={{margin:0}}>{activeProg.name}</Title>
                {activeProg.is_active&&<Tag color="blue">✓ Активная</Tag>}
                {!activeProg.is_active&&(
                    <Button size="small" icon={<CheckCircleOutlined/>} style={{color:'#667eea'}}
                            onClick={()=>activateProgram(activeProg.id).then(()=>loadProgram(activeProg.id).then(setActiveProg))}>
                        Активировать
                    </Button>
                )}
            </Flex>

            <div style={{display:'grid',gridTemplateColumns:'1fr 280px',gap:20}}>
                {/* Дни */}
                <div>
                    <Flex justify="space-between" align="center" style={{marginBottom:12}}>
                        <Text strong style={{fontSize:15}}>📅 Дни тренировок</Text>
                        <Button size="small" icon={<PlusOutlined/>} loading={saving}
                                onClick={handleAddDay} type="primary"
                                style={{background:GRADIENT,border:'none'}}>
                            Добавить день
                        </Button>
                    </Flex>
                    {activeProg.days.length===0?(
                        <div style={{textAlign:'center',padding:'32px 0',background:'#fafafa',borderRadius:12}}>
                            <Text type="secondary">Добавьте первый день тренировок</Text>
                        </div>
                    ):activeProg.days.map(day=>{
                        const exCount = day.sections.reduce((a,s)=>a+s.exercises.length,0);
                        return(
                            <Flex key={day.id} align="center" gap={8} style={{marginBottom:8}}>
                                <Card size="small" style={{flex:1,borderRadius:10,cursor:'pointer',border:'1.5px solid #f0f0f0',transition:'all 0.15s'}}
                                      onClick={()=>openDay(day,activeProg)}
                                      onMouseEnter={e=>{e.currentTarget.style.borderColor='#adc6ff';}}
                                      onMouseLeave={e=>{e.currentTarget.style.borderColor='#f0f0f0';}}>
                                    <Flex justify="space-between" align="center">
                                        <div>
                                            <Text strong style={{fontSize:13}}>{day.name}</Text>
                                            <Text type="secondary" style={{fontSize:11,marginLeft:8}}>
                                                {exCount} упражнений
                                            </Text>
                                        </div>
                                        <Flex gap={6} align="center">
                                            <Tag style={{fontSize:10}}>{DAYS_SHORT[day.day_index]}</Tag>
                                            {activeProg.is_active&&(
                                                <Button type="primary" size="small" icon={<PlayCircleOutlined/>}
                                                        style={{background:GRADIENT,border:'none'}}
                                                        onClick={e=>{e.stopPropagation();onStartWorkout(day);}}>
                                                    Начать
                                                </Button>
                                            )}
                                        </Flex>
                                    </Flex>
                                </Card>
                                <Popconfirm title="Удалить день?" onConfirm={()=>handleDeleteDay(day.id)}
                                            okText="Удалить" cancelText="Нет" okButtonProps={{danger:true}}>
                                    <Button type="text" size="small" icon={<DeleteOutlined/>} danger/>
                                </Popconfirm>
                            </Flex>
                        );
                    })}
                </div>

                {/* Покрытие мышц */}
                <div>
                    <Text strong style={{fontSize:14,display:'block',marginBottom:12}}>💪 Покрытие мышц</Text>
                    {(activeProg.muscle_coverage??[]).slice(0,10).map(item=>(
                        <div key={item.muscle.key} style={{marginBottom:8}}>
                            <Flex justify="space-between" style={{marginBottom:2}}>
                                <Flex align="center" gap={6}>
                                    <span style={{fontSize:14}}>{item.muscle.emoji||'💪'}</span>
                                    <Text style={{fontSize:12}}>{item.muscle.name}</Text>
                                </Flex>
                                <Text style={{fontSize:10,color:LEVEL_COLOR[item.level]}}>{LEVEL_LABEL[item.level]}</Text>
                            </Flex>
                            <div style={{height:5,background:'#f0f0f0',borderRadius:3,overflow:'hidden'}}>
                                <div style={{
                                    width:`${Math.min(100,(item.score/((activeProg.muscle_coverage[0]?.score)||1))*100)}%`,
                                    height:'100%',background:LEVEL_COLOR[item.level],borderRadius:3,
                                }}/>
                            </div>
                        </div>
                    ))}
                    {(!activeProg.muscle_coverage||activeProg.muscle_coverage.length===0)&&(
                        <Text type="secondary" style={{fontSize:12}}>Добавьте упражнения чтобы увидеть анализ</Text>
                    )}

                    {/* Непокрытые мышцы */}
                    {(activeProg.uncovered_muscles?.length>0)&&(
                        <div style={{marginTop:12}}>
                            <Button size="small" type="text" icon={<EyeOutlined/>}
                                    onClick={()=>setShowUncovered(v=>!v)}
                                    style={{color:'#8c8c8c',padding:0,fontSize:11}}>
                                {showUncovered?'Скрыть':'Показать'} непокрытые мышцы ({activeProg.uncovered_muscles.length})
                            </Button>
                            {showUncovered&&(
                                <div style={{marginTop:8}}>
                                    {activeProg.uncovered_muscles.map(m=>(
                                        <Tag key={m.key} style={{marginBottom:4,fontSize:10}}>
                                            {m.emoji} {m.name}
                                        </Tag>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    // ── ДЕНЬ ─────────────────────────────────────────────────────
    if(view==='day'&&activeDay&&activeProg) return (
        <div>
            <Flex align="center" gap={10} style={{marginBottom:16}} wrap="wrap">
                <Button type="text" onClick={()=>{loadProgram(activeProg.id).then(full=>{setActiveProg(full);setView('program');});}}>
                    ← {activeProg.name}
                </Button>
                {editingDayName?(
                    <Flex gap={6} align="center">
                        <Input value={dayNameEdit} onChange={e=>setDayNameEdit(e.target.value)}
                               onPressEnter={handleSaveDayName} style={{width:200}} size="small" autoFocus/>
                        <Button size="small" type="primary" onClick={handleSaveDayName}
                                style={{background:GRADIENT,border:'none'}}>✓</Button>
                        <Button size="small" onClick={()=>setEditingDayName(false)}>✕</Button>
                    </Flex>
                ):(
                    <Flex align="center" gap={8}>
                        <Title level={4} style={{margin:0}}>{activeDay.name}</Title>
                        <Button type="text" size="small" icon={<EditOutlined/>}
                                onClick={()=>setEditingDayName(true)} style={{color:'#8c8c8c'}}/>
                    </Flex>
                )}
                {activeProg.is_active&&(
                    <Button type="primary" icon={<PlayCircleOutlined/>}
                            style={{background:GRADIENT,border:'none',marginLeft:'auto'}}
                            onClick={()=>onStartWorkout(activeDay)}>
                        Начать тренировку
                    </Button>
                )}
            </Flex>

            {/* Секции с упражнениями */}
            {activeDay.sections.length===0&&(
                <div style={{textAlign:'center',padding:'24px',background:'#fafafa',borderRadius:12,marginBottom:12}}>
                    <Text type="secondary">Добавьте раздел чтобы начать</Text>
                </div>
            )}
            {activeDay.sections.map(section=>(
                <Card key={section.id} size="small" style={{marginBottom:12,borderRadius:12,border:'1.5px solid #f0f0f0'}}>
                    {section.title&&(
                        <Text strong style={{fontSize:13,color:'#667eea',display:'block',marginBottom:10,
                            textTransform:'uppercase',letterSpacing:0.5}}>
                            {section.title}
                        </Text>
                    )}
                    {section.exercises.length===0&&(
                        <Text type="secondary" style={{fontSize:12,display:'block',marginBottom:8}}>
                            Нет упражнений
                        </Text>
                    )}
                    {section.exercises.map((de,idx)=>(
                        <Flex key={de.id} align="center" gap={10}
                              style={{padding:'8px 0',borderBottom:idx<section.exercises.length-1?'1px solid #f5f5f5':'none'}}>
                            {de.exercise.image_url?(
                                <img src={de.exercise.image_url} style={{width:36,height:36,borderRadius:6,objectFit:'cover',flexShrink:0}}/>
                            ):(
                                <div style={{width:36,height:36,borderRadius:6,background:'#f0f2ff',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:18}}>
                                    {de.exercise.emoji||'🏋️'}
                                </div>
                            )}
                            <div style={{flex:1,minWidth:0}}>
                                <Text strong style={{fontSize:13}}>{de.exercise.name}</Text>
                                <Flex gap={4} style={{marginTop:2}}>
                                    <Tag style={{fontSize:10}}>{de.sets_count} подх.</Tag>
                                    {de.reps_hint&&<Tag style={{fontSize:10}}>{de.reps_hint}</Tag>}
                                </Flex>
                            </div>
                            <Button type="text" size="small" icon={<DeleteOutlined/>} danger
                                    onClick={()=>handleRemoveEx(de.id)}/>
                        </Flex>
                    ))}
                    <Button type="dashed" size="small" icon={<PlusOutlined/>} block style={{marginTop:8}}
                            onClick={()=>{setAddingTo({sectionId:section.id,dayId:activeDay.id});setExModal(true);}}>
                        Добавить упражнение
                    </Button>
                </Card>
            ))}

            {/* Добавить секцию */}
            <Flex gap={8}>
                <Input placeholder="Название раздела (Грудь, Трицепс...)"
                       value={newSecTitle} onChange={e=>setNewSecTitle(e.target.value)}
                       onPressEnter={handleAddSection} size="small" style={{flex:1}}/>
                <Button size="small" type="primary" icon={<PlusOutlined/>}
                        loading={saving} onClick={handleAddSection}
                        style={{background:GRADIENT,border:'none'}}>
                    Раздел
                </Button>
            </Flex>

            <Modal title="Выберите упражнение" open={exModal}
                   onCancel={()=>{setExModal(false);setAddingTo(null);}}
                   footer={null} width={840} destroyOnClose>
                <ExerciseLibrary selectable onSelect={handleAddEx}/>
            </Modal>
        </div>
    );

    return null;
}
