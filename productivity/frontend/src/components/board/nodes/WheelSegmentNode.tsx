import {NodeResizer, type NodeProps} from '@xyflow/react';
import {Typography} from 'antd';
import {useWheelStore} from '../../../store/lifeWheel/lifeWheelStore.ts';
import {AllHandles} from './Handles.tsx';

const {Text} = Typography;
export interface WheelSegmentNodeData { segmentId: string; }

export function WheelSegmentNode({data, selected}: NodeProps) {
    const d = data as unknown as WheelSegmentNodeData;
    const {segments} = useWheelStore();
    const seg = segments.find(s => s.id === d.segmentId);

    if (!seg) return (
        <div style={{width:160,padding:'12px 14px',background:'white',borderRadius:12,border:'2px dashed #d9d9d9'}}>
            <AllHandles/>
            <Text type="secondary" style={{fontSize:12}}>Сегмент удалён</Text>
        </div>
    );

    const pct = (seg.score/10)*100;
    const doneTasks = seg.tasks.filter(t=>t.done).length;

    return (
        <>
            <NodeResizer minWidth={160} minHeight={90} isVisible={selected}
                lineStyle={{border:'1.5px solid #667eea'}}
                handleStyle={{width:8,height:8,background:'#667eea',border:'2px solid white',borderRadius:'50%'}}/>
            <AllHandles/>
            <div style={{
                width:'100%',height:'100%',padding:'14px 16px',background:'white',
                borderRadius:14,boxSizing:'border-box',overflow:'hidden',
                border:selected?`2px solid ${seg.color}`:'1.5px solid #e8e8e8',
                boxShadow:selected?`0 0 0 3px ${seg.color}33`:'0 4px 12px rgba(0,0,0,0.07)',
            }}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                    <div style={{width:12,height:12,borderRadius:'50%',background:seg.color,flexShrink:0}}/>
                    <Text strong style={{fontSize:13}}>{seg.name}</Text>
                    <Text style={{fontSize:18,fontWeight:700,color:seg.color,marginLeft:'auto'}}>{seg.score}</Text>
                </div>
                <div style={{height:6,background:'#f0f0f0',borderRadius:3,overflow:'hidden',marginBottom:6}}>
                    <div style={{width:`${pct}%`,height:'100%',background:seg.color,borderRadius:3,transition:'width 0.3s'}}/>
                </div>
                <Text type="secondary" style={{fontSize:10}}>{doneTasks}/{seg.tasks.length} задач · {seg.score}/10</Text>
            </div>
        </>
    );
}
