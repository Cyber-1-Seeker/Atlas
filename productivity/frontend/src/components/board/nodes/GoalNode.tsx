import {NodeResizer, type NodeProps} from '@xyflow/react';
import {Progress, Typography} from 'antd';
import {Trophy} from 'lucide-react';
import {useGoalStore, calculateGoalProgress} from '../../../store/twelveWeeks/goalStore.ts';
import {useTaskStore} from '../../../store/twelveWeeks/taskStore.ts';
import {AllHandles} from './Handles.tsx';

const {Text} = Typography;
const GRADIENT = {'0%':'#667eea','100%':'#764ba2'};

export interface GoalNodeData { goalId: string; }

export function GoalNode({data, selected}: NodeProps) {
    const d = data as unknown as GoalNodeData;
    const {goals} = useGoalStore();
    const {tasks} = useTaskStore();
    const goal    = goals.find(g => g.id === d.goalId);
    const progress = goal ? calculateGoalProgress(goal.id, tasks) : 0;

    if (!goal) return (
        <div style={{width:200,padding:'12px 14px',background:'white',borderRadius:12,border:'2px dashed #d9d9d9'}}>
            <AllHandles/>
            <Text type="secondary" style={{fontSize:12}}>Цель удалена</Text>
        </div>
    );

    return (
        <>
            <NodeResizer minWidth={180} minHeight={100} isVisible={selected}
                lineStyle={{border:'1.5px solid #667eea'}}
                handleStyle={{width:8,height:8,background:'#667eea',border:'2px solid white',borderRadius:'50%'}}/>
            <AllHandles/>
            <div style={{
                width:'100%',height:'100%',padding:'14px 16px',background:'white',
                borderRadius:14,boxSizing:'border-box',overflow:'hidden',
                border:selected?'2px solid #667eea':'1.5px solid #e8e8e8',
                boxShadow:selected?'0 0 0 3px rgba(102,126,234,0.2)':'0 4px 12px rgba(0,0,0,0.07)',
            }}>
                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
                    <Trophy size={14} color="#667eea" strokeWidth={2}/>
                    <Text style={{fontSize:11,color:'#667eea',fontWeight:700,textTransform:'uppercase',letterSpacing:0.5}}>ЦЕЛЬ</Text>
                    {goal.done&&<span style={{fontSize:11,color:'#52c41a',marginLeft:'auto'}}>✓</span>}
                </div>
                <Text style={{fontSize:13,fontWeight:600,display:'block',marginBottom:10,
                    textDecoration:goal.done?'line-through':'none',color:goal.done?'#8c8c8c':'#1a1a1a',lineHeight:1.4}}>
                    {goal.text}
                </Text>
                <Progress percent={progress} strokeColor={GRADIENT} strokeWidth={5} style={{margin:0}}/>
                <Text type="secondary" style={{fontSize:10,marginTop:3,display:'block'}}>{progress}% выполнено</Text>
            </div>
        </>
    );
}
