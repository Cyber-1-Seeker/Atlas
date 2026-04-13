import React, { useMemo, useRef, useState, useCallback, useEffect } from 'react';
import type { Branch, Checkpoint } from '../types';
import { useStore } from '../store/useStore';
import { checkpointsApi, tasksApi } from '../api/client';
import CheckpointEditor from './CheckpointEditor';
import { emitToast } from './ToastSystem';
import ContextMenu, { type ContextMenuItem } from './ContextMenu';
import { Edit2, Type, Trash2, Flag, GitMerge } from 'lucide-react';

interface Props { branch: Branch; onChanged: () => void; }

const NW = 120, NH = 68, CPW = 144, CPH = 86;

function nodeSize(cp: Checkpoint) {
  return cp.achievement_name ? { w: CPW, h: CPH } : { w: NW, h: NH };
}

const ICON_PATHS: Record<string, string> = {
  code:   'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
  palette:'M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485',
  globe:  'M12 2a10 10 0 100 20A10 10 0 0012 2zm0 0c-2.5 3-4 6.5-4 10s1.5 7 4 10m0-20c2.5 3 4 6.5 4 10s-1.5 7-4 10M2 12h20',
  brain:  'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z',
  trophy: 'M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z',
  star:   'M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z',
  target: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
  cpu:    'M9 3H5a2 2 0 00-2 2v4m6-6h10a2 2 0 012 2v4M9 3v10m0 0h10m-10 0a2 2 0 01-2 2H5a2 2 0 01-2-2m2 0v4a2 2 0 002 2h2m0 0h4m0 0v-4a2 2 0 012-2h2a2 2 0 012 2v4a2 2 0 01-2 2h-2',
  bolt:   'M13 10V3L4 14h7v7l9-11h-7z',
  book:   'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
  fire:   'M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z',
  music:  'M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3',
};

function TitleEditor({ value, w, onSave }: { value: string; w: number; onSave: (v: string) => void }) {
  const [v, setV] = useState(value);
  return (
    <foreignObject x={-w / 2 + 8} y={-13} width={w - 16} height={26}>
      <input autoFocus value={v}
        onChange={e => setV(e.target.value)}
        onBlur={() => onSave(v)}
        onKeyDown={e => { if (e.key === 'Enter') onSave(v); e.stopPropagation(); }}
        style={{ width: '100%', height: '100%', background: 'rgba(0,0,0,0.9)', border: '1px solid rgba(124,58,237,0.7)', borderRadius: 4, color: '#e0e0f0', fontSize: 11, textAlign: 'center', outline: 'none', fontFamily: "'Cinzel',serif" }}
        onClick={e => e.stopPropagation()} />
    </foreignObject>
  );
}

export default function SkillTree({ branch, onChanged }: Props) {
  const { completedNodes, completedTasks, selectNode, selectedNodeId, hardcoreMode, completeNode } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);

  // Atomic viewport
  const vp = useRef({ tx: 80, ty: 80, scale: 1 });
  const [vpState, setVpState] = useState({ tx: 80, ty: 80, scale: 1 });
  const setVp = useCallback((fn: (p: typeof vp.current) => typeof vp.current) => {
    const next = fn(vp.current);
    vp.current = next;
    setVpState({ ...next });
  }, []);

  const [editMode, setEditMode] = useState(false);
  const [panMode, setPanMode] = useState(false);
  const [localPos, setLocalPos] = useState<Record<string, { x: number; y: number }>>({});
  const [editingTitle, setEditingTitle] = useState<string | null>(null);
  const [editingCp, setEditingCp] = useState<Checkpoint | null>(null);
  const [edgeDraft, setEdgeDraft] = useState<{ fromId: string; curX: number; curY: number } | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; cp: Checkpoint } | null>(null);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [particles, setParticles] = useState<{ id: string; x: number; y: number; color: string }[]>([]);

  type DS =
    | { kind: 'pan'; lx: number; ly: number }
    | { kind: 'node'; id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean }
    | { kind: 'edge'; fromId: string };
  const drag = useRef<DS | null>(null);

  useEffect(() => {
    vp.current = { tx: 80, ty: 80, scale: 1 };
    setVpState({ tx: 80, ty: 80, scale: 1 });
    setLocalPos({}); setEditingTitle(null);
    drag.current = null; setEdgeDraft(null); setCtxMenu(null);
  }, [branch.id]);

  // Space / H → pan while held
  useEffect(() => {
    const dn = (e: KeyboardEvent) => {
      if ((e.key === 'h' || e.key === 'H' || e.key === ' ')
        && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement))
        setPanMode(true);
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'h' || e.key === 'H' || e.key === ' ') setPanMode(false);
    };
    window.addEventListener('keydown', dn); window.addEventListener('keyup', up);
    return () => { window.removeEventListener('keydown', dn); window.removeEventListener('keyup', up); };
  }, []);

  // Atomic wheel zoom toward cursor
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const handler = (e: WheelEvent) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = e.clientX - rect.left, my = e.clientY - rect.top;
      const f = e.deltaY < 0 ? 1.12 : 0.9;
      setVp(p => {
        const ns = Math.max(0.15, Math.min(4, p.scale * f));
        const r = ns / p.scale;
        return { scale: ns, tx: mx - r * (mx - p.tx), ty: my - r * (my - p.ty) };
      });
    };
    el.addEventListener('wheel', handler, { passive: false });
    return () => el.removeEventListener('wheel', handler);
  }, [setVp]);

  const toScene = useCallback((sx: number, sy: number) => {
    const rect = containerRef.current!.getBoundingClientRect();
    const { tx, ty, scale } = vp.current;
    return { x: (sx - rect.left - tx) / scale, y: (sy - rect.top - ty) / scale };
  }, []);

  // Fit all nodes into view
  const fitToScreen = useCallback(() => {
    const el = containerRef.current; if (!el || branch.checkpoints.length === 0) return;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    branch.checkpoints.forEach(cp => {
      const pos = localPos[cp.id] ?? { x: cp.pos_x, y: cp.pos_y };
      const { w, h } = nodeSize(cp);
      minX = Math.min(minX, pos.x); minY = Math.min(minY, pos.y);
      maxX = Math.max(maxX, pos.x + w); maxY = Math.max(maxY, pos.y + h);
    });
    const pad = 80, cW = el.clientWidth, cH = el.clientHeight;
    const scX = (cW - pad * 2) / (maxX - minX || 1);
    const scY = (cH - pad * 2) / (maxY - minY || 1);
    const ns = Math.max(0.2, Math.min(2, Math.min(scX, scY)));
    setVp(() => ({
      scale: ns,
      tx: cW / 2 - ((minX + maxX) / 2) * ns,
      ty: cH / 2 - ((minY + maxY) / 2) * ns,
    }));
  }, [branch.checkpoints, localPos, setVp]);

  const getPos = useCallback((cp: Checkpoint) =>
    localPos[cp.id] ?? { x: cp.pos_x, y: cp.pos_y }, [localPos]);

  const checkpoints = branch.checkpoints;
  const cpMap = useMemo(() => {
    const m: Record<string, Checkpoint> = {};
    checkpoints.forEach(cp => { m[cp.id] = cp; });
    return m;
  }, [checkpoints]);

  const getState = useCallback((cp: Checkpoint): 'completed' | 'available' | 'locked' => {
    if (completedNodes.has(cp.id)) return 'completed';
    const prereqs = (cp.prerequisites_ids ?? cp.prerequisites ?? []) as string[];
    if (prereqs.length === 0) return 'available';
    return prereqs.every(pid => completedNodes.has(pid)) ? 'available' : 'locked';
  }, [completedNodes]);

  // Spawn XP particles on node completion
  const spawnParticles = useCallback((cp: Checkpoint) => {
    const pos = getPos(cp);
    const { w, h } = nodeSize(cp);
    const cx = pos.x + w / 2, cy = pos.y + h / 2;
    const { tx: vtx, ty: vty, scale } = vp.current;
    const screenX = cx * scale + vtx;
    const screenY = cy * scale + vty;
    const id = Math.random().toString(36).slice(2);
    const nodeColor = cp.achievement_name ? '#f59e0b' : (hardcoreMode && branch.is_hardcore ? '#ff2020' : branch.color_hex);
    setParticles(prev => [...prev, { id, x: screenX, y: screenY, color: nodeColor }]);
    setTimeout(() => setParticles(prev => prev.filter(p => p.id !== id)), 1200);
  }, [getPos, hardcoreMode, branch.is_hardcore, branch.color_hex]);

  // Auto-complete — fires when all tasks in a checkpoint are done
  useEffect(() => {
    checkpoints.forEach(cp => {
      if (completedNodes.has(cp.id) || cp.tasks.length === 0) return;
      if (cp.tasks.every(t => completedTasks[cp.id]?.has(t.id))) {
        const xp = hardcoreMode ? Math.round(cp.xp_reward * 1.5) : cp.xp_reward;
        completeNode(cp.id, xp);
        spawnParticles(cp);
        if (cp.achievement_name) {
          emitToast({
            type: 'achievement',
            icon: cp.achievement_icon || '🏆',
            title: cp.achievement_name,
            subtitle: cp.achievement_description || undefined,
            xp,
            color: branch.color_hex,
          });
        } else {
          emitToast({ type: 'xp', title: cp.title, xp, color: branch.color_hex });
        }
      }
    });
  }, [completedTasks]);

  // Double-click canvas → create node
  const handleDblClick = useCallback(async (e: React.MouseEvent) => {
    if (!editMode) return;
    if ((e.target as Element).closest('[data-node]')) return;
    const { x, y } = toScene(e.clientX, e.clientY);
    const created = await checkpointsApi.create({
      branch: branch.id, title: 'Новая точка', icon_type: 'star',
      xp_reward: 300, order: checkpoints.length,
      pos_x: Math.round(x - NW / 2), pos_y: Math.round(y - NH / 2),
    });
    await tasksApi.create({ checkpoint: created.id, title: 'Первое задание', xp_reward: 100, difficulty_rating: 1, order: 0 });
    onChanged();
  }, [editMode, toScene, branch.id, checkpoints.length, onChanged]);

  // Right-click → context menu
  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    const nodeEl = (e.target as Element).closest('[data-node]') as HTMLElement | null;
    if (!nodeEl) return;
    e.preventDefault();
    const id = nodeEl.dataset.node!;
    const cp = cpMap[id]; if (!cp) return;
    setCtxMenu({ x: e.clientX, y: e.clientY, cp });
  }, [cpMap]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    setCtxMenu(null);
    if (e.button === 2) return; // handled by contextmenu
    if (e.button === 1 || panMode) {
      drag.current = { kind: 'pan', lx: e.clientX, ly: e.clientY };
      e.preventDefault(); return;
    }
    const nodeEl = (e.target as Element).closest('[data-node]') as HTMLElement | null;
    if (!nodeEl) {
      drag.current = { kind: 'pan', lx: e.clientX, ly: e.clientY };
      return;
    }
    const id = nodeEl.dataset.node!;
    const cp = cpMap[id]; if (!cp) return;
    const pos = getPos(cp);
    if (editMode && e.shiftKey) {
      drag.current = { kind: 'edge', fromId: id };
      const { x, y } = toScene(e.clientX, e.clientY);
      setEdgeDraft({ fromId: id, curX: x, curY: y });
      e.preventDefault(); return;
    }
    drag.current = { kind: 'node', id, sx: e.clientX, sy: e.clientY, ox: pos.x, oy: pos.y, moved: false };
    e.preventDefault();
  }, [panMode, editMode, cpMap, getPos, toScene]);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    const d = drag.current; if (!d) return;
    if (d.kind === 'pan') {
      const dx = e.clientX - d.lx, dy = e.clientY - d.ly;
      setVp(p => ({ ...p, tx: p.tx + dx, ty: p.ty + dy }));
      drag.current = { ...d, lx: e.clientX, ly: e.clientY };
    } else if (d.kind === 'node') {
      const { scale } = vp.current;
      const dx = (e.clientX - d.sx) / scale, dy = (e.clientY - d.sy) / scale;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) {
        drag.current = { ...d, moved: true };
        // snap to 10px
        setLocalPos(p => ({ ...p, [d.id]: { x: Math.round((d.ox + dx) / 10) * 10, y: Math.round((d.oy + dy) / 10) * 10 } }));
      }
    } else if (d.kind === 'edge') {
      const { x, y } = toScene(e.clientX, e.clientY);
      setEdgeDraft({ fromId: d.fromId, curX: x, curY: y });
    }
  }, [setVp, toScene]);

  const onMouseUp = useCallback(async (e: React.MouseEvent) => {
    const d = drag.current; drag.current = null; setEdgeDraft(null);
    if (d?.kind === 'node' && d.moved) {
      const pos = localPos[d.id];
      if (pos) try { await checkpointsApi.move(d.id, pos.x, pos.y); } catch {}
    } else if (d?.kind === 'edge') {
      const targetEl = (e.target as Element).closest('[data-node]') as HTMLElement | null;
      const toId = targetEl?.dataset.node;
      if (toId && toId !== d.fromId) {
        await checkpointsApi.addPrerequisite(toId, d.fromId);
        onChanged();
      }
    }
  }, [localPos, onChanged]);

  // Del key
  useEffect(() => {
    const h = async (e: KeyboardEvent) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId && editMode
        && !(e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement)) {
        if (confirm('Удалить точку?')) { await checkpointsApi.delete(selectedNodeId); selectNode(null); onChanged(); }
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [selectedNodeId, editMode, onChanged]);

  const color = hardcoreMode && branch.is_hardcore ? '#ff2020' : branch.color_hex;

  const edges = useMemo(() => {
    const res: [Checkpoint, Checkpoint][] = [];
    checkpoints.forEach(cp => {
      ((cp.prerequisites_ids ?? cp.prerequisites ?? []) as string[]).forEach(pid => {
        const from = cpMap[pid]; if (from) res.push([from, cp]);
      });
    });
    return res;
  }, [checkpoints, cpMap]);

  const renderEdge = (from: Checkpoint, to: Checkpoint, key: string) => {
    const fp = getPos(from), tp = getPos(to);
    const { w: fw, h: fh } = nodeSize(from), { w: tw, h: th } = nodeSize(to);
    const x1 = fp.x + fw / 2, y1 = fp.y + fh / 2;
    const x2 = tp.x + tw / 2, y2 = tp.y + th / 2;
    const mx = (x1 + x2) / 2, midY = (y1 + y2) / 2;
    const bothDone = completedNodes.has(from.id) && completedNodes.has(to.id);
    const fromDone = completedNodes.has(from.id);
    return (
      <g key={key}>
        {/* Glow line behind main edge when both done */}
        {bothDone && (
          <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none"
            stroke={color} strokeWidth={6} opacity={0.18}
            style={{ filter: 'blur(4px)' }} />
        )}
        <path d={`M${x1},${y1} C${mx},${y1} ${mx},${y2} ${x2},${y2}`} fill="none"
          stroke={bothDone ? color : fromDone ? `${color}60` : 'rgba(255,255,255,0.14)'}
          strokeWidth={bothDone ? 2.5 : 1.5}
          strokeDasharray={bothDone ? undefined : '6 4'} />
        {bothDone && <circle cx={mx} cy={midY} r={3} fill={color} opacity={0.8} />}
        {/* Edge delete — only in edit mode, on hover */}
        {editMode && (
          <g style={{ cursor: 'pointer' }} onClick={async e => {
            e.stopPropagation();
            await checkpointsApi.removePrerequisite(to.id, from.id);
            onChanged();
          }}>
            <circle cx={mx} cy={midY} r={9} fill="rgba(5,5,12,0.92)" stroke="rgba(255,70,70,0.5)" strokeWidth={1} />
            <text x={mx} y={midY + 4} textAnchor="middle" fontSize={12} fill="rgba(255,80,80,0.9)">×</text>
          </g>
        )}
      </g>
    );
  };

  const renderNode = (cp: Checkpoint) => {
    const state = getState(cp);
    const isCP = !!cp.achievement_name;
    const { w, h } = nodeSize(cp);
    const pos = getPos(cp);
    const isSelected = selectedNodeId === cp.id;
    const isEditing = editingTitle === cp.id;
    const isHovered = hoveredNode === cp.id && state !== 'locked';
    const cx = w / 2, cy = h / 2;
    const tasksDone = cp.tasks.filter(t => completedTasks[cp.id]?.has(t.id)).length;
    const taskPct = cp.tasks.length > 0 ? tasksDone / cp.tasks.length : 0;

    let fill: string, stroke: string, sw: number, textFill: string, iconCol: string;
    if (state === 'completed') {
      fill = 'rgba(245,158,11,0.28)'; stroke = '#f59e0b'; sw = 2.5;
      textFill = '#fde68a'; iconCol = '#fbbf24';
    } else if (state === 'available') {
      fill = `${color}35`; stroke = color; sw = isCP ? 2.5 : 2;
      textFill = '#f4f4ff'; iconCol = color;
    } else {
      fill = 'rgba(255,255,255,0.04)'; stroke = 'rgba(255,255,255,0.14)'; sw = 1;
      textFill = 'rgba(255,255,255,0.25)'; iconCol = 'rgba(255,255,255,0.18)';
    }
    if (isSelected) { stroke = '#ffffff'; sw = 3; }

    // hover scale applied via CSS transform on the group
    const hoverScale = isHovered && !editMode ? 1.06 : 1;

    return (
      <g key={cp.id} data-node={cp.id}
        transform={`translate(${pos.x + cx},${pos.y + cy}) scale(${hoverScale}) translate(${-cx},${-cy})`}
        onClick={e => {
          if (isEditing || (drag.current as any)?.moved) return;
          e.stopPropagation();
          if (state !== 'locked') selectNode(cp.id);
        }}
        onDoubleClick={e => {
          e.stopPropagation();
          if (editMode) { setEditingTitle(cp.id); return; }
          if (state !== 'locked') setEditingCp(cp);
        }}
        onMouseEnter={() => setHoveredNode(cp.id)}
        onMouseLeave={() => setHoveredNode(null)}
        style={{
          cursor: editMode ? 'grab' : state === 'locked' ? 'default' : 'pointer',
          transition: 'transform 0.18s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* Strong outer glow — larger on hover */}
        {state !== 'locked' && (
          <>
            <ellipse cx={cx} cy={cy}
              rx={isHovered ? w / 2 + 28 : w / 2 + 16}
              ry={isHovered ? h / 2 + 28 : h / 2 + 16}
              fill={state === 'completed' ? 'rgba(245,158,11,0.32)' : `${color}42`}
              style={{ filter: 'blur(20px)', transition: 'all 0.2s' }} />
            {/* Inner glow ring for checkpoint */}
            {isCP && (
              <ellipse cx={cx} cy={cy} rx={w / 2 + 4} ry={h / 2 + 4}
                fill="none"
                stroke={state === 'completed' ? '#f59e0b44' : `${color}44`}
                strokeWidth={1} />
            )}
          </>
        )}
        <rect x={0} y={0} width={w} height={h} rx={isCP ? 14 : 50}
          fill={fill} stroke={stroke} strokeWidth={sw} />
        {/* Shimmer highlight on hover */}
        {isHovered && (state === 'available' || state === 'completed') && (
          <rect x={0} y={0} width={w} height={h / 2} rx={isCP ? 14 : 50}
            fill={`url(#shimmer-${cp.id.slice(0,6)})`} opacity={0.15} />
        )}

        {/* Mini progress bar */}
        {cp.tasks.length > 0 && state !== 'locked' && (
          <>
            <rect x={8} y={h - 8} width={w - 16} height={3.5} rx={1.5} fill="rgba(0,0,0,0.3)" />
            <rect x={8} y={h - 8} width={(w - 16) * taskPct} height={3.5} rx={1.5}
              fill={state === 'completed' ? '#f59e0b' : color} />
          </>
        )}

        {state === 'available' && (
          <circle cx={w - 12} cy={12} r={4.5} fill={color}>
            <animate attributeName="opacity" values="1;0.3;1" dur="2s" repeatCount="indefinite" />
          </circle>
        )}
        {state === 'completed' && (
          <text x={w - 11} y={16} textAnchor="middle" fontSize="13" fill="#f59e0b" fontWeight="700">✓</text>
        )}
        {state === 'locked' && (
          <text x={cx} y={cy + 5} textAnchor="middle" fontSize="18" opacity="0.35">🔒</text>
        )}

        {state !== 'locked' && !isEditing && (
          <svg x={cx - 10} y={isCP ? 12 : cy - 19} width={20} height={20}
            viewBox="0 0 24 24" fill="none" stroke={iconCol} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d={ICON_PATHS[cp.icon_type] || ICON_PATHS.star} />
          </svg>
        )}

        {isEditing ? (
          <g transform={`translate(${cx},${isCP ? h - 28 : cy + 11})`}>
            <TitleEditor value={cp.title} w={w} onSave={async v => {
              setEditingTitle(null);
              if (v.trim() && v !== cp.title) { await checkpointsApi.update(cp.id, { title: v.trim() }); onChanged(); }
            }} />
          </g>
        ) : (
          <text x={cx} y={isCP ? h - 28 : cy + 11} textAnchor="middle" dominantBaseline="middle"
            fontFamily="'Cinzel',serif" fontSize={isCP ? 9 : 8.5} fontWeight="700"
            letterSpacing="0.07em" fill={textFill}>
            {cp.title.toUpperCase()}
          </text>
        )}

        {isCP && state !== 'locked' && !isEditing && (
          <text x={cx} y={h - 11} textAnchor="middle"
            fontFamily="'Rajdhani',sans-serif" fontSize="7.5" fontWeight="600" letterSpacing="0.12em"
            fill={state === 'completed' ? 'rgba(253,230,138,0.6)' : `${color}cc`}>
            ▲ CHECKPOINT
          </text>
        )}

        <text x={cx} y={h + 17} textAnchor="middle"
          fontFamily="'Rajdhani',sans-serif" fontSize="10" fontWeight="700"
          fill={state === 'completed' ? 'rgba(253,230,138,0.5)' : state === 'available' ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.12)'}>
          +{cp.xp_reward} XP{cp.tasks.length > 0 ? ` · ${tasksDone}/${cp.tasks.length}` : ''}
        </text>
      </g>
    );
  };

  // Build context menu items for right-clicked node
  const ctxItems: ContextMenuItem[] = ctxMenu ? [
    {
      icon: <Edit2 size={13} />,
      label: 'Редактировать',
      action: () => setEditingCp(ctxMenu.cp),
    },
    {
      icon: <Type size={13} />,
      label: 'Переименовать',
      action: () => setEditingTitle(ctxMenu.cp.id),
    },
    {
      icon: <Flag size={13} />,
      label: ctxMenu.cp.achievement_name ? 'Убрать checkpoint' : 'Сделать checkpoint',
      action: async () => {
        if (ctxMenu.cp.achievement_name) {
          await checkpointsApi.update(ctxMenu.cp.id, { achievement_name: '', achievement_description: '', achievement_icon: '' });
        } else {
          await checkpointsApi.update(ctxMenu.cp.id, { achievement_name: ctxMenu.cp.title, achievement_description: '', achievement_icon: '🏆' });
        }
        onChanged();
      },
    },
    {
      icon: <GitMerge size={13} />,
      label: 'Shift+drag = связать',
      action: () => {},
      divider: true,
    },
    {
      icon: <Trash2 size={13} />,
      label: 'Удалить точку',
      danger: true,
      divider: true,
      action: async () => {
        if (confirm(`Удалить "${ctxMenu.cp.title}"?`)) {
          await checkpointsApi.delete(ctxMenu.cp.id);
          if (selectedNodeId === ctxMenu.cp.id) selectNode(null);
          onChanged();
        }
      },
    },
  ] : [];

  const { tx, ty, scale } = vpState;
  const isNodeDragging = drag.current?.kind === 'node' && (drag.current as any).moved;
  const cursor = panMode || isNodeDragging ? 'grabbing' : editMode ? 'crosshair' : 'default';

  return (
    <div ref={containerRef}
      style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative', userSelect: 'none', cursor }}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      onDoubleClick={handleDblClick}
      onContextMenu={handleContextMenu}
    >
      <svg width="100%" height="100%" style={{ display: 'block', position: 'absolute', inset: 0 }}>
        <defs>
          <linearGradient id="shimmerGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="white" stopOpacity="0.5"/>
            <stop offset="100%" stopColor="white" stopOpacity="0"/>
          </linearGradient>
          {checkpoints.map(cp => (
            <linearGradient key={cp.id} id={`shimmer-${cp.id.slice(0,6)}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="white" stopOpacity="0.4"/>
              <stop offset="100%" stopColor="white" stopOpacity="0"/>
            </linearGradient>
          ))}
          <pattern id={`dg${branch.id.slice(0,8)}`} width="30" height="30" patternUnits="userSpaceOnUse"
            patternTransform={`translate(${((tx % 30) + 30) % 30},${((ty % 30) + 30) % 30})`}>
            <circle cx="15" cy="15" r="1" fill="rgba(255,255,255,0.07)" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#dg${branch.id.slice(0,8)})`} />
        <g transform={`translate(${tx},${ty}) scale(${scale})`}>
          {edges.map(([f, t]) => renderEdge(f, t, `${f.id}-${t.id}`))}
          {edgeDraft && (() => {
            const from = cpMap[edgeDraft.fromId]; if (!from) return null;
            const fp = getPos(from); const { w, h } = nodeSize(from);
            return <path d={`M${fp.x + w / 2},${fp.y + h / 2} L${edgeDraft.curX},${edgeDraft.curY}`}
              fill="none" stroke={color} strokeWidth={2} strokeDasharray="6 4" opacity={0.8} />;
          })()}
          {checkpoints.map(cp => renderNode(cp))}
        </g>
      </svg>

      {/* Toolbar */}
      <div style={{
        position: 'absolute', top: 10, right: 10,
        display: 'flex', alignItems: 'center', gap: 4,
        background: 'rgba(0,0,0,0.72)', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 8, padding: '5px 8px', backdropFilter: 'blur(12px)',
      }}>
        <Btn active={editMode} onClick={() => setEditMode(v => !v)} title="Режим редактора: 2×клик=создать, Shift+drag=связать, ПКМ=меню">
          ✏ EDIT
        </Btn>
        <Sep />
        <IBtn onClick={fitToScreen} title="Вписать всё в экран">⊞</IBtn>
        <Sep />
        <IBtn onClick={() => setVp(p => { const ns = Math.min(4, p.scale * 1.2); const el = containerRef.current!; const mx = el.clientWidth / 2, my = el.clientHeight / 2; return { scale: ns, tx: mx - (ns / p.scale) * (mx - p.tx), ty: my - (ns / p.scale) * (my - p.ty) }; })}>＋</IBtn>
        <IBtn onClick={() => setVp(p => { const ns = Math.max(0.15, p.scale * 0.8); const el = containerRef.current!; const mx = el.clientWidth / 2, my = el.clientHeight / 2; return { scale: ns, tx: mx - (ns / p.scale) * (mx - p.tx), ty: my - (ns / p.scale) * (my - p.ty) }; })}>－</IBtn>
        <IBtn onClick={() => setVp(() => ({ tx: 80, ty: 80, scale: 1 }))}>RST</IBtn>
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', minWidth: 28 }}>{Math.round(scale * 100)}%</div>
      </div>

      {/* Edit mode hint */}
      {editMode && (
        <div style={{
          position: 'absolute', bottom: 10, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(124,58,237,0.18)', border: '1px solid rgba(124,58,237,0.35)',
          borderRadius: 6, padding: '5px 14px', backdropFilter: 'blur(8px)',
          fontSize: 10, color: 'rgba(200,180,255,0.75)', letterSpacing: '0.08em',
          whiteSpace: 'nowrap', pointerEvents: 'none',
        }}>
          2×клик = создать · Shift+drag = связать · ПКМ = меню · Del = удалить
        </div>
      )}

      {/* Empty branch hint */}
      {checkpoints.length === 0 && (
        <div style={{
          position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)',
          textAlign: 'center', pointerEvents: 'none',
        }}>
          <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.15 }}>⊕</div>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.2)', marginBottom: 6 }}>
            Ветка пуста
          </div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', letterSpacing: '0.08em' }}>
            Включи <span style={{ color: 'rgba(168,85,247,0.5)' }}>EDIT</span> и дважды кликни чтобы добавить точку
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{
        position: 'absolute', bottom: 10, left: 10,
        background: 'rgba(0,0,0,0.65)', border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 7, padding: '7px 11px', backdropFilter: 'blur(8px)',
      }}>
        {[{ c: '#f59e0b', l: 'Выполнено' }, { c: color, l: 'Доступно' }, { c: 'rgba(255,255,255,0.18)', l: 'Заблокировано' }].map(({ c, l }) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: c, boxShadow: `0 0 4px ${c}` }} />
            <span style={{ fontFamily: "'Rajdhani',sans-serif", fontSize: 10, color: 'rgba(255,255,255,0.5)' }}>{l}</span>
          </div>
        ))}
        <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.2)', marginTop: 5 }}>H / Пробел = перемещение</div>
      </div>

      {/* XP Particles */}
      {particles.map(p => (
        <div key={p.id} style={{
          position: 'absolute', left: p.x, top: p.y, pointerEvents: 'none', zIndex: 100,
          display: 'flex', gap: 4,
        }}>
          {[...Array(8)].map((_, i) => (
            <div key={i} style={{
              width: 5, height: 5, borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 6px ${p.color}`,
              animation: `particle${i % 4} 1s ease-out forwards`,
              position: 'absolute',
            }} />
          ))}
          <style>{`
            @keyframes particle0 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(-30px,-50px);opacity:0} }
            @keyframes particle1 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(30px,-50px);opacity:0} }
            @keyframes particle2 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(-15px,-65px);opacity:0} }
            @keyframes particle3 { 0%{transform:translate(0,0);opacity:1} 100%{transform:translate(15px,-65px);opacity:0} }
          `}</style>
        </div>
      ))}

      {editingCp && (
        <CheckpointEditor checkpoint={editingCp}
          onSaved={() => { setEditingCp(null); onChanged(); }}
          onClose={() => setEditingCp(null)} />
      )}
      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} items={ctxItems} onClose={() => setCtxMenu(null)} />
      )}
    </div>
  );
}

function Btn({ active, onClick, title, children }: { active?: boolean; onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{
      padding: '3px 8px', borderRadius: 5, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em',
      cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif",
      background: active ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.05)',
      border: `1px solid ${active ? 'rgba(124,58,237,0.7)' : 'rgba(255,255,255,0.12)'}`,
      color: active ? '#c084fc' : 'rgba(255,255,255,0.45)',
    }}>{children}</button>
  );
}
function IBtn({ onClick, title, children }: { onClick: () => void; title?: string; children: React.ReactNode }) {
  return (
    <button onClick={onClick} title={title} style={{
      width: 22, height: 22, borderRadius: 5, fontSize: 13, cursor: 'pointer',
      background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
      color: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>{children}</button>
  );
}
function Sep() { return <div style={{ width: 1, height: 14, background: 'rgba(255,255,255,0.1)' }} />; }
