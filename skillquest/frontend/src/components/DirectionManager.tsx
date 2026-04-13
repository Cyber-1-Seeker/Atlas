import React, { useState } from 'react';
import { directionsApi } from '../api/client';
import type { DirectionList } from '../types';
import { X, Plus, Trash2, Check } from 'lucide-react';

interface Props {
  directions: DirectionList[];
  onClose: () => void;
  onChanged: () => void;
}

const ICONS = [
  { key: 'code',    emoji: '💻' },
  { key: 'palette', emoji: '🎨' },
  { key: 'globe',   emoji: '🌐' },
  { key: 'brain',   emoji: '🧠' },
  { key: 'trophy',  emoji: '🏆' },
  { key: 'star',    emoji: '⭐' },
  { key: 'target',  emoji: '🎯' },
  { key: 'cpu',     emoji: '⚙️' },
  { key: 'bolt',    emoji: '⚡' },
  { key: 'book',    emoji: '📖' },
  { key: 'music',   emoji: '🎵' },
  { key: 'camera',  emoji: '📷' },
  { key: 'fire',    emoji: '🔥' },
];

const COLORS = [
  '#e8003d','#7c3aed','#f59e0b','#06b6d4',
  '#10b981','#f97316','#ec4899','#6366f1',
];

const s = {
  inp: {
    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 6, color: '#e0e0f0', fontFamily: "'Rajdhani',sans-serif",
    fontSize: 13, padding: '7px 10px', width: '100%', outline: 'none',
  } as React.CSSProperties,
  label: {
    fontSize: 10, fontWeight: 600 as const, letterSpacing: '0.15em', textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.35)', marginBottom: 5, display: 'block',
  } as React.CSSProperties,
};

export default function DirectionManager({ directions, onClose, onChanged }: Props) {
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState('star');
  const [color, setColor] = useState('#7c3aed');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const autoSlug = (v: string) => v.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

  const handleNameChange = (v: string) => {
    setName(v);
    setSlug(autoSlug(v));
  };

  const create = async () => {
    if (!name.trim() || !slug.trim()) { setError('Заполните название'); return; }
    setSaving(true); setError('');
    try {
      await directionsApi.create({ name, slug, description: desc, icon_type: icon, color_hex: color, is_active: true, order: directions.length });
      setName(''); setSlug(''); setDesc('');
      onChanged();
    } catch (e: any) {
      setError(e?.response?.data?.slug?.[0] ?? JSON.stringify(e?.response?.data ?? 'Ошибка'));
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    setDeleting(id);
    try { await directionsApi.delete(id); onChanged(); }
    finally { setDeleting(null); setConfirmDelete(null); }
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 400, background: 'rgba(0,0,0,0.75)',
      backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani',sans-serif", padding: 20,
    }}>
      <div style={{
        background: '#08080f', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 16,
        width: '100%', maxWidth: 540, maxHeight: '88vh', display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 80px rgba(0,0,0,0.9)', position: 'relative', overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{ padding: '16px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#e8e8f0' }}>
            Управление направлениями
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>

          {/* Existing directions */}
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 10 }}>
            СУЩЕСТВУЮЩИЕ ({directions.length})
          </div>
          {directions.map(dir => (
            <div key={dir.id} style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '9px 12px', borderRadius: 8, marginBottom: 6,
              background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6, flexShrink: 0,
                background: `${dir.color_hex}20`, border: `1px solid ${dir.color_hex}50`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14,
              }}>
                {ICONS.find(i => i.key === dir.icon_type)?.emoji ?? '⭐'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#d0d0e0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{dir.name}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{dir.branch_count} веток · /{dir.slug}</div>
              </div>
              <button
                onClick={() => setConfirmDelete(dir.id)}
                disabled={deleting === dir.id}
                style={{
                  background: 'none', border: '1px solid rgba(255,100,100,0.2)', borderRadius: 5,
                  color: 'rgba(255,100,100,0.5)', cursor: 'pointer', padding: '4px 6px',
                  display: 'flex', alignItems: 'center',
                }}>
                <Trash2 size={12} />
              </button>
            </div>
          ))}

          {/* Divider */}
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '18px 0 16px' }} />

          {/* Create new */}
          <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 14 }}>
            ДОБАВИТЬ НАПРАВЛЕНИЕ
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ gridColumn: '1/-1' }}>
              <span style={s.label}>Название *</span>
              <input style={s.inp} placeholder="Напр.: Tech & Design" value={name} onChange={e => handleNameChange(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <span style={s.label}>Slug (автозаполнение)</span>
              <input style={s.inp} placeholder="tech-design" value={slug} onChange={e => setSlug(e.target.value)} />
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <span style={s.label}>Описание</span>
              <input style={s.inp} placeholder="Короткое описание" value={desc} onChange={e => setDesc(e.target.value)} />
            </div>

            {/* Icon picker */}
            <div style={{ gridColumn: '1/-1' }}>
              <span style={s.label}>Иконка</span>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {ICONS.map(ic => (
                  <button key={ic.key} onClick={() => setIcon(ic.key)} style={{
                    width: 36, height: 36, borderRadius: 7, fontSize: 18,
                    background: icon === ic.key ? `${color}25` : 'rgba(255,255,255,0.03)',
                    border: `1.5px solid ${icon === ic.key ? color : 'rgba(255,255,255,0.08)'}`,
                    cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    position: 'relative',
                  }}>
                    {ic.emoji}
                    {icon === ic.key && (
                      <div style={{ position: 'absolute', top: 1, right: 1 }}>
                        <Check size={8} color={color} />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Color picker */}
            <div style={{ gridColumn: '1/-1' }}>
              <span style={s.label}>Цвет акцента</span>
              <div style={{ display: 'flex', gap: 7 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{
                    width: 26, height: 26, borderRadius: '50%', background: c,
                    border: `2.5px solid ${color === c ? '#fff' : 'transparent'}`,
                    cursor: 'pointer', boxShadow: color === c ? `0 0 8px ${c}` : 'none',
                  }} />
                ))}
              </div>
            </div>
          </div>

          {error && (
            <div style={{ marginTop: 12, padding: '7px 12px', background: 'rgba(255,0,0,0.08)', border: '1px solid rgba(255,0,0,0.25)', borderRadius: 6, fontSize: 12, color: '#ff6060' }}>
              {error}
            </div>
          )}
        </div>

        {/* Custom confirm dialog */}
        {confirmDelete && (
          <div style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 16, zIndex: 10,
          }}>
            <div style={{ background: '#0d0d18', border: '1px solid rgba(255,80,80,0.3)', borderRadius: 12, padding: '20px 24px', maxWidth: 280, textAlign: 'center' }}>
              <div style={{ fontSize: 28, marginBottom: 10 }}>⚠️</div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#ff7070', marginBottom: 8 }}>
                Удалить направление?
              </div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginBottom: 16, lineHeight: 1.5 }}>
                Все ветки и задания будут удалены безвозвратно.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setConfirmDelete(null)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.1)', background: 'transparent', color: 'rgba(255,255,255,0.5)', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>
                  Отмена
                </button>
                <button onClick={() => remove(confirmDelete)} style={{ flex: 1, padding: '8px', borderRadius: 6, border: 'none', background: 'rgba(220,40,40,0.8)', color: '#fff', fontSize: 11, fontWeight: 700, cursor: 'pointer', letterSpacing: '0.05em' }}>
                  Удалить
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '12px 22px', borderTop: '1px solid rgba(255,255,255,0.07)', display: 'flex', gap: 8 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: '9px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.09)',
            background: 'transparent', color: 'rgba(255,255,255,0.45)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
          }}>Закрыть</button>
          <button onClick={create} disabled={saving || !name.trim()} style={{
            flex: 2, padding: '9px', borderRadius: 7, border: 'none',
            background: name.trim() ? 'linear-gradient(135deg,#7c3aed,#e8003d)' : 'rgba(255,255,255,0.05)',
            color: name.trim() ? '#fff' : 'rgba(255,255,255,0.3)', fontSize: 12, fontWeight: 700,
            letterSpacing: '0.1em', fontFamily: "'Cinzel',serif", cursor: saving || !name.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
          }}>
            {saving ? 'Создаём...' : <><Plus size={13} /> Создать</>}
          </button>
        </div>
      </div>
    </div>
  );
}
