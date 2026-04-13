import React, { useCallback, useRef, useState } from 'react';
import { useStore } from '../store/useStore';
import { tasksApi, checkpointsApi } from '../api/client';
import type { Checkpoint, Task } from '../types';
import { X, Plus, RotateCcw, Edit2, Trash2 } from 'lucide-react';
import { emitToast } from './ToastSystem';
import { recordActivity } from '../lib/streak';

interface Props {
  checkpoint: Checkpoint | null;
  onTaskAdded?: () => void;
}

export default function TaskPanel({ checkpoint, onTaskAdded }: Props) {
  const {
    panelOpen, setPanelOpen, hardcoreMode,
    isNodeComplete, isTaskComplete,
    completeTask, uncompleteTask,
  } = useStore();


  const [toast, setToast] = useState<{ text: string; type: 'xp' | 'warn' } | null>(null);
  const toastRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [showAddTask, setShowAddTask] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newXP, setNewXP] = useState(100);
  const [newDiff, setNewDiff] = useState(1);
  const [newDesc, setNewDesc] = useState('');
  const [addingTask, setAddingTask] = useState(false);

  // inline edit state for existing task
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const flash = (text: string, type: 'xp' | 'warn' = 'xp') => {
    setToast({ text, type });
    if (toastRef.current) clearTimeout(toastRef.current);
    toastRef.current = setTimeout(() => setToast(null), 2200);
  };



  const handleAddTask = async () => {
    if (!checkpoint || !newTitle.trim()) return;
    setAddingTask(true);
    try {
      await tasksApi.create({
        checkpoint: checkpoint.id, title: newTitle.trim(),
        content_md: newDesc, xp_reward: newXP, difficulty_rating: newDiff,
        order: checkpoint.tasks.length,
      });
      setNewTitle(''); setNewDesc(''); setNewXP(100); setNewDiff(1);
      setShowAddTask(false);
      onTaskAdded?.();
      flash('Задание добавлено');
    } finally { setAddingTask(false); }
  };

  const saveTaskTitle = async (task: Task) => {
    if (editTitle.trim() && editTitle !== task.title) {
      await tasksApi.update(task.id, { title: editTitle.trim() });
      onTaskAdded?.();
    }
    setEditingTask(null);
  };

  const deleteTask = async (taskId: string) => {
    await tasksApi.delete(taskId);
    onTaskAdded?.();
  };

  if (!checkpoint) return null;

  const done = isNodeComplete(checkpoint.id);
  const DIFF_COLORS = ['', '#22c55e', '#f59e0b', '#ef4444'];
  const DIFF_LABELS = ['', 'Легко', 'Средне', 'Сложно'];
  const tasksDone = checkpoint.tasks.filter(t => isTaskComplete(checkpoint.id, t.id)).length;

  return (
    <>
      {/* Backdrop only on mobile */}
      {panelOpen && (
        <div onClick={() => setPanelOpen(false)} style={{
          position: 'fixed', inset: 0, zIndex: 199,
          background: 'rgba(0,0,0,0.2)',
          display: 'none', // hidden on desktop via media — handled via inline below
        }} />
      )}

      <div style={{
        position: 'absolute', top: 0, right: 0, bottom: 0,
        width: panelOpen ? 380 : 0,
        overflow: 'hidden',
        transition: 'width 0.32s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 50,
        borderLeft: panelOpen ? '1px solid rgba(255,255,255,0.08)' : 'none',
        background: 'rgba(7,7,11,0.97)',
        backdropFilter: 'blur(24px)',
        display: 'flex', flexDirection: 'column',
        fontFamily: "'Rajdhani', sans-serif",
      }}>
        {/* inner — fixed width so content doesn't squish during animation */}
        <div style={{ width: 380, height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

          {/* Header */}
          <div style={{ padding: '16px 16px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(0,0,0,0.3)', flexShrink: 0 }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, paddingRight: 8, minWidth: 0 }}>
                <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.25em', textTransform: 'uppercase', color: checkpoint.achievement_name ? 'rgba(245,158,11,0.6)' : 'rgba(255,255,255,0.3)', marginBottom: 3 }}>
                  {checkpoint.achievement_name ? '⬡ Контрольная точка' : '◈ Задание'}
                </div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#e0e0f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {checkpoint.title}
                </div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', marginTop: 3 }}>
                  {tasksDone}/{checkpoint.tasks.length} задан. · +{checkpoint.xp_reward} XP
                  {hardcoreMode && <span style={{ color: '#ff5050', marginLeft: 6 }}>★ ×1.5</span>}
                </div>
              </div>
              <button onClick={() => setPanelOpen(false)} style={{
                width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                color: 'rgba(255,255,255,0.6)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}><X size={12} /></button>
            </div>

            {/* Progress bar */}
            <div style={{ marginTop: 10 }}>
              <div style={{ height: 2.5, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                <div style={{
                  height: '100%', borderRadius: 2, transition: 'width 0.4s ease',
                  background: done ? '#f59e0b' : 'linear-gradient(90deg,#7c3aed,#e8003d)',
                  width: `${checkpoint.tasks.length > 0 ? (tasksDone / checkpoint.tasks.length) * 100 : 0}%`,
                }} />
              </div>
            </div>
          </div>

          {/* Body */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px' }}>

            {/* Achievement banner */}
            {checkpoint.achievement_name && (
              <div style={{
                background: 'linear-gradient(135deg,rgba(245,158,11,0.07),rgba(232,0,61,0.05))',
                border: '1px solid rgba(245,158,11,0.18)', borderRadius: 9,
                padding: '10px 12px', marginBottom: 12, textAlign: 'center',
              }}>
                <div style={{ fontSize: 26, marginBottom: 4 }}>{checkpoint.achievement_icon}</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, fontWeight: 700, color: '#fbbf24', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
                  {checkpoint.achievement_name}
                </div>
                {checkpoint.achievement_description && (
                  <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.55)', marginTop: 2 }}>{checkpoint.achievement_description}</div>
                )}
              </div>
            )}

            {checkpoint.description && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, marginBottom: 12 }}>
                {checkpoint.description}
              </div>
            )}

            {/* Tasks header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)' }}>
                ЗАДАНИЯ
              </div>
              <button onClick={() => setShowAddTask(v => !v)} style={{
                display: 'flex', alignItems: 'center', gap: 3,
                background: 'none', border: '1px solid rgba(124,58,237,0.28)', borderRadius: 4,
                color: 'rgba(124,58,237,0.65)', fontSize: 9, fontWeight: 600, padding: '2px 7px',
                cursor: 'pointer', letterSpacing: '0.08em',
              }}><Plus size={10} /> Добавить</button>
            </div>

            {/* Add task form */}
            {showAddTask && (
              <div style={{
                background: 'rgba(124,58,237,0.05)', border: '1px solid rgba(124,58,237,0.18)',
                borderRadius: 8, padding: '10px 12px', marginBottom: 10,
              }}>
                <input value={newTitle} onChange={e => setNewTitle(e.target.value)}
                  placeholder="Название задания"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#e0e0f0', fontSize: 12, padding: '6px 9px', outline: 'none', marginBottom: 6 }} />
                <textarea value={newDesc} onChange={e => setNewDesc(e.target.value)}
                  placeholder="Описание (необязательно)" rows={2}
                  style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#e0e0f0', fontSize: 11, padding: '5px 9px', outline: 'none', resize: 'none', marginBottom: 6 }} />
                <div style={{ display: 'flex', gap: 7, marginBottom: 8 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', marginBottom: 2, letterSpacing: '0.1em' }}>XP</div>
                    <input type="number" value={newXP} onChange={e => setNewXP(+e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#e0e0f0', fontSize: 11, padding: '4px 8px', outline: 'none' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.45)', marginBottom: 2, letterSpacing: '0.1em' }}>СЛОЖНОСТЬ</div>
                    <select value={newDiff} onChange={e => setNewDiff(+e.target.value)} style={{ width: '100%', background: '#0e0e18', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 5, color: '#e0e0f0', fontSize: 11, padding: '4px 8px', outline: 'none' }}>
                      <option value={1}>Легко</option><option value={2}>Средне</option><option value={3}>Сложно</option>
                    </select>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setShowAddTask(false)} style={{ flex: 1, padding: '5px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.08)', background: 'transparent', color: 'rgba(255,255,255,0.55)', fontSize: 10, cursor: 'pointer' }}>Отмена</button>
                  <button onClick={handleAddTask} disabled={addingTask || !newTitle.trim()} style={{ flex: 2, padding: '5px', borderRadius: 5, border: 'none', background: newTitle.trim() ? 'rgba(124,58,237,0.45)' : 'rgba(255,255,255,0.05)', color: '#fff', fontSize: 10, fontWeight: 700, cursor: addingTask || !newTitle.trim() ? 'not-allowed' : 'pointer' }}>
                    {addingTask ? '...' : 'Добавить'}
                  </button>
                </div>
              </div>
            )}

            {/* Task list */}
            {checkpoint.tasks.map((task: Task) => {
              const taskDone = isTaskComplete(checkpoint.id, task.id);
              const isEditingThis = editingTask === task.id;
              return (
                <div key={task.id} style={{
                  background: taskDone ? 'rgba(245,158,11,0.05)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${taskDone ? 'rgba(245,158,11,0.18)' : 'rgba(255,255,255,0.05)'}`,
                  borderRadius: 7, padding: '8px 10px', marginBottom: 6,
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    {/* Checkbox */}
                    <div onClick={() => {
                        if (taskDone) { uncompleteTask(checkpoint.id, task.id, task.xp_reward); flash('Отменено', 'warn'); }
                        else {
                          completeTask(checkpoint.id, task.id, task.xp_reward);
                          flash(`+${task.xp_reward} XP`);
                          emitToast({ type: 'xp', title: task.title, xp: task.xp_reward });
                          recordActivity();
                        }
                      }}
                      style={{
                        width: 17, height: 17, borderRadius: '50%', flexShrink: 0, cursor: 'pointer',
                        border: `1.5px solid ${taskDone ? '#f59e0b' : 'rgba(255,255,255,0.16)'}`,
                        background: taskDone ? 'rgba(245,158,11,0.15)' : 'transparent',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#f59e0b', fontSize: 9, transition: 'all 0.15s',
                      }}>
                      {taskDone && '✓'}
                    </div>

                    {/* Title / inline edit */}
                    {isEditingThis ? (
                      <input autoFocus value={editTitle} onChange={e => setEditTitle(e.target.value)}
                        onBlur={() => saveTaskTitle(task)}
                        onKeyDown={e => { if (e.key === 'Enter') saveTaskTitle(task); if (e.key === 'Escape') setEditingTask(null); }}
                        style={{ flex: 1, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(124,58,237,0.5)', borderRadius: 4, color: '#e0e0f0', fontSize: 11, padding: '2px 6px', outline: 'none' }} />
                    ) : (
                      <span style={{ flex: 1, fontSize: 11, fontWeight: 500, color: taskDone ? 'rgba(255,255,255,0.3)' : '#e8e8f8', textDecoration: taskDone ? 'line-through' : 'none', cursor: 'default' }}>
                        {task.title}
                      </span>
                    )}

                    {/* Meta */}
                    <span style={{ fontSize: 8, fontWeight: 700, color: DIFF_COLORS[task.difficulty_rating], flexShrink: 0 }}>{DIFF_LABELS[task.difficulty_rating]}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: taskDone ? '#f59e0b55' : '#f59e0b', flexShrink: 0 }}>+{task.xp_reward}</span>

                    {/* Undo */}
                    {taskDone && (
                      <button onClick={() => { uncompleteTask(checkpoint.id, task.id, task.xp_reward); flash('Отменено', 'warn'); }}
                        title="Отменить" style={{ background: 'none', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 3, color: 'rgba(255,255,255,0.45)', cursor: 'pointer', padding: '1px 3px', display: 'flex', alignItems: 'center' }}>
                        <RotateCcw size={9} />
                      </button>
                    )}
                    {/* Edit */}
                    {!isEditingThis && (
                      <button onClick={() => { setEditingTask(task.id); setEditTitle(task.title); }}
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer', padding: '1px 2px', display: 'flex', alignItems: 'center' }}>
                        <Edit2 size={9} />
                      </button>
                    )}
                    {/* Delete */}
                    <button onClick={() => { if (confirm('Удалить задание?')) deleteTask(task.id); }}
                      style={{ background: 'none', border: 'none', color: 'rgba(255,80,80,0.3)', cursor: 'pointer', padding: '1px 2px', display: 'flex', alignItems: 'center' }}>
                      <Trash2 size={9} />
                    </button>
                  </div>

                  {task.content_md && (
                    <div style={{ fontSize: 9, color: 'rgba(255,255,255,0.45)', marginTop: 4, paddingLeft: 24, lineHeight: 1.45 }}>{task.content_md}</div>
                  )}
                  {hardcoreMode && task.hardcore_description && (
                    <div style={{ fontSize: 9, color: '#ff404066', marginTop: 3, paddingLeft: 24, fontStyle: 'italic' }}>☠ {task.hardcore_description}</div>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'absolute', bottom: 60, right: panelOpen ? 396 : 16, zIndex: 999,
          background: toast.type === 'xp' ? 'rgba(245,158,11,0.12)' : 'rgba(100,100,120,0.15)',
          border: `1px solid ${toast.type === 'xp' ? 'rgba(245,158,11,0.3)' : 'rgba(255,255,255,0.12)'}`,
          borderRadius: 6, padding: '7px 14px',
          fontFamily: "'Cinzel',serif", fontSize: 11, fontWeight: 700,
          color: toast.type === 'xp' ? '#fbbf24' : 'rgba(255,255,255,0.45)',
          backdropFilter: 'blur(10px)', letterSpacing: '0.08em', pointerEvents: 'none',
        }}>
          {toast.text}
        </div>
      )}
    </>
  );
}
