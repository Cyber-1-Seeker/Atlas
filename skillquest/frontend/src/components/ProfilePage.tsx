import React from 'react';
import { useStore } from '../store/useStore';
import { getLevelInfo, LEVELS } from '../lib/levels';
import { getStreak } from '../lib/streak';
import { X, CheckSquare, Zap, Star, GitBranch } from 'lucide-react';

interface Props { onClose: () => void; onLogout?: () => void; }

export default function ProfilePage({ onClose, onLogout }: Props) {
  const { totalXP, completedNodes, completedTasks, directions, user, isLoggedIn } = useStore();
  const { current, next, pct, progressXP, rangeXP } = getLevelInfo(totalXP);

  const totalTasksDone = Object.values(completedTasks).reduce((a, s) => a + s.size, 0);
  const totalNodesDone = completedNodes.size;

  // Streak: server wins when logged in
  const streak = isLoggedIn && user ? user.streak : getStreak().streak;

  const statCards = [
    { icon: <Zap size={16} />,        value: totalXP.toLocaleString('ru'), label: 'Всего XP',          color: '#f59e0b' },
    { icon: <CheckSquare size={16} />, value: totalTasksDone,               label: 'Заданий выполнено', color: '#10b981' },
    { icon: <Star size={16} />,        value: totalNodesDone,               label: 'Точек пройдено',    color: '#7c3aed' },
    { icon: <GitBranch size={16} />,   value: directions.length,            label: 'Направлений',       color: '#06b6d4' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani',sans-serif", padding: 20,
    }}>
      <div style={{
        background: '#08080f', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18, width: '100%', maxWidth: 520, maxHeight: '90vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: `0 40px 80px rgba(0,0,0,0.85), 0 0 0 1px ${current.color}22`,
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 22px 0',
          background: `linear-gradient(135deg, ${current.color}18, transparent)`,
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              {/* Avatar */}
              <div style={{
                width: 58, height: 58, borderRadius: 16, flexShrink: 0,
                background: `linear-gradient(135deg, ${current.color}44, ${current.color}22)`,
                border: `2px solid ${current.color}66`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, boxShadow: `0 0 24px ${current.color}44`,
              }}>{isLoggedIn && user ? user.avatar_emoji : '👤'}</div>
              <div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 17, fontWeight: 900, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#f4f4ff' }}>
                  {isLoggedIn && user ? (user.display_name || user.username) : 'Гость'}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 5 }}>
                  <div style={{
                    padding: '2px 9px', borderRadius: 12,
                    background: `${current.color}28`, border: `1px solid ${current.color}55`,
                    fontSize: 10, fontWeight: 700, color: current.color, letterSpacing: '0.1em',
                  }}>LV.{current.level} · {current.titleRu.toUpperCase()}</div>
                  {streak > 0 && (
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 4,
                      padding: '2px 9px', borderRadius: 12,
                      background: 'rgba(251,146,60,0.15)', border: '1px solid rgba(251,146,60,0.35)',
                      fontSize: 10, fontWeight: 700, color: '#fb923c',
                    }}>🔥 {streak} дн.</div>
                  )}
                  {isLoggedIn && (
                    <div style={{
                      padding: '2px 8px', borderRadius: 12,
                      background: 'rgba(16,185,129,0.14)', border: '1px solid rgba(16,185,129,0.3)',
                      fontSize: 9, fontWeight: 700, color: '#10b981', letterSpacing: '0.08em',
                    }}>☁ СИНК</div>
                  )}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isLoggedIn && onLogout && (
                <button onClick={onLogout} style={{
                  padding: '4px 10px', borderRadius: 6,
                  border: '1px solid rgba(255,80,80,0.25)', background: 'rgba(255,60,60,0.08)',
                  color: 'rgba(255,100,100,0.7)', fontSize: 10, fontWeight: 600,
                  letterSpacing: '0.1em', cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif",
                  textTransform: 'uppercase',
                }}>Выйти</button>
              )}
              <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
                <X size={18} />
              </button>
            </div>
          </div>

          {/* XP bar */}
          <div style={{ paddingBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>{totalXP.toLocaleString('ru')} XP</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{next ? `${next.titleRu} · ${next.minXP.toLocaleString('ru')}` : 'МАКСИМУМ'}</span>
            </div>
            <div style={{ height: 7, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 4, transition: 'width 1s ease',
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${current.color}, ${current.color}cc)`,
                boxShadow: `0 0 10px ${current.color}88`,
              }} />
            </div>
            {next && (
              <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.22)', marginTop: 4, textAlign: 'right', letterSpacing: '0.05em' }}>
                до {next.titleRu}: {(rangeXP - progressXP).toLocaleString('ru')} XP
              </div>
            )}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>
          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 9, marginBottom: 22 }}>
            {statCards.map(s => (
              <div key={s.label} style={{
                background: `${s.color}0e`, border: `1px solid ${s.color}22`,
                borderRadius: 11, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                  background: `${s.color}20`, border: `1px solid ${s.color}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', color: s.color,
                }}>{s.icon}</div>
                <div>
                  <div style={{ fontFamily: "'Cinzel',serif", fontSize: 19, fontWeight: 700, color: '#f4f4ff', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.38)', marginTop: 2, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Level path */}
          <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
            ПУТЬ УРОВНЕЙ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {LEVELS.map(lvl => {
              const reached = totalXP >= lvl.minXP;
              const isCur = lvl.level === current.level;
              return (
                <div key={lvl.level} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 9,
                  background: isCur ? `${lvl.color}14` : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${isCur ? lvl.color + '38' : 'rgba(255,255,255,0.05)'}`,
                  boxShadow: isCur ? `0 0 12px ${lvl.color}18` : 'none',
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                    background: reached ? `${lvl.color}28` : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${reached ? lvl.color + '60' : 'rgba(255,255,255,0.08)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontFamily: "'Cinzel',serif", fontSize: 9, fontWeight: 700,
                    color: reached ? lvl.color : 'rgba(255,255,255,0.2)',
                    boxShadow: reached && isCur ? `0 0 8px ${lvl.color}55` : 'none',
                  }}>{lvl.level}</div>
                  <div style={{ flex: 1 }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: reached ? '#e4e4f4' : 'rgba(255,255,255,0.22)', letterSpacing: '0.03em' }}>{lvl.titleRu}</span>
                    <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginLeft: 6 }}>{lvl.title}</span>
                  </div>
                  <span style={{ fontSize: 9, color: reached ? 'rgba(255,255,255,0.42)' : 'rgba(255,255,255,0.15)', letterSpacing: '0.04em' }}>{lvl.minXP.toLocaleString('ru')} XP</span>
                  {isCur && <span style={{ fontSize: 9, fontWeight: 700, color: lvl.color, letterSpacing: '0.1em' }}>◀ ТЫ</span>}
                  {reached && !isCur && <span style={{ fontSize: 11, color: '#10b981' }}>✓</span>}
                </div>
              );
            })}
          </div>

          {/* Directions */}
          {directions.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>НАПРАВЛЕНИЯ</div>
              {directions.map(d => (
                <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.055)', marginBottom: 5 }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: d.color_hex, boxShadow: `0 0 6px ${d.color_hex}`, flexShrink: 0 }} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#d4d4ec', flex: 1 }}>{d.name}</span>
                  <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.28)' }}>{d.branch_count} веток</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
