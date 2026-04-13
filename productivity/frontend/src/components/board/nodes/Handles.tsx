/**
 * AllHandles — все 4 стороны, каждая работает и как source и как target.
 * Это позволяет тянуть линию с любой стороны и присоединять к любой стороне.
 */
import {Handle, Position} from '@xyflow/react';

const style = {
    width: 10, height: 10,
    background: '#667eea',
    border: '2px solid white',
    borderRadius: '50%',
    opacity: 0,
    transition: 'opacity 0.15s',
};

export function AllHandles() {
    return (
        <>
            {[Position.Top, Position.Right, Position.Bottom, Position.Left].map(pos => (
                <>
                    <Handle
                        key={`s-${pos}`}
                        type="source"
                        position={pos}
                        id={`s-${pos}`}
                        style={style}
                        className="node-handle"
                    />
                    <Handle
                        key={`t-${pos}`}
                        type="target"
                        position={pos}
                        id={`t-${pos}`}
                        style={{...style, opacity: 0}}
                        className="node-handle"
                    />
                </>
            ))}
        </>
    );
}
