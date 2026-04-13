/**
 * MuscleDetailPage — полная страница мышцы.
 */
import {useEffect, useState} from 'react';
import {Button, Flex, Tag, Spin, Typography, Divider} from 'antd';
import {ArrowLeftOutlined} from '@ant-design/icons';
import {fitnessApi} from '../../api/fitness.ts';
import type {MuscleGroup} from '../../api/fitness.ts';

const {Text, Title, Paragraph} = Typography;

const REGIONS: Record<string,string> = {
    chest:'Грудь',back:'Спина',shoulders:'Плечи',
    arms:'Руки',legs:'Ноги',core:'Пресс/Кор',other:'Другое',
};

interface Props {
    muscleId: number;
    onBack:   ()=>void;
}

export function MuscleDetailPage({muscleId, onBack}: Props) {
    const [muscle,  setMuscle]  = useState<MuscleGroup|null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(()=>{
        setLoading(true);
        fitnessApi.getMuscle(muscleId)
            .then(({data})=>setMuscle(data))
            .finally(()=>setLoading(false));
    },[muscleId]);

    if(loading) return <div style={{textAlign:'center',padding:'60px 0'}}><Spin size="large"/></div>;
    if(!muscle) return <div style={{padding:24}}><Text type="secondary">Мышца не найдена</Text></div>;

    const sections = [
        {emoji:'📍',title:'Что это за мышца',    text:muscle.description},
        {emoji:'⚙️',title:'Функции и движения',  text:muscle.functions},
        {emoji:'🏃',title:'В повседневной жизни', text:muscle.daily_life},
        {emoji:'🏆',title:'Зачем развивать',      text:muscle.benefits},
        {emoji:'🧘',title:'Осанка и здоровье',    text:muscle.posture_role},
    ].filter(s=>s.text);

    return (
        <div style={{maxWidth:760,margin:'0 auto'}}>
            <Button type="text" icon={<ArrowLeftOutlined/>} onClick={onBack} size="small"
                    style={{marginBottom:12}}>
                Назад
            </Button>

            {/* Шапка */}
            <div style={{
                background:'linear-gradient(135deg,#667eea,#764ba2)',
                borderRadius:16,padding:'24px 28px',marginBottom:20,
                display:'flex',alignItems:'center',gap:20,
            }}>
                {muscle.image_url ? (
                    <img src={muscle.image_url} alt={muscle.name}
                         style={{width:100,height:100,borderRadius:14,objectFit:'cover',
                             border:'3px solid rgba(255,255,255,0.3)',flexShrink:0}}/>
                ) : (
                    <div style={{width:100,height:100,borderRadius:14,
                        background:'rgba(255,255,255,0.2)',display:'flex',
                        alignItems:'center',justifyContent:'center',fontSize:52,flexShrink:0}}>
                        {muscle.emoji||'💪'}
                    </div>
                )}
                <div>
                    <Title level={2} style={{margin:0,color:'white'}}>{muscle.name}</Title>
                    {muscle.name_en&&(
                        <Text style={{color:'rgba(255,255,255,0.7)',fontSize:15,display:'block',marginTop:2}}>
                            {muscle.name_en}
                        </Text>
                    )}
                    <Tag style={{background:'rgba(255,255,255,0.2)',border:'none',color:'white',marginTop:8}}>
                        {REGIONS[muscle.body_region]||muscle.body_region}
                    </Tag>
                </div>
            </div>

            {sections.length===0 ? (
                <div style={{background:'white',borderRadius:14,padding:24,textAlign:'center',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.06)'}}>
                    <Text type="secondary" style={{fontSize:14}}>
                        Подробная информация о мышце ещё не добавлена
                    </Text>
                </div>
            ) : (
                <div style={{background:'white',borderRadius:14,padding:'24px',
                    boxShadow:'0 2px 10px rgba(0,0,0,0.06)'}}>
                    {sections.map((s,i)=>(
                        <div key={i}>
                            <Flex align="center" gap={10} style={{marginBottom:10}}>
                                <span style={{fontSize:22}}>{s.emoji}</span>
                                <Title level={5} style={{margin:0,fontSize:16}}>{s.title}</Title>
                            </Flex>
                            <Paragraph style={{
                                color:'#434343',lineHeight:1.8,whiteSpace:'pre-wrap',
                                marginLeft:32,marginBottom:0,fontSize:14,
                            }}>
                                {s.text}
                            </Paragraph>
                            {i<sections.length-1&&<Divider style={{margin:'20px 0'}}/>}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
