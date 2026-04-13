import React from 'react';
import type { Direction, DirectionList } from '../types';
import { Code, Palette, Globe, Brain, Trophy, Star, Target, Cpu, Zap, Book, Music, Camera, Flame } from 'lucide-react';
import { useStore } from '../store/useStore';

interface Props {
  directions: DirectionList[];
  selected: string | null;
  // Pass full direction data so we can compute progress
  currentDirection: Direction | null;
  onSelect: (id: string) => void;
}

const ICON_MAP: Record<string, React.ReactNode> = {
  code:    <Code size={15} />, palette: <Palette size={15} />, globe:  <Globe size={15} />,
  brain:   <Brain size={15} />, trophy: <Trophy size={15} />, star:   <Star size={15} />,
  target:  <Target size={15} />, cpu:   <Cpu size={15} />,   bolt:   <Zap size={15} />,
  book:    <Book size={15} />,  music:  <Music size={15} />, camera: <Camera size={15} />,
  fire:    <Flame size={15} />,
};

export default function DirectionPicker({ directions, selected, currentDirection, onSelect }: Props) {
  const { completedNodes, completedTasks } = useStore();

  // Compute progress for the currently loaded direction
  const progress = React.useMemo(() => {
    if (!currentDirection) return null;
    let totalNodes = 0, doneNodes = 0, totalTasks = 0, doneTasks = 0;
    currentDirection.branches.forEach(b => {
      if (b.is_hardcore) return; // exclude hardcore from main progress
      b.checkpoints.forEach(cp => {
        totalNodes++;
        if (completedNodes.has(cp.id)) doneNodes++;
        cp.tasks.forEach(t => {
          totalTasks++;
          if (completedTasks[cp.id]?.has(t.id)) doneTasks++;
        });
      });
    });
    const pct = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    return { totalNodes, doneNodes, totalTasks, doneTasks, pct };
  }, [currentDirection, completedNodes, completedTasks]);

  return (
    <div style={{ display: 'flex', alignItems: 'stretch', overflowX: 'auto' }}>
      {directions.map(dir => {
        const isActive = dir.id === selected;
        const prog = isActive ? progress : null;

        return (
          <button key={dir.id} onClick={() => onSelect(dir.id)} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'flex-start',
            padding: '9px 16px 0', background: 'none', border: 'none',
            borderBottom: isActive ? `2px solid ${dir.color_hex}` : '2px solid transparent',
            color: isActive ? '#e8e8f0' : 'rgba(255,255,255,0.38)',
            cursor: 'pointer', whiteSpace: 'nowrap', minWidth: 0,
            fontFamily: "'Rajdhani',sans-serif",
            transition: 'color 0.15s',
            position: 'relative',
          }}
          onMouseEnter={e => !isActive && (e.currentTarget.style.color = 'rgba(255,255,255,0.65)')}
          onMouseLeave={e => !isActive && (e.currentTarget.style.color = 'rgba(255,255,255,0.38)')}
          >
            {/* Main row */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <span style={{ color: isActive ? dir.color_hex : 'inherit', display: 'flex', flexShrink: 0 }}>
                {ICON_MAP[dir.icon_type] || <Star size={15} />}
              </span>
              <span style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {dir.name}
              </span>
              {dir.branch_count > 0 && (
                <span style={{
                  fontSize: 8, fontWeight: 700, padding: '1px 5px', borderRadius: 8,
                  background: isActive ? `${dir.color_hex}25` : 'rgba(255,255,255,0.05)',
                  color: isActive ? dir.color_hex : 'rgba(255,255,255,0.25)',
                  letterSpacing: '0.05em',
                }}>{dir.branch_count}</span>
              )}
            </div>

            {/* Progress bar — only on active tab */}
            {isActive && prog !== null && (
              <div style={{ width: '100%', paddingBottom: 6 }}>
                {/* Numbers */}
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                  <span style={{ fontSize: 8, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.08em' }}>
                    {prog.doneNodes}/{prog.totalNodes} точек
                  </span>
                  <span style={{ fontSize: 8, fontWeight: 700, color: prog.pct === 100 ? '#f59e0b' : dir.color_hex }}>
                    {prog.pct}%
                  </span>
                </div>
                {/* Bar */}
                <div style={{ height: 2, background: 'rgba(255,255,255,0.06)', borderRadius: 1, width: '100%', minWidth: 80 }}>
                  <div style={{
                    height: '100%', borderRadius: 1,
                    width: `${prog.pct}%`,
                    background: prog.pct === 100
                      ? 'linear-gradient(90deg,#f59e0b,#fbbf24)'
                      : `linear-gradient(90deg,${dir.color_hex},${dir.color_hex}cc)`,
                    transition: 'width 0.6s ease',
                  }} />
                </div>
              </div>
            )}

            {/* Inactive tab — just thin line spacer */}
            {!isActive && <div style={{ height: 8 }} />}
          </button>
        );
      })}
    </div>
  );
}
