import React, { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { getLevelInfo } from '../lib/levels';

export interface Toast {
  id: string;
  type: 'achievement' | 'levelup' | 'xp';
  icon?: string;
  title: string;
  subtitle?: string;
  xp?: number;
  color?: string;
}

// Global toast emitter — call from anywhere
type Listener = (toast: Toast) => void;
const listeners: Listener[] = [];
export function emitToast(toast: Omit<Toast, 'id'>) {
  const t: Toast = { ...toast, id: Math.random().toString(36).slice(2) };
  listeners.forEach(l => l(t));
}

export default function ToastSystem() {
  const [toasts, setToasts] = React.useState<Toast[]>([]);
  const timerMap = useRef<Record<string, ReturnType<typeof setTimeout>>>({});
  const totalXP = useStore(s => s.totalXP);
  const prevXP = useRef(totalXP);

  // Register listener
  useEffect(() => {
    const handler: Listener = (t) => {
      setToasts(prev => [...prev.slice(-3), t]); // max 4 at once
      timerMap.current[t.id] = setTimeout(() => {
        setToasts(prev => prev.filter(x => x.id !== t.id));
      }, t.type === 'levelup' ? 5000 : 3500);
    };
    listeners.push(handler);
    return () => {
      const idx = listeners.indexOf(handler);
      if (idx >= 0) listeners.splice(idx, 1);
    };
  }, []);

  // Detect level-up
  useEffect(() => {
    const prev = prevXP.current;
    if (totalXP <= prev) { prevXP.current = totalXP; return; }
    const prevInfo = getLevelInfo(prev);
    const nextInfo = getLevelInfo(totalXP);
    if (nextInfo.current.level > prevInfo.current.level) {
      emitToast({
        type: 'levelup',
        icon: '⬆',
        title: `Уровень ${nextInfo.current.level}`,
        subtitle: nextInfo.current.titleRu,
        color: nextInfo.current.color,
      });
    }
    prevXP.current = totalXP;
  }, [totalXP]);

  const dismiss = (id: string) => {
    clearTimeout(timerMap.current[id]);
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9990,
      display: 'flex', flexDirection: 'column', gap: 10,
      fontFamily: "'Rajdhani', sans-serif",
    }}>
      {toasts.map(toast => (
        <ToastCard key={toast.id} toast={toast} onDismiss={() => dismiss(toast.id)} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onDismiss }: { toast: Toast; onDismiss: () => void }) {
  const isLevelUp = toast.type === 'levelup';
  const isAch = toast.type === 'achievement';
  const accent = toast.color ?? (isLevelUp ? '#f59e0b' : isAch ? '#f59e0b' : '#7c3aed');

  return (
    <div
      onClick={onDismiss}
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: 'rgba(8,8,14,0.97)',
        border: `1px solid ${accent}55`,
        borderRadius: 12,
        backdropFilter: 'blur(20px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.6), 0 0 0 1px ${accent}22`,
        cursor: 'pointer',
        minWidth: 260, maxWidth: 340,
        animation: 'toastIn 0.35s cubic-bezier(0.34,1.56,0.64,1) forwards',
        position: 'relative', overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes toastIn {
          from { transform: translateX(110%); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>

      {/* Glow strip */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0, width: 3,
        background: `linear-gradient(180deg, ${accent}, ${accent}66)`,
        borderRadius: '12px 0 0 12px',
      }} />

      {/* Icon */}
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: `${accent}18`,
        border: `1px solid ${accent}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: isLevelUp ? 20 : 22,
        boxShadow: `0 0 16px ${accent}33`,
      }}>
        {toast.icon ?? (isLevelUp ? '⬆' : '🏆')}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/* Badge */}
        <div style={{
          fontSize: 8, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase',
          color: `${accent}cc`, marginBottom: 2,
        }}>
          {isLevelUp ? '✦ ПОВЫШЕНИЕ УРОВНЯ' : isAch ? '✦ ДОСТИЖЕНИЕ' : '✦ ОПЫТ'}
        </div>
        <div style={{
          fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700,
          letterSpacing: '0.06em', textTransform: 'uppercase',
          color: '#f0f0ff',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {toast.title}
        </div>
        {toast.subtitle && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', marginTop: 2, letterSpacing: '0.04em' }}>
            {toast.subtitle}
          </div>
        )}
        {toast.xp !== undefined && (
          <div style={{ fontSize: 11, fontWeight: 700, color: accent, marginTop: 2 }}>
            +{toast.xp} XP
          </div>
        )}
      </div>

      {/* Level-up shimmer */}
      {isLevelUp && (
        <div style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          background: `linear-gradient(105deg, transparent 40%, ${accent}18 50%, transparent 60%)`,
          animation: 'shimmer 1.5s ease-in-out infinite',
        }}>
          <style>{`@keyframes shimmer { 0%,100%{opacity:0} 50%{opacity:1} }`}</style>
        </div>
      )}
    </div>
  );
}
