import {useState} from 'react';
import {NodeResizer, type NodeProps} from '@xyflow/react';
import {AllHandles} from './Handles.tsx';

const COLORS = ['#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#f9fafb'];

export interface StickyData {
    text: string;
    color: string;
}

export function StickyNode({data, selected}: NodeProps) {
    const d = data as unknown as StickyData;
    const [editing, setEditing] = useState(false);
    const [text, setText] = useState(d.text ?? '');
    const [color, setColor] = useState(d.color ?? '#fef08a');
    // const handleBlur = useCallback(() => {
    //     setEditing(false);
    //     d.text = text;
    // }, [text, d]);

    return (
        <>
            <NodeResizer
                minWidth={120} minHeight={100}
                isVisible={selected}
                lineStyle={{border: '1.5px solid #667eea'}}
                handleStyle={{
                    width: 8,
                    height: 8,
                    background: '#667eea',
                    border: '2px solid white',
                    borderRadius: '50%'
                }}
            />
            <AllHandles/>

            <div className="board-node-hover" style={{
                width: '100%', height: '100%',
                background: color,
                borderRadius: 6,
                boxShadow: selected
                    ? '0 0 0 2px #667eea, 0 8px 24px rgba(0,0,0,0.18)'
                    : '0 4px 12px rgba(0,0,0,0.12)',
                padding: '12px 10px 8px',
                display: 'flex', flexDirection: 'column',
                cursor: 'default', boxSizing: 'border-box',
            }}>
                {editing ? (
                    <textarea
                        autoFocus
                        value={text}
                        onChange={e => setText(e.target.value)}
                        onBlur={() => {
                            setEditing(false);
                            // updateNodeData?.({ ...d, text });
                        }}
                        style={{
                            flex: 1, background: 'transparent', border: 'none', outline: 'none',
                            resize: 'none', fontSize: 13, lineHeight: 1.5,
                            fontFamily: 'inherit', color: '#1a1a1a',
                        }}
                    />
                ) : (
                    <div
                        onDoubleClick={() => setEditing(true)}
                        style={{
                            flex: 1, fontSize: 13, lineHeight: 1.5, color: '#1a1a1a',
                            whiteSpace: 'pre-wrap', minHeight: 60, cursor: 'text',
                            wordBreak: 'break-word',
                        }}
                    >
                        {text || <span style={{color: '#999', fontStyle: 'italic'}}>Двойной клик...</span>}
                    </div>
                )}
                <div style={{display: 'flex', gap: 4, marginTop: 8, justifyContent: 'center'}}>
                    {COLORS.map(c => (
                        <div key={c} onClick={() => {
                            setColor(c);
                            d.color = c;
                        }} style={{
                            width: 14, height: 14, borderRadius: '50%', background: c, cursor: 'pointer', flexShrink: 0,
                            border: c === color ? '2px solid #666' : '1px solid rgba(0,0,0,0.15)',
                        }}/>
                    ))}
                </div>
            </div>
        </>
    );
}
