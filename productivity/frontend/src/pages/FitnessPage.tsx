/**
 * FitnessPage v3 — с навигацией на страницы упражнений и мышц.
 * Убраны модалки, добавлены полные страницы детальной информации.
 */
import {useEffect, useState} from 'react';
import {Tabs, Typography} from 'antd';
import {BookOpen, Dumbbell, Heart, Settings} from 'lucide-react';
import {ExerciseLibrary}      from './fitness/ExerciseLibrary.tsx';
import {ProgramBuilder}       from './fitness/ProgramBuilder.tsx';
import {MuscleLibrary}        from './fitness/MuscleLibrary.tsx';
import {WorkoutRunner}        from './fitness/WorkoutRunner.tsx';
import {FitnessAdmin}         from './fitness/FitnessAdmin.tsx';
import {ExerciseDetailPage}   from './fitness/ExerciseDetailPage.tsx';
import {MuscleDetailPage}     from './fitness/MuscleDetailPage.tsx';
import {useFitnessStore}      from '../store/fitness/fitnessStore.ts';
import {useAuthStore}         from '../store/auth/authStore.ts';
import type {TrainingDay}     from '../api/fitness.ts';

const {Title, Text} = Typography;
const isMob = ()=>window.innerWidth<=768;
const TAB_KEY = 'fitness-active-tab';

type DetailView =
    | null
    | {type:'exercise'; id:number; prevTab:string}
    | {type:'muscle';   id:number; prevTab:string};

export function FitnessPage() {
    const {programs, fetchPrograms} = useFitnessStore();
    const {user}   = useAuthStore();
    const isMobile = isMob();
    const isAdmin  = (user as any)?.is_superuser ?? false;

    const [tab,        setTabRaw]     = useState(()=>localStorage.getItem(TAB_KEY)||'programs');
    const [runningDay, setRunningDay] = useState<TrainingDay|null>(null);
    const [detail,     setDetail]     = useState<DetailView>(null);

    const setTab = (t:string)=>{ setTabRaw(t); localStorage.setItem(TAB_KEY,t); };

    useEffect(()=>{ fetchPrograms(); },[]);

    // Открыть страницу упражнения
    const openExercise = (id:number) => setDetail({type:'exercise', id, prevTab:tab});
    // Открыть страницу мышцы
    const openMuscle   = (id:number) => setDetail({type:'muscle',   id, prevTab:tab});

    const handleBack = () => {
        if(detail) { setTab(detail.prevTab); setDetail(null); }
    };

    // Показываем страницу детали
    if(detail?.type === 'exercise') {
        return (
            <div style={{maxWidth:1100,margin:'0 auto',padding:isMobile?'14px 12px':0}}>
                <ExerciseDetailPage
                    exerciseId={detail.id}
                    onBack={handleBack}
                    onMuscleClick={openMuscle}
                />
            </div>
        );
    }
    if(detail?.type === 'muscle') {
        return (
            <div style={{maxWidth:1100,margin:'0 auto',padding:isMobile?'14px 12px':0}}>
                <MuscleDetailPage muscleId={detail.id} onBack={handleBack}/>
            </div>
        );
    }

    if(runningDay) {
        return <WorkoutRunner day={runningDay} onBack={()=>setRunningDay(null)}/>;
    }

    const items = [
        {
            key:'programs',
            label:<span style={{display:'flex',alignItems:'center',gap:5}}>
                <Dumbbell size={14} strokeWidth={2}/>{isMobile?'Программы':'Программы'}
            </span>,
            children:<ProgramBuilder onStartWorkout={d=>setRunningDay(d)}/>,
        },
        {
            key:'library',
            label:<span style={{display:'flex',alignItems:'center',gap:5}}>
                <BookOpen size={14} strokeWidth={2}/>{isMobile?'Упражнения':'Упражнения'}
            </span>,
            // Передаём onExerciseClick — нажатие открывает страницу
            children:<ExerciseLibrary onExercisePageClick={openExercise}/>,
        },
        {
            key:'muscles',
            label:<span style={{display:'flex',alignItems:'center',gap:5}}>
                <Heart size={14} strokeWidth={2}/>{isMobile?'Мышцы':'Мышцы'}
            </span>,
            children:<MuscleLibrary onMusclePageClick={openMuscle}/>,
        },
        ...(isAdmin?[{
            key:'admin',
            label:<span style={{display:'flex',alignItems:'center',gap:5}}>
                <Settings size={14} strokeWidth={2}/>Администрирование
            </span>,
            children:<FitnessAdmin/>,
        }]:[]),
    ];

    return (
        <div style={{maxWidth:1100,margin:'0 auto',padding:isMobile?'14px 12px':0}}>
            {!isMobile&&(
                <div style={{marginBottom:20}}>
                    <Title level={2} style={{margin:0,color:'#434343'}}>💪 Фитнес</Title>
                    <Text type="secondary" style={{fontSize:14}}>
                        Программы тренировок, библиотека упражнений, отслеживание прогресса
                    </Text>
                </div>
            )}
            <Tabs activeKey={tab} onChange={setTab} size={isMobile?'small':'large'} items={items}/>
        </div>
    );
}
