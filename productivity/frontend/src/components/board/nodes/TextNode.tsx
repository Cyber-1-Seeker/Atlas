import {useState} from 'react';
import {NodeResizer, type NodeProps} from '@xyflow/react';
import {AllHandles} from './Handles.tsx';

export interface TextData {
    text: string;
    fontSize: number;
    bold: boolean;
    color: string;
}

export function TextNode({data, selected}: NodeProps) {
    const d = data as unknown as TextData;
    const [text, setText] = useState(d.text ?? '');
    const fontSize = d.fontSize ?? 14;
    const [editing, setEditing] = useState(false);

    return (
        <>
            <NodeResizer
                minWidth={80} minHeight={30}
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
                padding: '6px 10px', boxSizing: 'border-box',
                border: selected ? '1.5px solid #667eea' : '1.5px solid transparent',
                borderRadius: 6, background: selected ? '#f5f3ff' : 'transparent',
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
                            width: '100%', height: '100%', border: 'none', outline: 'none',
                            background: 'transparent', resize: 'none',
                            fontSize, fontWeight: d.bold ? 700 : 400,
                            color: d.color ?? '#1a1a1a', fontFamily: 'inherit',
                        }}
                    />
                ) : (
                    <span
                        onDoubleClick={() => setEditing(true)}
                        style={{
                            fontSize, fontWeight: d.bold ? 700 : 400,
                            color: d.color ?? '#1a1a1a', cursor: 'text',
                            whiteSpace: 'pre-wrap', display: 'block',
                            width: '100%', height: '100%',
                        }}
                    >
                        {text || <span
                            style={{color: '#bbb', fontStyle: 'italic', fontWeight: 400, fontSize: 13}}>Текст...</span>}
                    </span>
                )}
            </div>
        </>
    );
}
