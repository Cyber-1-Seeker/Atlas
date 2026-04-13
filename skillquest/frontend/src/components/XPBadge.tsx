import React, { useState } from 'react';
import { getLevelInfo, LEVELS } from '../lib/levels';

interface Props { xp: number; }

export default function XPBadge({ xp }: Props) {
  const [showPopover, setShowPopover] = useState(false);
  const { current, next, progressXP, rangeXP, pct } = getLevelInfo(xp);

  return (
    <div style={{ position: 'relative' }}>
      {/* Badge */}
      <button
        onClick={() => setShowPopover(v => !v)}
        style={{
          display: 'flex', alignItems: 'center', gap: 0,
          background: 'rgba(0,0,0,0.4)',
          border: `1px solid ${current.color}44`,
          borderRadius: 8, overflow: 'hidden', cursor: 'pointer',
          boxShadow: `0 0 12px ${current.color}22`,
          transition: 'box-shadow 0.2s',
        }}
        onMouseEnter={e => e.currentTarget.style.boxShadow = `0 0 20px ${current.color}44`}
        onMouseLeave={e => e.currentTarget.style.boxShadow = `0 0 12px ${current.color}22`}
      >
        {/* Level block */}
        <div style={{
          padding: '5px 9px',
          background: `${current.color}22`,
          borderRight: `1px solid ${current.color}33`,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1,
        }}>
          <div style={{
            fontFamily: "'Cinzel',serif", fontSize: 9, fontWeight: 900,
            color: current.color, letterSpacing: '0.08em',
          }}>LV.{current.level}</div>
          <div style={{
            fontSize: 7, fontWeight: 600, letterSpacing: '0.12em',
            color: `${current.color}bb`, textTransform: 'uppercase',
            whiteSpace: 'nowrap',
          }}>{current.titleRu}</div>
        </div>

        {/* XP + bar block */}
        <div style={{ padding: '5px 10px', display: 'flex', flexDirection: 'column', gap: 2, minWidth: 72 }}>
          <div style={{
            fontFamily: "'Cinzel',serif", fontSize: 10, fontWeight: 700,
            color: '#fbbf24', letterSpacing: '0.04em',
          }}>
            {xp.toLocaleString('ru')} XP
          </div>
          {/* Progress bar */}
          <div style={{ height: 2.5, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
            <div style={{
              height: '100%', borderRadius: 2, transition: 'width 0.6s ease',
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${current.color}, ${current.color}cc)`,
            }} />
          </div>
          <div style={{ fontSize: 7, color: 'rgba(255,255,255,0.28)', letterSpacing: '0.06em' }}>
            {next ? `до ${next.titleRu}: ${(rangeXP - progressXP).toLocaleString('ru')} XP` : 'МАКСИМУМ'}
          </div>
        </div>
      </button>

      {/* Popover — full level table */}
      {showPopover && (
        <>
          <div onClick={() => setShowPopover(false)} style={{ position: 'fixed', inset: 0, zIndex: 8998 }} />
          <div style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0, zIndex: 8999,
            background: 'rgba(8,8,14,0.98)', border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 12, padding: '12px', minWidth: 220,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 16px 48px rgba(0,0,0,0.7)',
            fontFamily: "'Rajdhani',sans-serif",
          }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
              ТАБЛИЦА УРОВНЕЙ
            </div>
            {LEVELS.map(lvl => {
              const isCurrent = lvl.level === current.level;
              const isDone = xp >= lvl.minXP;
              return (
                <div key={lvl.level} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '5px 7px', borderRadius: 6, marginBottom: 2,
                  background: isCurrent ? `${lvl.color}14` : 'transparent',
                  border: isCurrent ? `1px solid ${lvl.color}33` : '1px solid transparent',
                }}>
                  {/* Dot */}
                  <div style={{
                    width: 7, height: 7, borderRadius: '50%', flexShrink: 0,
                    background: isDone ? lvl.color : 'rgba(255,255,255,0.1)',
                    boxShadow: isDone ? `0 0 6px ${lvl.color}` : 'none',
                  }} />
                  {/* Lv */}
                  <div style={{
                    fontFamily: "'Cinzel',serif", fontSize: 9, fontWeight: 700,
                    color: isDone ? lvl.color : 'rgba(255,255,255,0.2)',
                    minWidth: 28,
                  }}>Lv.{lvl.level}</div>
                  {/* Title */}
                  <div style={{ flex: 1, fontSize: 11, fontWeight: 600, color: isDone ? '#e0e0f0' : 'rgba(255,255,255,0.25)' }}>
                    {lvl.titleRu}
                  </div>
                  {/* XP */}
                  <div style={{ fontSize: 9, color: isDone ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.15)', letterSpacing: '0.04em' }}>
                    {lvl.minXP.toLocaleString('ru')}
                  </div>
                  {isCurrent && (
                    <div style={{ fontSize: 8, fontWeight: 700, color: lvl.color, letterSpacing: '0.1em' }}>◀</div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
