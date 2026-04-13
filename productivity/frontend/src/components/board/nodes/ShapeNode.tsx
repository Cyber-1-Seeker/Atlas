/**
 * ShapeNode — прямоугольник, круг, настоящий ромб через SVG polygon.
 */
import {useState} from 'react';
import {NodeResizer, type NodeProps} from '@xyflow/react';
import {AllHandles} from './Handles.tsx';

export interface ShapeData {
    shape: 'rect' | 'circle' | 'diamond';
    color: string;
    label: string;
    w: number;
    h: number;
}

export function ShapeNode({data, selected}: NodeProps) {
    const d = data as unknown as ShapeData;
    const color = d.color ?? '#667eea';
    const [editing, setEditing] = useState(false);
    const [label, setLabel] = useState(d.label ?? '');
    const labelEl = editing ? (
        <input
            autoFocus
            value={label}
            onChange={e => setLabel(e.target.value)}
            onBlur={() => {
                setEditing(false);
                // optional: вызвать колбэк для обновления NodeData
                // updateNodeData(d.id, { ...d, label });
            }}
            onKeyDown={e => e.key === 'Enter' && setEditing(false)}
            style={{
                border: 'none', outline: 'none', background: 'transparent',
                textAlign: 'center', fontSize: 12, fontWeight: 600,
                color, width: '80%',
            }}
        />
    ) : (
        <span
            onDoubleClick={() => setEditing(true)}
            style={{
                fontSize: 12,
                fontWeight: 600,
                color,
                cursor: 'text',
                textAlign: 'center',
                padding: '0 8px',
                wordBreak: 'break-word'
            }}
        >
            {label || ''}
        </span>
    );

    return (
        <>
            <NodeResizer
                minWidth={60} minHeight={50}
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

            <div style={{
                width: '100%', height: '100%', position: 'relative',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
                {d.shape === 'diamond' ? (
                    /* Настоящий ромб через SVG */
                    <svg
                        width="100%" height="100%"
                        style={{position: 'absolute', top: 0, left: 0, overflow: 'visible'}}
                    >
                        <polygon
                            points="50%,2% 98%,50% 50%,98% 2%,50%"
                            fill={`${color}22`}
                            stroke={selected ? '#667eea' : color}
                            strokeWidth={selected ? 2.5 : 2}
                        />
                    </svg>
                ) : d.shape === 'circle' ? (
                    <div style={{
                        position: 'absolute', inset: 0,
                        borderRadius: '50%',
                        background: `${color}22`,
                        border: `${selected ? 2.5 : 2}px solid ${selected ? '#667eea' : color}`,
                        boxShadow: selected ? `0 0 0 2px #667eea33` : 'none',
                    }}/>
                ) : (
                    /* Прямоугольник */
                    <div style={{
                        position: 'absolute', inset: 0,
                        borderRadius: 8,
                        background: `${color}22`,
                        border: `${selected ? 2.5 : 2}px solid ${selected ? '#667eea' : color}`,
                        boxShadow: selected ? `0 0 0 2px #667eea33` : 'none',
                    }}/>
                )}

                {/* Подпись поверх фигуры */}
                <div style={{
                    position: 'relative', zIndex: 1,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    width: '70%',
                }}>
                    {labelEl}
                </div>
            </div>
        </>
    );
}
