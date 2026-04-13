import {useState} from 'react';
import {Button, Input, Popconfirm, Space, Typography, Flex} from 'antd';
import {DeleteOutlined, EditOutlined, PlusOutlined, CheckOutlined, CloseOutlined} from '@ant-design/icons';
import {useWheelStore} from '../store/lifeWheel/lifeWheelStore.ts';
import {LifeWheelChart} from '../components/lifeWheel/LifeWheelChart.tsx';
import {LifeWheelPanel} from '../components/lifeWheel/LifeWheelPanel.tsx';

const {Text, Title} = Typography;

export function LifeWheel() {
    const {segments, addSegment, removeSegment, renameSegment} = useWheelStore();
    const [selectedId,  setSelectedId]  = useState<string|null>(segments[0]?.id ?? null);
    const [editingId,   setEditingId]   = useState<string|null>(null);
    const [editingName, setEditingName] = useState('');
    const [panelOpen,   setPanelOpen]   = useState(false);

    const selectedSegment = segments.find(s => s.id === selectedId) ?? null;

    const startRename = (id:string, name:string) => {setEditingId(id);setEditingName(name);};
    const commitRename = () => {
        if (editingId && editingName.trim()) renameSegment(editingId, editingName.trim());
        setEditingId(null); setEditingName('');
    };
    const handleSelect = (id:string) => {
        setSelectedId(prev => prev===id ? null : id);
        setPanelOpen(true);
    };

    return (
        <>
            {/* ═══ MOBILE ═══════════════════════════════════════════ */}
            <div className="mobile-only" style={{minHeight:'100vh',background:'#f0f2f5'}}>
                <div style={{padding:'14px 12px 8px'}}>
                    <Title level={4} style={{margin:0,color:'#434343'}}>Жизненный круг</Title>
                </div>

                {/* Круг */}
                <div style={{margin:'0 12px',background:'white',borderRadius:16,padding:'8px 8px 4px',boxShadow:'0 2px 10px rgba(0,0,0,0.07)'}}>
                    <LifeWheelChart segments={segments} selectedId={selectedId} onSelect={handleSelect}/>
                    <Text type="secondary" style={{display:'block',textAlign:'center',fontSize:11,paddingBottom:8}}>
                        Нажмите на сегмент чтобы открыть задачи
                    </Text>
                </div>

                {/* Список сегментов */}
                <div style={{padding:'10px 12px',paddingBottom: panelOpen ? 'calc(50vh + 70px)' : '80px'}}>
                    {segments.map(seg => {
                        const isSel=seg.id===selectedId, isEdit=seg.id===editingId;
                        return(
                            <div key={seg.id} onClick={()=>!isEdit&&handleSelect(seg.id)} style={{
                                display:'flex',alignItems:'center',justifyContent:'space-between',
                                padding:'11px 14px',marginBottom:6,cursor:'pointer',
                                background:isSel?'#f0f0ff':'white',
                                border:`1.5px solid ${isSel?'#adc6ff':'#f0f0f0'}`,
                                borderRadius:12,transition:'all 0.15s',
                            }}>
                                <Space size={10}>
                                    <div style={{width:10,height:10,borderRadius:'50%',background:seg.color,flexShrink:0}}/>
                                    {isEdit?(
                                        <Input size="small" value={editingName}
                                               onChange={e=>setEditingName(e.target.value)}
                                               onPressEnter={commitRename} autoFocus
                                               onClick={e=>e.stopPropagation()}
                                               style={{width:130,borderRadius:8}} maxLength={20}/>
                                    ):(
                                        <Text style={{fontSize:14,fontWeight:isSel?600:400}}>{seg.name}</Text>
                                    )}
                                </Space>
                                <Space size={2} onClick={e=>e.stopPropagation()}>
                                    <Text style={{fontSize:12,fontWeight:700,color:seg.color,minWidth:30,textAlign:'right'}}>{seg.score}/10</Text>
                                    {isEdit?(
                                        <Button type="text" size="small" icon={<CheckOutlined/>} onClick={commitRename} style={{color:'#52c41a'}}/>
                                    ):(
                                        <Button type="text" size="small" icon={<EditOutlined/>} onClick={()=>startRename(seg.id,seg.name)}/>
                                    )}
                                    <Popconfirm title="Удалить направление?"
                                                onConfirm={()=>{removeSegment(seg.id);if(selectedId===seg.id)setSelectedId(segments.find(s=>s.id!==seg.id)?.id??null);}}
                                                okText="Да" cancelText="Нет" disabled={segments.length<=1}>
                                        <Button type="text" size="small" icon={<DeleteOutlined/>} danger disabled={segments.length<=1}/>
                                    </Popconfirm>
                                </Space>
                            </div>
                        );
                    })}
                    {segments.length<10&&(
                        <Button block icon={<PlusOutlined/>} onClick={addSegment}
                                style={{borderRadius:10,height:44,marginTop:4}}>
                            Добавить направление ({segments.length}/10)
                        </Button>
                    )}
                </div>

                {/* Шторка снизу */}
                {panelOpen && selectedSegment && (
                    <div style={{
                        position:'fixed',bottom:60,left:0,right:0,
                        height:'50vh',background:'white',
                        borderRadius:'20px 20px 0 0',
                        boxShadow:'0 -6px 24px rgba(0,0,0,0.13)',
                        zIndex:500,display:'flex',flexDirection:'column',overflow:'hidden',
                    }}>
                        <div style={{width:36,height:4,borderRadius:2,background:'#ddd',margin:'10px auto 0'}}/>
                        <Flex justify="space-between" align="center" style={{padding:'8px 16px 4px'}}>
                            <Flex align="center" gap={8}>
                                <div style={{width:11,height:11,borderRadius:'50%',background:selectedSegment.color}}/>
                                <Text strong style={{fontSize:15}}>{selectedSegment.name}</Text>
                            </Flex>
                            <Button type="text" size="small" icon={<CloseOutlined/>}
                                    onClick={()=>setPanelOpen(false)} style={{color:'#8c8c8c'}}/>
                        </Flex>
                        <div style={{flex:1,overflowY:'auto',padding:'4px 16px 16px'}}>
                            <LifeWheelPanel segment={selectedSegment}/>
                        </div>
                    </div>
                )}
            </div>

            {/* ═══ DESKTOP ══════════════════════════════════════════ */}
            <div className="desktop-only" style={{maxWidth:1200,margin:'0 auto'}}>
                <div style={{marginBottom:28}}>
                    <Title level={2} style={{margin:0,color:'#434343'}}>Жизненный круг</Title>
                    <Text type="secondary" style={{fontSize:14}}>Оцените баланс по направлениям и ставьте задачи для роста</Text>
                </div>
                <Flex gap={24} align="flex-start" wrap="wrap">
                    <div style={{flex:'0 0 580px',width:580}}>
                        <div style={{background:'white',borderRadius:16,boxShadow:'0 4px 16px rgba(0,0,0,0.08)',padding:24}}>
                            <LifeWheelChart segments={segments} selectedId={selectedId} onSelect={handleSelect}/>
                            <div style={{marginTop:16}}>
                                {segments.map(seg=>{
                                    const isSel=seg.id===selectedId,isEdit=seg.id===editingId;
                                    return(
                                        <Flex key={seg.id} align="center" justify="space-between"
                                              onClick={()=>!isEdit&&handleSelect(seg.id)}
                                              style={{padding:'8px 12px',borderRadius:8,marginBottom:4,cursor:'pointer',background:isSel?'#f0f0ff':'transparent',border:`1px solid ${isSel?'#adc6ff':'transparent'}`}}>
                                            <Space>
                                                <div style={{width:10,height:10,borderRadius:'50%',background:seg.color,flexShrink:0}}/>
                                                {isEdit?<Input size="small" value={editingName} onChange={e=>setEditingName(e.target.value)} onPressEnter={commitRename} autoFocus onClick={e=>e.stopPropagation()} style={{width:140}} maxLength={20}/>:<Text style={{fontSize:13}}>{seg.name}</Text>}
                                            </Space>
                                            <Space size={4} onClick={e=>e.stopPropagation()}>
                                                <Text style={{fontSize:12,fontWeight:700,color:seg.color,minWidth:24,textAlign:'right'}}>{seg.score}/10</Text>
                                                {isEdit?<Button type="text" size="small" icon={<CheckOutlined/>} onClick={commitRename} style={{color:'#52c41a'}}/>:<Button type="text" size="small" icon={<EditOutlined/>} onClick={()=>startRename(seg.id,seg.name)}/>}
                                                <Popconfirm title="Удалить направление?" onConfirm={()=>{removeSegment(seg.id);if(selectedId===seg.id)setSelectedId(segments.find(s=>s.id!==seg.id)?.id??null);}} okText="Да" cancelText="Нет" disabled={segments.length<=1}>
                                                    <Button type="text" size="small" icon={<DeleteOutlined/>} danger disabled={segments.length<=1}/>
                                                </Popconfirm>
                                            </Space>
                                        </Flex>
                                    );
                                })}
                            </div>
                            {segments.length<10&&<Button block icon={<PlusOutlined/>} onClick={addSegment} style={{marginTop:12,borderRadius:8}}>Добавить направление ({segments.length}/10)</Button>}
                        </div>
                    </div>
                    <div style={{flex:'1 1 260px',minWidth:240}}>
                        <div style={{background:'white',borderRadius:16,boxShadow:'0 4px 16px rgba(0,0,0,0.08)',padding:24}}>
                            {selectedSegment?<LifeWheelPanel segment={selectedSegment}/>:<div style={{padding:'40px 0',textAlign:'center'}}><Text type="secondary">Нажмите на сегмент круга чтобы увидеть задачи</Text></div>}
                        </div>
                    </div>
                </Flex>
            </div>
        </>
    );
}
