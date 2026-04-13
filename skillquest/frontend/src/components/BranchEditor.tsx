import React, { useState } from 'react';
import { branchesApi } from '../api/client';
import type { Branch } from '../types';
import { X, Check } from 'lucide-react';

interface Props {
  branch: Branch;
  onSaved: () => void;
  onClose: () => void;
}

const COLORS = [
  '#e8003d','#7c3aed','#f59e0b','#06b6d4',
  '#10b981','#f97316','#ec4899','#6366f1',
];

export default function BranchEditor({ branch, onSaved, onClose }: Props) {
  const [title, setTitle] = useState(branch.title);
  const [color, setColor] = useState(branch.color_hex);
  const [desc,  setDesc]  = useState(branch.description ?? '');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await branchesApi.update(branch.id, { title: title.trim(), color_hex: color, description: desc });
      onSaved();
    } finally { setSaving(false); }
  };

  const inp: React.CSSProperties = {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: '#e0e0f0', fontFamily: "'Rajdhani',sans-serif",
    fontSize: 13, padding: '7px 10px', width: '100%', outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani',sans-serif", padding: 20,
    }}>
      <div style={{
        background: '#09090f', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 14, width: '100%', maxWidth: 400,
        boxShadow: '0 32px 64px rgba(0,0,0,0.85)',
      }}>
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e0e0f0' }}>
            Редактировать ветку
          </span>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}><X size={15} /></button>
        </div>

        <div style={{ padding: '18px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>Название</div>
            <input style={inp} value={title} onChange={e => setTitle(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && save()} autoFocus />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 5 }}>Описание</div>
            <input style={inp} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Краткое описание" />
          </div>
          <div>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Цвет</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {COLORS.map(c => (
                <button key={c} onClick={() => setColor(c)} style={{
                  width: 28, height: 28, borderRadius: '50%', background: c, cursor: 'pointer',
                  border: `2.5px solid ${color === c ? '#fff' : 'transparent'}`,
                  boxShadow: color === c ? `0 0 8px ${c}` : 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {color === c && <Check size={11} color="#fff" strokeWidth={3} />}
                </button>
              ))}
            </div>
            {/* Preview */}
            <div style={{ marginTop: 10, display: 'inline-flex', alignItems: 'center', gap: 7, padding: '4px 12px', borderRadius: 20, background: `${color}18`, border: `1px solid ${color}55` }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: color }} />
              <span style={{ fontSize: 10, fontWeight: 600, color, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{title || '...'}</span>
            </div>
          </div>
        </div>

        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.09)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>Отмена</button>
          <button onClick={save} disabled={saving || !title.trim()} style={{
            flex: 2, padding: '8px', borderRadius: 6, border: 'none',
            background: title.trim() ? 'linear-gradient(135deg,#7c3aed,#e8003d)' : 'rgba(255,255,255,0.05)',
            color: title.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
            fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', fontFamily: "'Cinzel',serif",
            cursor: saving || !title.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {saving ? 'Сохраняем...' : <><Check size={12} /> Сохранить</>}
          </button>
        </div>
      </div>
    </div>
  );
}
