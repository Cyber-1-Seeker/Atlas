import React, { useEffect, useRef } from 'react';
import { Edit2, Type, Flag, Trash2, GitMerge } from 'lucide-react';

export interface ContextMenuItem {
  icon: React.ReactNode;
  label: string;
  action: () => void;
  danger?: boolean;
  divider?: boolean;
}

interface Props {
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}

export default function ContextMenu({ x, y, items, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click or Escape
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust so menu doesn't go off-screen
  const menuW = 190, menuH = items.length * 34 + 16;
  const adjX = x + menuW > window.innerWidth  ? x - menuW : x;
  const adjY = y + menuH > window.innerHeight ? y - menuH : y;

  return (
    <div ref={ref} style={{
      position: 'fixed', left: adjX, top: adjY, zIndex: 9000,
      background: 'rgba(10,10,18,0.97)', backdropFilter: 'blur(16px)',
      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9,
      padding: '6px', minWidth: menuW,
      boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
      fontFamily: "'Rajdhani',sans-serif",
    }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {item.divider && i > 0 && (
            <div style={{ height: 1, background: 'rgba(255,255,255,0.07)', margin: '4px 0' }} />
          )}
          <button
            onClick={() => { item.action(); onClose(); }}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 9,
              padding: '7px 10px', borderRadius: 6, border: 'none', background: 'transparent',
              color: item.danger ? '#ff6060' : 'rgba(255,255,255,0.8)',
              fontSize: 12, fontWeight: 600, letterSpacing: '0.05em',
              cursor: 'pointer', textAlign: 'left',
              transition: 'background 0.1s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = item.danger ? 'rgba(255,60,60,0.12)' : 'rgba(255,255,255,0.07)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <span style={{ color: item.danger ? '#ff6060' : 'rgba(255,255,255,0.45)', display: 'flex', flexShrink: 0 }}>
              {item.icon}
            </span>
            {item.label}
          </button>
        </React.Fragment>
      ))}
    </div>
  );
}
