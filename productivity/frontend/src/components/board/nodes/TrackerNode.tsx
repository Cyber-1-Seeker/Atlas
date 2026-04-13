import {NodeResizer, type NodeProps} from '@xyflow/react';
import {Typography} from 'antd';
import {ArrowUpOutlined, ArrowDownOutlined} from '@ant-design/icons';
import {useProgressStore} from '../../../store/progress/progressStore.ts';
import {AllHandles} from './Handles.tsx';

const {Text} = Typography;
export interface TrackerNodeData { trackerId: string; }

export function TrackerNode({data, selected}: NodeProps) {
    const d = data as unknown as TrackerNodeData;
    const {trackers} = useProgressStore();
    const tracker = trackers.find(t => t.id === d.trackerId);

    if (!tracker) return (
        <div style={{width:180,padding:'12px 14px',background:'white',borderRadius:12,border:'2px dashed #d9d9d9'}}>
            <AllHandles/>
            <Text type="secondary" style={{fontSize:12}}>Трекер удалён</Text>
        </div>
    );

    const sorted = [...(tracker.records??[])].sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime());
    const latest = sorted[0], prev = sorted[1];
    const diff   = latest&&prev ? latest.value-prev.value : null;

    return (
        <>
            <NodeResizer minWidth={160} minHeight={90} isVisible={selected}
                lineStyle={{border:'1.5px solid #667eea'}}
                handleStyle={{width:8,height:8,background:'#667eea',border:'2px solid white',borderRadius:'50%'}}/>
            <AllHandles/>
            <div style={{
                width:'100%',height:'100%',padding:'14px 16px',background:'white',
                borderRadius:14,boxSizing:'border-box',overflow:'hidden',
                borderTop:`4px solid ${tracker.color}`,
                border:selected?`2px solid ${tracker.color}`:'1.5px solid #e8e8e8',
                borderTopWidth:4,
                boxShadow:selected?`0 0 0 3px ${tracker.color}33`:'0 4px 12px rgba(0,0,0,0.07)',
            }}>
                <Text style={{fontSize:11,fontWeight:700,color:'#8c8c8c',textTransform:'uppercase',letterSpacing:0.5,display:'block',marginBottom:6}}>
                    📈 {tracker.name}
                </Text>
                {latest ? (
                    <>
                        <div style={{display:'flex',alignItems:'baseline',gap:6}}>
                            <Text style={{fontSize:26,fontWeight:700,color:tracker.color,lineHeight:1}}>{latest.value}</Text>
                            <Text type="secondary" style={{fontSize:13}}>{tracker.unit}</Text>
                            {diff!==null&&(
                                <span style={{fontSize:11,fontWeight:600,marginLeft:'auto',color:diff>=0?'#52c41a':'#f5222d'}}>
                                    {diff>=0?<ArrowUpOutlined/>:<ArrowDownOutlined/>} {Math.abs(diff).toFixed(1)}
                                </span>
                            )}
                        </div>
                        <Text type="secondary" style={{fontSize:10,marginTop:4,display:'block'}}>{sorted.length} записей</Text>
                    </>
                ) : <Text type="secondary" style={{fontSize:12}}>Нет записей</Text>}
            </div>
        </>
    );
}
