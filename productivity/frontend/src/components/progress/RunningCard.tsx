/**
 * RunningCard — карточка бегового трекера.
 * Принимает дистанцию (м) + время (мин:сек) и считает темп.
 */
import {useState} from 'react';
import {Button, Flex, InputNumber, Input, Popconfirm, Typography, Tag, Tooltip} from 'antd';
import {ArrowUpOutlined, ArrowDownOutlined, DeleteOutlined, PlusOutlined, MinusOutlined} from '@ant-design/icons';
import type {ProgressTracker, RunningRecord} from '../../types/progress/progress.ts';
import {calcPace, fmtPace, fmtDuration, fmtDistance, compareRunning} from '../../types/progress/progress.ts';
import {useProgressStore} from '../../store/progress/progressStore.ts';
import {ChartEngine} from './ChartEngine.tsx';
import type {UnifiedRecord} from '../../store/progress/chartUtils.ts';

const {Text, Title} = Typography;

interface Props { tracker: ProgressTracker; onDelete: ()=>void; }

export function RunningCard({tracker, onDelete}: Props) {
    const {addRunningRecord, removeRunningRecord} = useProgressStore();
    const [distM,    setDistM]    = useState<number|null>(null);
    const [durMin,   setDurMin]   = useState<number|null>(null);
    const [durSec,   setDurSec]   = useState<number|null>(null);
    const [note,     setNote]     = useState('');
    const [showHist, setShowHist] = useState(false);

    const records = [...(tracker.runningRecords ?? [])].sort(
        (a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );
    const latest = records[0] ?? null;
    const prev   = records[1] ?? null;

    const cmp = latest && prev ? compareRunning(latest, prev) : null;
    const previewPace = distM && (durMin||durSec)
        ? calcPace(distM, (durMin??0)*60 + (durSec??0))
        : null;

    const handleAdd = () => {
        if (!distM || (!durMin && !durSec)) return;
        const totalSec = (durMin??0)*60 + (durSec??0);
        addRunningRecord(tracker.id, distM, totalSec, note.trim() || undefined);
        setDistM(null); setDurMin(null); setDurSec(null); setNote('');
    };

    const fmtDate = (iso: string) => {
        const d = new Date(iso);
        const t = d.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'});
        return d.toDateString()===new Date().toDateString()
            ? `Сегодня, ${t}`
            : d.toLocaleDateString('ru-RU',{day:'numeric',month:'short'}) + `, ${t}`;
    };

    // Для графика используем темп (меньше = лучше, но инвертируем для графика)
    // Или скорость (м/мин) — больше = лучше
    const unified: UnifiedRecord[] = records.map(r => ({
        id:    r.id,
        date:  r.date,
        value: Math.round(r.distance / r.duration * 60 * 10) / 10, // м/мин
        label: `${fmtDistance(r.distance)} за ${fmtDuration(r.duration)}`,
    }));

    return (
        <div style={{
            background:'white',borderRadius:16,padding:24,
            boxShadow:'0 4px 16px rgba(0,0,0,0.08)',
            borderTop:`4px solid ${tracker.color}`,
        }}>
            {/* Шапка */}
            <Flex justify="space-between" align="flex-start" style={{marginBottom:16}}>
                <div>
                    <Flex align="center" gap={8} style={{marginBottom:6}}>
                        <span style={{fontSize:18}}>🏃</span>
                        <Title level={5} style={{margin:0}}>{tracker.name}</Title>
                    </Flex>
                    {latest ? (
                        <div>
                            <Flex align="baseline" gap={8} style={{marginBottom:4}} wrap="wrap">
                                <Text style={{fontSize:22,fontWeight:700,color:tracker.color,lineHeight:1}}>
                                    {fmtDistance(latest.distance)}
                                </Text>
                                <Text type="secondary">за</Text>
                                <Text style={{fontSize:22,fontWeight:700,color:tracker.color,lineHeight:1}}>
                                    {fmtDuration(latest.duration)}
                                </Text>
                                {cmp && (
                                    <Tag color={cmp.better?'success':'error'}
                                         icon={cmp.better?<ArrowUpOutlined/>:<ArrowDownOutlined/>}
                                         style={{cursor:'default',fontSize:12}}>
                                        {cmp.better?'+':''}{cmp.diffPct}% скорость
                                    </Tag>
                                )}
                            </Flex>
                            <Flex align="center" gap={8}>
                                <Text type="secondary" style={{fontSize:12}}>Темп:</Text>
                                <Text style={{fontSize:13,fontWeight:600,color:tracker.color}}>
                                    {fmtPace(latest.pace)}
                                </Text>
                                <Tooltip title="Темп — сколько минут на километр. Меньше = быстрее.">
                                    <Text type="secondary" style={{fontSize:11,cursor:'help'}}>ⓘ</Text>
                                </Tooltip>
                            </Flex>
                        </div>
                    ) : (
                        <Text type="secondary" style={{fontSize:13}}>Нет записей</Text>
                    )}
                </div>
                <Popconfirm title="Удалить трекер?" description="Все записи будут удалены"
                            onConfirm={onDelete} okText="Удалить" cancelText="Отмена"
                            okButtonProps={{danger:true}}>
                    <Button type="text" icon={<DeleteOutlined/>} danger size="small"/>
                </Popconfirm>
            </Flex>

            {/* График — скорость м/мин */}
            <div style={{marginBottom:16}}>
                <Text type="secondary" style={{fontSize:11,display:'block',marginBottom:4}}>
                    График: скорость (м/мин) — больше = лучше
                </Text>
                <ChartEngine trackerId={tracker.id} records={unified}
                             unit="м/мин" color={tracker.color}
                             onDelete={ids=>ids.forEach(id=>removeRunningRecord(tracker.id,id))}/>
            </div>

            {/* Новая запись */}
            <div style={{background:'#fafafa',borderRadius:10,padding:'12px 16px',marginBottom:12}}>
                <Text strong style={{fontSize:13,display:'block',marginBottom:10}}>Новая запись</Text>

                <Flex gap={8} style={{marginBottom:8}} wrap="wrap">
                    <Flex align="center" gap={4}>
                        <Text style={{fontSize:12,color:'#8c8c8c',flexShrink:0}}>📏 Дистанция:</Text>
                        <InputNumber
                            min={1} value={distM??undefined}
                            onChange={v=>setDistM(v??null)}
                            placeholder="Метры" size="small" style={{width:90}}
                            addonAfter="м"
                        />
                    </Flex>
                    <Flex align="center" gap={4}>
                        <Text style={{fontSize:12,color:'#8c8c8c',flexShrink:0}}>⏱ Время:</Text>
                        <InputNumber min={0} max={999} value={durMin??undefined}
                                     onChange={v=>setDurMin(v??null)}
                                     placeholder="мин" size="small" style={{width:72}} addonAfter="мин"/>
                        <InputNumber min={0} max={59} value={durSec??undefined}
                                     onChange={v=>setDurSec(v??null)}
                                     placeholder="сек" size="small" style={{width:72}} addonAfter="сек"/>
                    </Flex>
                </Flex>

                {/* Предпросмотр темпа */}
                {previewPace !== null && previewPace > 0 && (
                    <div style={{
                        background:`${tracker.color}12`,border:`1px solid ${tracker.color}30`,
                        borderRadius:8,padding:'6px 12px',marginBottom:8,
                    }}>
                        <Flex align="center" gap={12}>
                            <span>🏃</span>
                            <Text style={{fontSize:13}}>
                                Темп: <Text strong style={{color:tracker.color,fontSize:15}}>
                                    {fmtPace(previewPace)}
                                </Text>
                            </Text>
                            {latest && (() => {
                                const c = compareRunning(
                                    {distance:distM!,duration:(durMin??0)*60+(durSec??0)},
                                    latest
                                );
                                return (
                                    <Tag color={c.better?'success':'error'} style={{fontSize:11}}>
                                        {c.better?'▲ быстрее':'▼ медленнее'} на {Math.abs(c.diffPct)}%
                                    </Tag>
                                );
                            })()}
                        </Flex>
                    </div>
                )}

                <Flex gap={8}>
                    <Input placeholder="Заметка" value={note} onChange={e=>setNote(e.target.value)}
                           onPressEnter={handleAdd} size="small" style={{flex:2}} maxLength={100}/>
                    <Button type="primary" icon={<PlusOutlined/>} onClick={handleAdd}
                            disabled={!distM||(!durMin&&!durSec)}
                            size="small"
                            style={{background:tracker.color,border:'none'}}/>
                </Flex>
            </div>

            {/* История */}
            {records.length>0 && (
                <div>
                    <Button type="link" size="small"
                            icon={showHist?<MinusOutlined/>:<PlusOutlined/>}
                            onClick={()=>setShowHist(h=>!h)}
                            style={{padding:0,color:'#8c8c8c',fontSize:12}}>
                        {showHist?'Скрыть':'История'} ({records.length})
                    </Button>
                    {showHist && (
                        <div style={{marginTop:8}}>
                            {records.map((r,i)=>{
                                const rprev=records[i+1];
                                const c=rprev?compareRunning(r,rprev):null;
                                return(
                                    <Flex key={r.id} justify="space-between" align="center"
                                          style={{padding:'8px 0',borderBottom:'1px solid #f0f0f0'}}>
                                        <div>
                                            <Flex align="center" gap={8}>
                                                <Text style={{fontWeight:600,color:tracker.color,fontSize:14}}>
                                                    {fmtDistance(r.distance)} · {fmtDuration(r.duration)}
                                                </Text>
                                                {c&&(
                                                    <Text style={{fontSize:11,color:c.better?'#52c41a':'#f5222d'}}>
                                                        {c.better?'▲':'▼'}{Math.abs(c.diffPct)}%
                                                    </Text>
                                                )}
                                            </Flex>
                                            <Text type="secondary" style={{fontSize:11}}>
                                                Темп {fmtPace(r.pace)}{r.note?` — ${r.note}`:''}
                                            </Text>
                                        </div>
                                        <Flex align="center" gap={8}>
                                            <Text type="secondary" style={{fontSize:11}}>{fmtDate(r.date)}</Text>
                                            <Popconfirm title="Удалить?" onConfirm={()=>removeRunningRecord(tracker.id,r.id)}
                                                        okText="Да" cancelText="Нет" okButtonProps={{danger:true}}>
                                                <Button type="text" size="small" icon={<DeleteOutlined/>} danger style={{opacity:0.5}}/>
                                            </Popconfirm>
                                        </Flex>
                                    </Flex>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
