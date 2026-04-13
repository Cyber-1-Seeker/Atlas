import {useState, useCallback, useEffect} from 'react';
import {
    ReactFlow, Background, Controls, MiniMap,
    addEdge, useNodesState, useEdgesState,
    type Connection, type Viewport, type Node,
    BackgroundVariant, useReactFlow, ReactFlowProvider,
    MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {Button, Typography, Input, Popconfirm, Spin, Empty, Flex} from 'antd';
import {PlusOutlined, DeleteOutlined, EditOutlined, ArrowLeftOutlined, CheckOutlined} from '@ant-design/icons';
import {useBoardStore} from '../store/board/boardStore.ts';
import {BottomToolbar}    from '../components/board/BottomToolbar.tsx';
import {StickyNode}       from '../components/board/nodes/StickyNode.tsx';
import {TextNode}         from '../components/board/nodes/TextNode.tsx';
import {ShapeNode}        from '../components/board/nodes/ShapeNode.tsx';
import {GoalNode}         from '../components/board/nodes/GoalNode.tsx';
import {TrackerNode}      from '../components/board/nodes/TrackerNode.tsx';
import {WheelSegmentNode} from '../components/board/nodes/WheelSegmentNode.tsx';
import {TableNode}        from '../components/board/nodes/TableNode.tsx';

const {Title, Text} = Typography;
const GRADIENT = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
const nodeTypes = {sticky:StickyNode,text:TextNode,shape:ShapeNode,goal:GoalNode,tracker:TrackerNode,wheelSegment:WheelSegmentNode,table:TableNode};
let nid=1;
const newId=()=>`n_${Date.now()}_${nid++}`;
const isMob=()=>window.innerWidth<=768;

function BoardCanvas() {
    const {activeBoard,nodes:sn,edges:se,setNodes:ssn,setEdges:sse,saveBoard,isSaving,lastSaved}=useBoardStore();
    const [nodes,setNodes,onNodesChange]=useNodesState(sn);
    const [edges,setEdges,onEdgesChange]=useEdgesState(se);
    const [history,setHistory]=useState<Node[][]>([]);
    const [mobile]=useState(isMob);
    const rf=useReactFlow();

    useEffect(()=>{setNodes(sn);setEdges(se);},[activeBoard?.id]);
    useEffect(()=>{ssn(nodes);},[nodes]);
    useEffect(()=>{sse(edges);},[edges]);

    const onConnect=useCallback((c:Connection)=>{
        setEdges(es=>addEdge({...c,animated:false,style:{stroke:'#667eea',strokeWidth:2},markerEnd:{type:MarkerType.ArrowClosed,color:'#667eea'}},es));
    },[setEdges]);

    const addNode=useCallback((type:string,data:Record<string,unknown>={})=>{
        const vp=rf.getViewport();
        const cx=(window.innerWidth/2-vp.x)/vp.zoom;
        const cy=(window.innerHeight/2-vp.y)/vp.zoom;
        const sizes:Record<string,{w:number;h:number}>={
            sticky:{w:180,h:160},text:{w:160,h:50},shape:{w:140,h:90},
            goal:{w:220,h:110},tracker:{w:200,h:100},wheelSegment:{w:180,h:100},table:{w:320,h:200},
        };
        const sz=sizes[type]??{w:180,h:120};
        const node:Node={
            id:newId(),type,
            position:{x:cx-sz.w/2+(Math.random()-.5)*60,y:cy-sz.h/2+(Math.random()-.5)*60},
            style:{width:sz.w,height:sz.h},data,
        };
        setHistory(h=>[...h.slice(-30),nodes]);
        setNodes(ns=>[...ns,node]);
    },[nodes,setNodes,rf]);

    const handleUndo=()=>{if(history.length===0)return;setNodes(history[history.length-1]);setHistory(h=>h.slice(0,-1));};
    const handleZoom=(dir:'in'|'out'|'fit')=>{
        if(dir==='in')rf.zoomIn({duration:200});
        if(dir==='out')rf.zoomOut({duration:200});
        if(dir==='fit')rf.fitView({duration:300,padding:0.1});
    };
    const handleSave=useCallback(()=>{saveBoard(rf.getViewport() as Viewport);},[rf,saveBoard]);
    useEffect(()=>{const t=setInterval(handleSave,30000);return()=>clearInterval(t);},[handleSave]);

    return (
        <div style={{width:'100%',height:'100%',position:'relative'}}>
            <ReactFlow
                nodes={nodes} edges={edges}
                onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                onConnect={onConnect} nodeTypes={nodeTypes} fitView
                deleteKeyCode="Delete" multiSelectionKeyCode="Shift"
                style={{background:'#f8f9fc'}}
                connectionLineStyle={{stroke:'#667eea',strokeWidth:2}}
                defaultEdgeOptions={{style:{stroke:'#667eea',strokeWidth:2},markerEnd:{type:MarkerType.ArrowClosed,color:'#667eea'}}}
            >
                <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#d9d9d9"/>
                {!mobile&&<Controls style={{boxShadow:'0 2px 8px rgba(0,0,0,0.1)',borderRadius:8}}/>}
                {!mobile&&<MiniMap style={{borderRadius:8,boxShadow:'0 2px 8px rgba(0,0,0,0.1)'}}
                    nodeColor={n=>{if(n.type==='sticky')return(n.data as {color:string}).color??'#fef08a';if(n.type==='shape')return(n.data as {color:string}).color??'#667eea';return'#667eea';}}/>}
            </ReactFlow>
            <BottomToolbar onAdd={addNode} onSave={handleSave} onUndo={handleUndo} onZoom={handleZoom} isSaving={isSaving} lastSaved={lastSaved} isMobile={mobile}/>
            {!mobile&&<div style={{position:'absolute',top:12,right:12,background:'white',borderRadius:8,padding:'4px 12px',boxShadow:'0 2px 8px rgba(0,0,0,0.08)',fontSize:11,color:'#8c8c8c'}}>
                {isSaving?'⏳ Сохранение...':lastSaved?`✓ ${lastSaved.toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit'})}` :'• Не сохранено'}
            </div>}
        </div>
    );
}

function BoardList() {
    const {boards,isLoading,fetchBoards,createBoard,deleteBoard,renameBoard,openBoard}=useBoardStore();
    const [editingId,setEditingId]=useState<number|null>(null);
    const [editTitle,setEditTitle]=useState('');
    const [creating,setCreating]=useState(false);
    const mobile=isMob();
    useEffect(()=>{fetchBoards();},[]);
    const handleCreate=async()=>{setCreating(true);try{const b=await createBoard('Новая доска');await openBoard(b.id);}finally{setCreating(false);}};
    const fmtDate=(iso:string)=>new Date(iso).toLocaleDateString('ru-RU',{day:'numeric',month:'short',year:'numeric'});

    return(
        <div style={{maxWidth:900,margin:'0 auto',padding:mobile?'14px 12px':'0 16px'}}>
            <Flex justify="space-between" align="flex-start" style={{marginBottom:mobile?14:24}} wrap="wrap" gap={10}>
                <div>
                    <Title level={mobile?4:2} style={{margin:0,color:'#434343'}}>Доски</Title>
                    {!mobile&&<Text type="secondary" style={{fontSize:14}}>Визуализируйте цели, трекеры и идеи</Text>}
                </div>
                <Button type="primary" icon={<PlusOutlined/>} size={mobile?'middle':'large'}
                        loading={creating} onClick={handleCreate} style={{background:GRADIENT,border:'none'}}>
                    {mobile?'Новая':'Новая доска'}
                </Button>
            </Flex>
            {isLoading?<div style={{textAlign:'center',padding:'60px 0'}}><Spin size="large"/></div>
            :boards.length===0?<Empty description="Нет досок" image={Empty.PRESENTED_IMAGE_SIMPLE} style={{padding:'60px 0'}}>
                <Button type="primary" icon={<PlusOutlined/>} onClick={handleCreate} style={{background:GRADIENT,border:'none'}}>Создать доску</Button>
            </Empty>:(
                <div style={{display:'grid',gridTemplateColumns:mobile?'repeat(2,1fr)':'repeat(auto-fill,minmax(240px,1fr))',gap:mobile?10:16}}>
                    {boards.map(board=>(
                        <div key={board.id} style={{background:'white',borderRadius:mobile?12:16,boxShadow:'0 4px 16px rgba(0,0,0,0.07)',border:'1.5px solid #f0f0f0',cursor:'pointer',overflow:'hidden',transition:'all 0.2s'}}
                             onClick={()=>openBoard(board.id)}
                             onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 8px 24px rgba(102,126,234,0.18)';e.currentTarget.style.borderColor='#adc6ff';}}
                             onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,0.07)';e.currentTarget.style.borderColor='#f0f0f0';}}>
                            <div style={{height:mobile?70:100,background:'linear-gradient(135deg,#f0f2ff 0%,#e8f4fd 100%)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:mobile?28:36}}>🗂️</div>
                            <div style={{padding:mobile?'10px 12px':'14px 16px'}}>
                                {editingId===board.id?(
                                    <Flex gap={4} onClick={e=>e.stopPropagation()}>
                                        <Input size="small" value={editTitle} onChange={e=>setEditTitle(e.target.value)}
                                               onPressEnter={async()=>{if(editTitle.trim())await renameBoard(board.id,editTitle.trim());setEditingId(null);}} autoFocus style={{borderRadius:6}}/>
                                        <Button size="small" type="primary" icon={<CheckOutlined/>}
                                                onClick={async()=>{if(editTitle.trim())await renameBoard(board.id,editTitle.trim());setEditingId(null);}}
                                                style={{background:GRADIENT,border:'none'}}/>
                                    </Flex>
                                ):(
                                    <Text strong style={{fontSize:mobile?13:15,display:'block',marginBottom:3}}>{board.title}</Text>
                                )}
                                {!mobile&&<Text type="secondary" style={{fontSize:11}}>{fmtDate(board.updated_at)}</Text>}
                                <Flex gap={2} style={{marginTop:8}} onClick={e=>e.stopPropagation()}>
                                    <Button type="text" size="small" icon={<EditOutlined/>} onClick={()=>{setEditingId(board.id);setEditTitle(board.title);}}/>
                                    <Popconfirm title="Удалить доску?" onConfirm={()=>deleteBoard(board.id)} okText="Удалить" cancelText="Отмена" okButtonProps={{danger:true}}>
                                        <Button type="text" size="small" icon={<DeleteOutlined/>} danger/>
                                    </Popconfirm>
                                </Flex>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export function BoardPage() {
    const {activeBoard,closeBoard}=useBoardStore();
    const mobile=isMob();
    if(activeBoard) return(
        <div style={{position:'fixed',top:0,left:mobile?0:'var(--sidebar-w,260px)',right:0,bottom:0,background:'#f8f9fc',zIndex:50,display:'flex',flexDirection:'column'}}>
            <div style={{height:44,background:'white',borderBottom:'1px solid #f0f0f0',display:'flex',alignItems:'center',padding:'0 12px',gap:10,boxShadow:'0 1px 4px rgba(0,0,0,0.06)',flexShrink:0,zIndex:10}}>
                <Button type="text" icon={<ArrowLeftOutlined/>} onClick={closeBoard} size="small">{!mobile&&'Доски'}</Button>
                <div style={{width:1,height:18,background:'#e8e8e8'}}/>
                <Text strong style={{fontSize:13}}>{activeBoard.title}</Text>
                {!mobile&&<Text type="secondary" style={{fontSize:11,marginLeft:'auto'}}>Delete — удалить · Shift — множественный выбор · Двойной клик — редактировать</Text>}
            </div>
            <div style={{flex:1,position:'relative',overflow:'hidden'}}>
                <ReactFlowProvider><BoardCanvas/></ReactFlowProvider>
            </div>
        </div>
    );
    return <BoardList/>;
}
