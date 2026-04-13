import React, { useState, useEffect } from 'react';
import { checkpointsApi } from '../api/client';
import type { Checkpoint } from '../types';
import { X, Check } from 'lucide-react';

interface Props {
  checkpoint: Checkpoint;
  onSaved: () => void;
  onClose: () => void;
}

const ICONS = [
  { key: 'code',    e: '💻' }, { key: 'palette', e: '🎨' }, { key: 'globe',  e: '🌐' },
  { key: 'brain',   e: '🧠' }, { key: 'trophy',  e: '🏆' }, { key: 'star',   e: '⭐' },
  { key: 'target',  e: '🎯' }, { key: 'cpu',     e: '⚙️' }, { key: 'bolt',   e: '⚡' },
  { key: 'book',    e: '📖' }, { key: 'music',   e: '🎵' }, { key: 'fire',   e: '🔥' },
];

const inp: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6, color: '#e0e0f0', fontFamily: "'Rajdhani',sans-serif",
  fontSize: 12, padding: '6px 9px', width: '100%', outline: 'none',
};
const lbl: React.CSSProperties = {
  fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase',
  color: 'rgba(255,255,255,0.3)', marginBottom: 4, display: 'block',
};

export default function CheckpointEditor({ checkpoint, onSaved, onClose }: Props) {
  const [title, setTitle] = useState(checkpoint.title);
  const [desc, setDesc] = useState(checkpoint.description);
  const [icon, setIcon] = useState(checkpoint.icon_type);
  const [xp, setXp] = useState(checkpoint.xp_reward);
  const [achName, setAchName] = useState(checkpoint.achievement_name);
  const [achDesc, setAchDesc] = useState(checkpoint.achievement_description);
  const [achIcon, setAchIcon] = useState(checkpoint.achievement_icon || '🏆');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await checkpointsApi.update(checkpoint.id, {
        title: title.trim() || checkpoint.title,
        description: desc,
        icon_type: icon,
        xp_reward: xp,
        achievement_name: achName,
        achievement_description: achDesc,
        achievement_icon: achIcon,
      });
      onSaved();
    } finally { setSaving(false); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 500,
      background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani',sans-serif", padding: 20,
    }}>
      <div style={{
        background: '#09090f', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 14,
        width: '100%', maxWidth: 440, maxHeight: '88vh',
        display: 'flex', flexDirection: 'column', boxShadow: '0 32px 64px rgba(0,0,0,0.8)',
      }}>
        {/* Header */}
        <div style={{ padding: '14px 18px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e0e0f0' }}>
            Редактировать точку
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer' }}><X size={15} /></button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Title */}
          <div>
            <span style={lbl}>Название</span>
            <input style={inp} value={title} onChange={e => setTitle(e.target.value)} placeholder="Название точки" />
          </div>

          {/* Description */}
          <div>
            <span style={lbl}>Описание</span>
            <textarea style={{ ...inp, resize: 'none', minHeight: 56 } as React.CSSProperties} value={desc} onChange={e => setDesc(e.target.value)} placeholder="Описание (необязательно)" />
          </div>

          {/* Icon + XP row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, alignItems: 'start' }}>
            <div>
              <span style={lbl}>Иконка</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                {ICONS.map(ic => (
                  <button key={ic.key} onClick={() => setIcon(ic.key)} style={{
                    width: 32, height: 32, borderRadius: 6, fontSize: 16, cursor: 'pointer',
                    background: icon === ic.key ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${icon === ic.key ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.07)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative',
                  }}>
                    {ic.e}
                    {icon === ic.key && <div style={{ position: 'absolute', top: 1, right: 1 }}><Check size={7} color="#a855f7" /></div>}
                  </button>
                ))}
              </div>
            </div>
            <div style={{ minWidth: 80 }}>
              <span style={lbl}>XP награда</span>
              <input style={inp} type="number" value={xp} onChange={e => setXp(+e.target.value)} />
            </div>
          </div>

          {/* Achievement section */}
          <div style={{ background: 'rgba(245,158,11,0.04)', border: '1px solid rgba(245,158,11,0.12)', borderRadius: 8, padding: '12px 14px' }}>
            <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(245,158,11,0.5)', marginBottom: 10 }}>
              АЧИВКА (оставь пустым если не checkpoint)
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '52px 1fr', gap: 10, marginBottom: 10 }}>
              <div>
                <span style={lbl}>Значок</span>
                <input style={{ ...inp, textAlign: 'center', fontSize: 20, padding: '3px 6px' }} value={achIcon} onChange={e => setAchIcon(e.target.value)} maxLength={2} />
              </div>
              <div>
                <span style={lbl}>Название ачивки</span>
                <input style={inp} value={achName} onChange={e => setAchName(e.target.value)} placeholder="Junior Developer" />
              </div>
            </div>
            <div>
              <span style={lbl}>Описание ачивки</span>
              <input style={inp} value={achDesc} onChange={e => setAchDesc(e.target.value)} placeholder="Описание достижения..." />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '12px 18px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{ flex: 1, padding: '9px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.09)', background: 'transparent', color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
            Отмена
          </button>
          <button onClick={save} disabled={saving} style={{
            flex: 2, padding: '9px', borderRadius: 7, border: 'none',
            background: 'linear-gradient(135deg,#7c3aed,#e8003d)',
            color: '#fff', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em',
            fontFamily: "'Cinzel',serif", cursor: saving ? 'wait' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          }}>
            {saving ? 'Сохраняем...' : <><Check size={13} /> Сохранить</>}
          </button>
        </div>
      </div>
    </div>
  );
}
