/**
 * ExerciseDetailPage — полная страница упражнения.
 * Вызывается вместо модального окна.
 */
import {useEffect, useState} from 'react';
import {Button, Flex, Tag, Spin, Typography, Divider} from 'antd';
import {ArrowLeftOutlined, PlayCircleOutlined, InfoCircleOutlined} from '@ant-design/icons';
import {fitnessApi} from '../../api/fitness.ts';
import type {Exercise, MuscleGroup} from '../../api/fitness.ts';

const {Text, Title, Paragraph} = Typography;

const INTENSITY_LABEL: Record<number,string> = {1:'Немного',2:'Средне',3:'Сильно',4:'Очень сильно'};
const INTENSITY_COLOR: Record<number,string> = {1:'#52c41a',2:'#1677ff',3:'#fa8c16',4:'#f5222d'};
const INTENSITY_BAR:   Record<number,number> = {1:25,2:50,3:75,4:100};

const CATEGORIES = [
    {value:'chest',label:'Грудь'},{value:'back',label:'Спина'},
    {value:'shoulders',label:'Плечи'},{value:'arms',label:'Руки'},
    {value:'legs',label:'Ноги'},{value:'core',label:'Пресс/Кор'},
    {value:'cardio',label:'Кардио'},{value:'other',label:'Другое'},
];
const EQUIPMENT = [
    {value:'barbell',label:'Штанга'},{value:'dumbbell',label:'Гантели'},
    {value:'machine',label:'Тренажёр'},{value:'cable',label:'Блок'},
    {value:'bodyweight',label:'Без оборудования'},{value:'other',label:'Другое'},
];

interface Props {
    exerciseId: number;
    onBack:     ()=>void;
    onMuscleClick?: (muscleId:number)=>void;
    actionButton?: React.ReactNode;
}

export function ExerciseDetailPage({exerciseId, onBack, onMuscleClick, actionButton}: Props) {
    const [ex,      setEx]      = useState<Exercise|null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        setLoading(true);
        fitnessApi.getExercise(exerciseId)
            .then(({data})=>setEx(data))
            .finally(()=>setLoading(false));
    },[exerciseId]);

    if(loading) return <div style={{textAlign:'center',padding:'60px 0'}}><Spin size="large"/></div>;
    if(!ex) return <div style={{padding:24}}><Text type="secondary">Упражнение не найдено</Text></div>;

    const textSections = [
        {emoji:'📝', title:'Описание',          text:ex.description},
        {emoji:'⚙️', title:'Техника выполнения', text:ex.how_to},
        {emoji:'🏆', title:'Польза',             text:ex.benefits},
        {emoji:'💡', title:'Советы',             text:ex.tips},
        {emoji:'⚠️', title:'Частые ошибки',      text:ex.common_mistakes},
    ].filter(s=>s.text);

    return (
        <div style={{maxWidth:760,margin:'0 auto'}}>
            {/* Навигация */}
            <Flex align="center" gap={10} style={{marginBottom:0}}>
                <Button type="text" icon={<ArrowLeftOutlined/>} onClick={onBack} size="small">
                    Назад
                </Button>
                {actionButton}
            </Flex>

            {/* Шапка — растянутая */}
            <div style={{
                background:'linear-gradient(135deg,#667eea,#764ba2)',
                borderRadius:16,padding:'24px 28px',marginBottom:20,
                display:'flex',alignItems:'center',gap:20,
            }}>
                {ex.image_url ? (
                    <img src={ex.image_url} alt={ex.name}
                         style={{width:100,height:100,borderRadius:14,objectFit:'cover',
                             border:'3px solid rgba(255,255,255,0.3)',flexShrink:0}}/>
                ) : (
                    <div style={{width:100,height:100,borderRadius:14,
                        background:'rgba(255,255,255,0.2)',display:'flex',
                        alignItems:'center',justifyContent:'center',fontSize:52,flexShrink:0}}>
                        {ex.emoji||'🏋️'}
                    </div>
                )}
                <div>
                    <Title level={2} style={{margin:0,color:'white'}}>{ex.name}</Title>
                    <Flex gap={8} style={{marginTop:8}} wrap="wrap">
                        <Tag style={{background:'rgba(255,255,255,0.2)',border:'none',color:'white'}}>
                            {CATEGORIES.find(c=>c.value===ex.category)?.label||ex.category}
                        </Tag>
                        <Tag style={{background:'rgba(255,255,255,0.2)',border:'none',color:'white'}}>
                            {EQUIPMENT.find(e=>e.value===ex.equipment)?.label||ex.equipment}
                        </Tag>
                    </Flex>
                </div>
            </div>

            {/* Задействованные мышцы */}
            {ex.muscles?.length>0 && (
                <div style={{background:'white',borderRadius:14,padding:'20px 24px',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.06)',marginBottom:16}}>
                    <Text strong style={{fontSize:16,display:'block',marginBottom:14}}>
                        💪 Задействованные мышцы
                    </Text>
                    <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                        {ex.muscles.map(em=>(
                            <div key={em.id}
                                 onClick={()=>onMuscleClick&&onMuscleClick(em.muscle.id)}
                                 style={{
                                     background:'#fafafa',borderRadius:12,padding:'10px 16px',
                                     border:'1.5px solid #f0f0f0',
                                     cursor:onMuscleClick?'pointer':'default',
                                     transition:'all 0.15s',minWidth:160,
                                 }}
                                 onMouseEnter={e=>{if(onMuscleClick){e.currentTarget.style.borderColor='#adc6ff';e.currentTarget.style.background='#f0f2ff';}}}
                                 onMouseLeave={e=>{e.currentTarget.style.borderColor='#f0f0f0';e.currentTarget.style.background='#fafafa';}}>
                                <Flex align="center" gap={10}>
                                    <div style={{
                                        width:10,height:10,borderRadius:'50%',
                                        background:INTENSITY_COLOR[em.intensity],flexShrink:0,
                                    }}/>
                                    <div style={{flex:1}}>
                                        <Text strong style={{fontSize:13,display:'block'}}>{em.muscle.name}</Text>
                                        {/* Шкала интенсивности */}
                                        <div style={{height:4,background:'#f0f0f0',borderRadius:2,width:'100%',overflow:'hidden',marginTop:4,marginBottom:2}}>
                                            <div style={{
                                                width:`${INTENSITY_BAR[em.intensity]}%`,height:'100%',
                                                background:INTENSITY_COLOR[em.intensity],borderRadius:2,
                                            }}/>
                                        </div>
                                        <Text style={{fontSize:11,color:INTENSITY_COLOR[em.intensity]}}>
                                            {INTENSITY_LABEL[em.intensity]}
                                        </Text>
                                    </div>
                                    {onMuscleClick&&<InfoCircleOutlined style={{fontSize:12,color:'#8c8c8c',flexShrink:0}}/>}
                                </Flex>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* GIF */}
            {ex.gif_url && (
                <div style={{background:'white',borderRadius:14,padding:'20px 24px',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.06)',marginBottom:16,textAlign:'center'}}>
                    <img src={ex.gif_url} alt="анимация" style={{maxWidth:'100%',borderRadius:10,maxHeight:280}}/>
                </div>
            )}

            {/* Текстовые секции */}
            {textSections.length>0 && (
                <div style={{background:'white',borderRadius:14,padding:'24px',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.06)',marginBottom:16}}>
                    {textSections.map((s,i)=>(
                        <div key={i}>
                            <Flex align="center" gap={10} style={{marginBottom:10}}>
                                <span style={{fontSize:20}}>{s.emoji}</span>
                                <Title level={5} style={{margin:0}}>{s.title}</Title>
                            </Flex>
                            <Paragraph style={{
                                color:'#434343',lineHeight:1.8,whiteSpace:'pre-wrap',
                                marginLeft:30,marginBottom:0,fontSize:14,
                            }}>
                                {s.text}
                            </Paragraph>
                            {i<textSections.length-1&&<Divider style={{margin:'20px 0'}}/>}
                        </div>
                    ))}
                </div>
            )}

            {/* Ссылки */}
            {(ex.video_url||ex.extra_links?.length>0) && (
                <div style={{background:'white',borderRadius:14,padding:'20px 24px',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.06)',marginBottom:16}}>
                    <Text strong style={{fontSize:15,display:'block',marginBottom:12}}>🔗 Ссылки</Text>
                    {ex.video_url&&(
                        <a href={ex.video_url} target="_blank" rel="noreferrer"
                           style={{display:'flex',alignItems:'center',gap:8,color:'#667eea',marginBottom:8,fontSize:14}}>
                            <PlayCircleOutlined/> Смотреть видео
                        </a>
                    )}
                    {ex.extra_links?.map((l,i)=>(
                        <a key={i} href={l.url} target="_blank" rel="noreferrer"
                           style={{display:'block',color:'#667eea',marginBottom:6,fontSize:14}}>
                            🔗 {l.title}
                        </a>
                    ))}
                </div>
            )}
        </div>
    );
}
