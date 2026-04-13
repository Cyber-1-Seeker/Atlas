import React, { useState } from 'react';
import { branchesApi } from '../api/client';
import type { Branch } from '../types';
import { X, GitBranch, Skull, Check } from 'lucide-react';

interface Props {
  directionId: string;
  existingBranches: Branch[];   // normal (non-hardcore) branches for linking
  onSaved: (newBranch: Branch) => void;
  onClose: () => void;
}

const COLORS = [
  { hex: '#e8003d', name: 'Красный' },
  { hex: '#7c3aed', name: 'Фиолетовый' },
  { hex: '#f59e0b', name: 'Золотой' },
  { hex: '#06b6d4', name: 'Циан' },
  { hex: '#10b981', name: 'Зелёный' },
  { hex: '#f97316', name: 'Оранжевый' },
  { hex: '#ec4899', name: 'Розовый' },
  { hex: '#6366f1', name: 'Индиго' },
];

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: '#e0e0f0',
  fontFamily: "'Rajdhani',sans-serif",
  fontSize: 13, padding: '8px 11px',
  width: '100%', outline: 'none',
};

export default function Builder({ directionId, existingBranches, onSaved, onClose }: Props) {
  const [title, setTitle]         = useState('');
  const [color, setColor]         = useState('#e8003d');
  const [desc, setDesc]           = useState('');
  const [isHardcore, setIsHardcore] = useState(false);
  const [linkedBranchId, setLinkedBranchId] = useState<string>('');
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');

  const normalBranches = existingBranches.filter(b => !b.is_hardcore);

  const save = async () => {
    if (!title.trim()) { setError('Введите название ветки'); return; }
    if (isHardcore && !linkedBranchId) { setError('Выберите обычную ветку для привязки'); return; }
    setSaving(true); setError('');
    try {
      const payload: Record<string, unknown> = {
        direction: directionId,
        title: title.trim(),
        description: desc,
        color_hex: color,
        is_hardcore: isHardcore,
        order: existingBranches.length,
      };
      const newBranch: Branch = await branchesApi.create(payload);

      // If hardcore — link normal branch's hardcore_variant to this new branch
      if (isHardcore && linkedBranchId) {
        await branchesApi.update(linkedBranchId, { hardcore_variant: newBranch.id });
      }

      onSaved(newBranch);
    } catch (e: any) {
      setError(e?.response?.data ? JSON.stringify(e.response.data) : 'Ошибка сохранения');
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(10px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani',sans-serif", padding: 20,
    }}>
      <div style={{
        background: '#08080f', border: '1px solid rgba(255,255,255,0.11)',
        borderRadius: 16, width: '100%', maxWidth: 460,
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 80px rgba(0,0,0,0.85)',
      }}>

        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: isHardcore ? 'rgba(255,0,0,0.15)' : 'rgba(124,58,237,0.15)', border: `1px solid ${isHardcore ? 'rgba(255,0,0,0.35)' : 'rgba(124,58,237,0.35)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isHardcore ? <Skull size={14} color="#ff4040" /> : <GitBranch size={14} color="#a855f7" />}
            </div>
            <div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e0e0f0' }}>
                Новая ветка
              </div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 1 }}>
                После создания добавляй узлы прямо на холсте
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Title */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
              Название ветки *
            </div>
            <input
              style={inp}
              placeholder={isHardcore ? 'Напр.: HARDCORE: Creator' : 'Напр.: Web Dev + AI'}
              value={title}
              onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()}
              autoFocus
            />
          </div>

          {/* Description */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
              Описание (необязательно)
            </div>
            <input style={inp} placeholder="Краткое описание ветки" value={desc} onChange={e => setDesc(e.target.value)} />
          </div>

          {/* Color */}
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>
              Цвет акцента
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c.hex} onClick={() => setColor(c.hex)} title={c.name} style={{
                  width: 30, height: 30, borderRadius: '50%', background: c.hex, cursor: 'pointer',
                  border: `2.5px solid ${color === c.hex ? '#ffffff' : 'transparent'}`,
                  boxShadow: color === c.hex ? `0 0 10px ${c.hex}` : 'none',
                  position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {color === c.hex && <Check size={12} color="#fff" strokeWidth={3} />}
                </button>
              ))}
            </div>
            {/* Preview pill */}
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '5px 12px', borderRadius: 20, background: `${color}15`, border: `1px solid ${color}55` }}>
              <div style={{ width: 7, height: 7, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 11, fontWeight: 600, color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                {title || 'Название ветки'}
              </span>
            </div>
          </div>

          {/* Type toggle */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button onClick={() => setIsHardcore(false)} style={{
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
              background: !isHardcore ? 'rgba(124,58,237,0.12)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${!isHardcore ? 'rgba(124,58,237,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: !isHardcore ? '#a855f7' : 'rgba(255,255,255,0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            }}>
              <GitBranch size={18} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>ОБЫЧНАЯ</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.3 }}>Стандартный путь обучения</span>
            </button>
            <button onClick={() => setIsHardcore(true)} style={{
              padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
              background: isHardcore ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isHardcore ? 'rgba(255,0,0,0.45)' : 'rgba(255,255,255,0.08)'}`,
              color: isHardcore ? '#ff4040' : 'rgba(255,255,255,0.3)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
            }}>
              <Skull size={18} />
              <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>HARDCORE</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)', textAlign: 'center', lineHeight: 1.3 }}>Усложнённая альтернатива</span>
            </button>
          </div>

          {/* Hardcore: link to normal branch */}
          {isHardcore && (
            <div style={{ background: 'rgba(255,0,0,0.05)', border: '1px solid rgba(255,0,0,0.18)', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,100,100,0.6)', marginBottom: 8 }}>
                ☠ Привязать к обычной ветке
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', marginBottom: 10, lineHeight: 1.5 }}>
                При включении Hardcore-режима эта ветка будет автоматически заменять выбранную обычную ветку.
              </div>
              {normalBranches.length === 0 ? (
                <div style={{ fontSize: 11, color: 'rgba(255,100,100,0.5)', fontStyle: 'italic' }}>
                  Сначала создай хотя бы одну обычную ветку
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {normalBranches.map(b => (
                    <button key={b.id} onClick={() => setLinkedBranchId(b.id)} style={{
                      display: 'flex', alignItems: 'center', gap: 8,
                      padding: '7px 10px', borderRadius: 6, cursor: 'pointer', textAlign: 'left',
                      background: linkedBranchId === b.id ? `${b.color_hex}15` : 'rgba(255,255,255,0.02)',
                      border: `1px solid ${linkedBranchId === b.id ? b.color_hex + '55' : 'rgba(255,255,255,0.07)'}`,
                    }}>
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: b.color_hex, flexShrink: 0 }} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: linkedBranchId === b.id ? b.color_hex : 'rgba(255,255,255,0.5)', flex: 1, letterSpacing: '0.05em' }}>
                        {b.title}
                      </span>
                      {linkedBranchId === b.id && <Check size={12} color={b.color_hex} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {error && (
            <div style={{ padding: '7px 11px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.22)', borderRadius: 6, fontSize: 11, color: '#ff7070' }}>
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.09)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            Отмена
          </button>
          <button onClick={save} disabled={saving || !title.trim()} style={{
            flex: 2, padding: '9px', borderRadius: 7, border: 'none',
            background: title.trim() ? (isHardcore ? 'linear-gradient(135deg,#8b0000,#e8003d)' : 'linear-gradient(135deg,#7c3aed,#e8003d)') : 'rgba(255,255,255,0.05)',
            color: title.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
            fontFamily: "'Cinzel',serif", cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            {saving ? 'Создаём...' : (isHardcore ? '☠ Создать HC-ветку' : '⊕ Создать ветку')}
          </button>
        </div>
      </div>
    </div>
  );
}
