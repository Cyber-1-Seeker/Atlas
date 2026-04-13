import React, { useEffect, useState, useCallback } from 'react';
import { groupsApi } from '../api/client';
import type { Group, GroupMember } from '../types';
import { useStore } from '../store/useStore';
import { getLevelInfo } from '../lib/levels';
import { X, Plus, Copy, Check, LogOut, Trash2, RefreshCw, Users, Crown, Zap, Flame } from 'lucide-react';

interface Props { onClose: () => void; }

const EMOJIS = ['⚔','🧠','🎯','🔥','⚡','🏆','🌟','💀','🎨','🚀','🦾','👑'];
const COLORS  = ['#7c3aed','#e8003d','#f59e0b','#10b981','#06b6d4','#ec4899','#6366f1'];

export default function GroupsPage({ onClose }: Props) {
  const { directions, user } = useStore();
  const [groups, setGroups] = useState<Group[]>([]);
  const [activeGroup, setActiveGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'list' | 'detail' | 'create' | 'join' | 'edit'>('list');
  const [editName, setEditName] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editEmoji, setEditEmoji] = useState('');
  const [editColor, setEditColor] = useState('');
  const [editDirId, setEditDirId] = useState('');
  const [editSaving, setEditSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Create form
  const [cName, setCName]   = useState('');
  const [cDesc, setCDesc]   = useState('');
  const [cEmoji, setCEmoji] = useState('⚔');
  const [cColor, setCColor] = useState('#7c3aed');
  const [cDirId, setCDirId] = useState('');
  const [cSaving, setCSaving] = useState(false);
  const [cError, setCError]   = useState('');

  // Join form
  const [joinCode, setJoinCode] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joinSaving, setJoinSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const data = await groupsApi.list();
      setGroups(data);
      // refresh active group if open
      if (activeGroup) {
        const fresh = data.find((g: Group) => g.id === activeGroup.id);
        if (fresh) setActiveGroup(fresh);
      }
    } catch {} finally { setLoading(false); }
  }, [activeGroup?.id]);

  useEffect(() => { load(); }, []);

  // Poll every 15s when viewing a group
  useEffect(() => {
    if (view !== 'detail' || !activeGroup) return;
    const t = setInterval(async () => {
      try {
        const fresh = await groupsApi.get(activeGroup.id);
        setActiveGroup(fresh);
      } catch {}
    }, 15000);
    return () => clearInterval(t);
  }, [view, activeGroup?.id]);

  const createGroup = async () => {
    if (!cName.trim()) { setCError('Введи название'); return; }
    setCSaving(true); setCError('');
    try {
      const g = await groupsApi.create({
        name: cName.trim(), description: cDesc,
        emoji: cEmoji, color_hex: cColor,
        direction_id: cDirId || undefined,
      });
      setGroups(prev => [g, ...prev]);
      setActiveGroup(g); setView('detail');
    } catch (e: any) {
      setCError(e?.response?.data?.error ?? 'Ошибка создания');
    } finally { setCSaving(false); }
  };

  const joinGroup = async () => {
    if (!joinCode.trim()) { setJoinError('Введи код'); return; }
    setJoinSaving(true); setJoinError('');
    try {
      const g = await groupsApi.join(joinCode.trim());
      setGroups(prev => [g, ...prev.filter(x => x.id !== g.id)]);
      setActiveGroup(g); setView('detail');
    } catch (e: any) {
      setJoinError(e?.response?.data?.error ?? 'Неверный код');
    } finally { setJoinSaving(false); }
  };

  const leaveGroup = async (id: string) => {
    if (!confirm('Покинуть группу?')) return;
    await groupsApi.leave(id);
    setGroups(prev => prev.filter(g => g.id !== id));
    setView('list'); setActiveGroup(null);
  };

  const deleteGroup = async (id: string) => {
    if (!confirm('Удалить группу? Это нельзя отменить.')) return;
    await groupsApi.delete(id);
    setGroups(prev => prev.filter(g => g.id !== id));
    setView('list'); setActiveGroup(null);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  const regenInvite = async (id: string) => {
    const { invite_code } = await groupsApi.regenerateInvite(id);
    setActiveGroup(prev => prev ? { ...prev, invite_code } : prev);
    setGroups(prev => prev.map(g => g.id === id ? { ...g, invite_code } : g));
  };

  const s = {
    inp: {
      width: '100%', background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
      color: '#f0f0ff', fontFamily: "'Rajdhani',sans-serif",
      fontSize: 13, padding: '9px 12px', outline: 'none',
    } as React.CSSProperties,
    lbl: {
      fontSize: 9, fontWeight: 600 as const, letterSpacing: '0.15em',
      textTransform: 'uppercase' as const, color: 'rgba(255,255,255,0.4)', marginBottom: 5, display: 'block',
    } as React.CSSProperties,
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 600,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(14px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani',sans-serif", padding: 20,
    }}>
      <div style={{
        background: '#08080f', border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 18, width: '100%', maxWidth: 640, maxHeight: '92vh',
        display: 'flex', flexDirection: 'column',
        boxShadow: '0 40px 80px rgba(0,0,0,0.9)', overflow: 'hidden',
      }}>

        {/* ── Header ── */}
        <div style={{
          padding: '18px 22px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg,rgba(124,58,237,0.1),rgba(232,0,61,0.05))',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {(view === 'detail' || view === 'create' || view === 'join') && (
              <button onClick={() => { setView('list'); setActiveGroup(null); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>‹</button>
            )}
            <div>
              <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f0f0ff' }}>
                {view === 'list' ? 'Группы' : view === 'create' ? 'Создать группу' : view === 'join' ? 'Вступить' : activeGroup?.name}
              </div>
              {view === 'list' && <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', marginTop: 1 }}>Соревнуйся с друзьями</div>}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {view === 'list' && (
              <>
                <Btn onClick={() => setView('join')} variant="ghost">+ Код</Btn>
                <Btn onClick={() => setView('create')} variant="primary">Создать</Btn>
              </>
            )}
            {view === 'detail' && activeGroup?.is_owner && (
              <Btn onClick={() => {
                setEditName(activeGroup.name); setEditDesc(activeGroup.description);
                setEditEmoji(activeGroup.emoji); setEditColor(activeGroup.color_hex);
                setEditDirId(activeGroup.direction?.id ?? '');
                setView('edit');
              }} variant="ghost">✎ Изменить</Btn>
            )}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}><X size={17} /></button>
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '18px 22px' }}>


          {/* EDIT */}
          {view === 'edit' && activeGroup && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: `${editColor}12`, border: `1px solid ${editColor}33` }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `${editColor}25`, border: `2px solid ${editColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{editEmoji}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f8' }}>{editName || 'Название'}</div>
              </div>
              <div><span style={s.lbl}>Название</span><input style={s.inp} value={editName} onChange={e => setEditName(e.target.value)} /></div>
              <div><span style={s.lbl}>Описание</span><input style={s.inp} value={editDesc} onChange={e => setEditDesc(e.target.value)} /></div>
              <div>
                <span style={s.lbl}>Эмодзи</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EMOJIS.map(e => <button key={e} onClick={() => setEditEmoji(e)} style={{ width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: 'pointer', background: editEmoji === e ? `${editColor}25` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${editEmoji === e ? editColor : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{e}</button>)}
                </div>
              </div>
              <div>
                <span style={s.lbl}>Цвет</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLORS.map(c => <button key={c} onClick={() => setEditColor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: `2.5px solid ${editColor === c ? '#fff' : 'transparent'}`, boxShadow: editColor === c ? `0 0 8px ${c}` : 'none' }} />)}
                </div>
              </div>
              <div>
                <span style={s.lbl}>Направление</span>
                <select style={{ ...s.inp, appearance: 'none' } as React.CSSProperties} value={editDirId} onChange={e => setEditDirId(e.target.value)}>
                  <option value="">— без направления —</option>
                  {directions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <button onClick={async () => {
                setEditSaving(true);
                try {
                  const updated = await groupsApi.update(activeGroup.id, { name: editName, description: editDesc, emoji: editEmoji, color_hex: editColor, direction_id: editDirId || null });
                  setActiveGroup(updated);
                  setGroups(prev => prev.map(g => g.id === updated.id ? updated : g));
                  setView('detail');
                } finally { setEditSaving(false); }
              }} disabled={editSaving || !editName.trim()} style={{
                padding: '12px', borderRadius: 9, border: 'none',
                background: editName.trim() ? `linear-gradient(135deg,${editColor},#e8003d)` : 'rgba(255,255,255,0.05)',
                color: editName.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.15em',
                cursor: editSaving || !editName.trim() ? 'not-allowed' : 'pointer',
              }}>{editSaving ? 'Сохраняем...' : 'Сохранить'}</button>
            </div>
          )}

          {/* LIST */}
          {view === 'list' && (
            loading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: 'rgba(255,255,255,0.3)', fontSize: 12 }}>Загрузка...</div>
            ) : groups.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>⚔</div>
                <div style={{ fontFamily: "'Cinzel',serif", fontSize: 13, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>Нет групп</div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.2)', marginBottom: 20 }}>Создай группу или вступи по коду приглашения</div>
                <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                  <Btn onClick={() => setView('create')} variant="primary">Создать группу</Btn>
                  <Btn onClick={() => setView('join')} variant="ghost">Вступить по коду</Btn>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {groups.map(g => (
                  <button key={g.id} onClick={() => { setActiveGroup(g); setView('detail'); }} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.background='rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.12)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.03)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.07)'; }}
                  >
                    <div style={{ width: 44, height: 44, borderRadius: 11, flexShrink: 0, background: `${g.color_hex}20`, border: `1.5px solid ${g.color_hex}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{g.emoji}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f8', marginBottom: 2 }}>{g.name}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)' }}><Users size={10} style={{ display: 'inline', marginRight: 3 }} />{g.member_count} участников</span>
                        {g.direction && <span style={{ fontSize: 10, color: g.direction.color_hex }}>· {g.direction.name}</span>}
                        {g.is_owner && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 8, background: 'rgba(245,158,11,0.15)', color: '#f59e0b', fontWeight: 700 }}>ВЛАДЕЛЕЦ</span>}
                      </div>
                    </div>
                    <div style={{ fontSize: 18, color: 'rgba(255,255,255,0.15)' }}>›</div>
                  </button>
                ))}
              </div>
            )
          )}

          {/* CREATE */}
          {view === 'create' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Preview */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10, background: `${cColor}12`, border: `1px solid ${cColor}33` }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: `${cColor}25`, border: `2px solid ${cColor}55`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>{cEmoji}</div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#e8e8f8' }}>{cName || 'Название группы'}</div>
                  {cDesc && <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 1 }}>{cDesc}</div>}
                </div>
              </div>

              <div><span style={s.lbl}>Название *</span><input style={s.inp} placeholder="Моя команда" value={cName} onChange={e => setCName(e.target.value)} autoFocus /></div>
              <div><span style={s.lbl}>Описание</span><input style={s.inp} placeholder="О чём ваша группа" value={cDesc} onChange={e => setCDesc(e.target.value)} /></div>

              <div>
                <span style={s.lbl}>Эмодзи группы</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {EMOJIS.map(e => <button key={e} onClick={() => setCEmoji(e)} style={{ width: 34, height: 34, borderRadius: 8, fontSize: 18, cursor: 'pointer', background: cEmoji === e ? `${cColor}25` : 'rgba(255,255,255,0.03)', border: `1.5px solid ${cEmoji === e ? cColor : 'rgba(255,255,255,0.08)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{e}</button>)}
                </div>
              </div>

              <div>
                <span style={s.lbl}>Цвет группы</span>
                <div style={{ display: 'flex', gap: 8 }}>
                  {COLORS.map(c => <button key={c} onClick={() => setCColor(c)} style={{ width: 26, height: 26, borderRadius: '50%', background: c, cursor: 'pointer', border: `2.5px solid ${cColor === c ? '#fff' : 'transparent'}`, boxShadow: cColor === c ? `0 0 8px ${c}` : 'none' }} />)}
                </div>
              </div>

              <div>
                <span style={s.lbl}>Направление (необязательно)</span>
                <select style={{ ...s.inp, appearance: 'none' } as React.CSSProperties} value={cDirId} onChange={e => setCDirId(e.target.value)}>
                  <option value="">— без направления —</option>
                  {directions.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 5 }}>Участники увидят общий прогресс по этому направлению</div>
              </div>

              {cError && <div style={{ padding: '8px 12px', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: 7, fontSize: 12, color: '#ff7070' }}>{cError}</div>}

              <button onClick={createGroup} disabled={cSaving || !cName.trim()} style={{
                padding: '12px', borderRadius: 9, border: 'none',
                background: cName.trim() ? `linear-gradient(135deg,${cColor},#e8003d)` : 'rgba(255,255,255,0.05)',
                color: cName.trim() ? '#fff' : 'rgba(255,255,255,0.25)',
                fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
                cursor: cSaving || !cName.trim() ? 'not-allowed' : 'pointer',
              }}>
                {cSaving ? 'Создаём...' : 'Создать группу'}
              </button>
            </div>
          )}

          {/* JOIN */}
          {view === 'join' && (
            <div style={{ maxWidth: 320, margin: '0 auto', paddingTop: 20 }}>
              <div style={{ textAlign: 'center', marginBottom: 24 }}>
                <div style={{ fontSize: 48, marginBottom: 8 }}>🔑</div>
                <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Попроси владельца группы поделиться кодом приглашения</div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <span style={s.lbl}>Код приглашения</span>
                <input style={{ ...s.inp, textTransform: 'uppercase', letterSpacing: '0.3em', fontSize: 18, textAlign: 'center' } as React.CSSProperties}
                  placeholder="ABCD1234" value={joinCode}
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  onKeyDown={e => e.key === 'Enter' && joinGroup()}
                  maxLength={8} autoFocus />
              </div>
              {joinError && <div style={{ padding: '8px 12px', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.2)', borderRadius: 7, fontSize: 12, color: '#ff7070', marginBottom: 12 }}>{joinError}</div>}
              <button onClick={joinGroup} disabled={joinSaving || joinCode.length < 4} style={{
                width: '100%', padding: '12px', borderRadius: 9, border: 'none',
                background: joinCode.length >= 4 ? 'linear-gradient(135deg,#7c3aed,#e8003d)' : 'rgba(255,255,255,0.05)',
                color: joinCode.length >= 4 ? '#fff' : 'rgba(255,255,255,0.25)',
                fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.15em',
                cursor: joinSaving || joinCode.length < 4 ? 'not-allowed' : 'pointer',
              }}>
                {joinSaving ? 'Вступаем...' : 'Вступить'}
              </button>
            </div>
          )}

          {/* DETAIL */}
          {view === 'detail' && activeGroup && (
            <div>
              {/* Group info */}
              <div style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>КОД ПРИГЛАШЕНИЯ</div>
                  <button onClick={() => regenInvite(activeGroup.id)} title="Сгенерировать новый код" style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', display: 'flex' }}>
                    <RefreshCw size={11} />
                  </button>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    flex: 1, padding: '10px 16px', borderRadius: 9,
                    background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
                    fontFamily: 'monospace', fontSize: 20, letterSpacing: '0.35em', color: '#e0e0f8', textAlign: 'center',
                  }}>{activeGroup.invite_code}</div>
                  <button onClick={() => copyCode(activeGroup.invite_code)} style={{
                    width: 40, height: 40, borderRadius: 9, cursor: 'pointer',
                    background: copied ? 'rgba(16,185,129,0.15)' : 'rgba(255,255,255,0.05)',
                    border: `1px solid ${copied ? 'rgba(16,185,129,0.4)' : 'rgba(255,255,255,0.12)'}`,
                    color: copied ? '#10b981' : 'rgba(255,255,255,0.5)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {copied ? <Check size={15} /> : <Copy size={15} />}
                  </button>
                </div>
                {activeGroup.direction && (
                  <div style={{ marginTop: 10, padding: '7px 12px', borderRadius: 7, background: `${activeGroup.direction.color_hex}12`, border: `1px solid ${activeGroup.direction.color_hex}25`, display: 'flex', alignItems: 'center', gap: 7 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: activeGroup.direction.color_hex }} />
                    <span style={{ fontSize: 11, color: activeGroup.direction.color_hex, fontWeight: 600 }}>Направление: {activeGroup.direction.name}</span>
                  </div>
                )}
              </div>

              {/* Leaderboard */}
              <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 12 }}>
                ТАБЛИЦА ЛИДЕРОВ · {activeGroup.member_count} участников
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {activeGroup.members.map(member => (
                  <MemberCard key={member.id} member={member} groupColor={activeGroup.color_hex} currentUserId={user?.id} />
                ))}
              </div>

              {/* Actions */}
              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                {activeGroup.is_owner ? (
                  <button onClick={() => deleteGroup(activeGroup.id)} style={{
                    flex: 1, padding: '9px', borderRadius: 7, cursor: 'pointer',
                    background: 'rgba(255,50,50,0.07)', border: '1px solid rgba(255,50,50,0.2)',
                    color: 'rgba(255,80,80,0.7)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><Trash2 size={13} /> Удалить группу</button>
                ) : (
                  <button onClick={() => leaveGroup(activeGroup.id)} style={{
                    flex: 1, padding: '9px', borderRadius: 7, cursor: 'pointer',
                    background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.09)',
                    color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: 600, letterSpacing: '0.08em',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}><LogOut size={13} /> Покинуть</button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Member card ────────────────────────────────────────────────────────────
function MemberCard({ member, groupColor, currentUserId }: { member: GroupMember; groupColor: string; currentUserId?: string }) {
  const isMe = member.id === currentUserId;
  const { current } = getLevelInfo(member.total_xp);
  const rankColors = ['#fbbf24', '#9ca3af', '#b45309', '#6b7280'];
  const rankColor = rankColors[Math.min(member.rank - 1, 3)];
  const dp = member.direction_progress;

  return (
    <div style={{
      padding: '12px 14px', borderRadius: 11,
      background: isMe ? `${groupColor}0e` : 'rgba(255,255,255,0.025)',
      border: `1px solid ${isMe ? groupColor + '35' : 'rgba(255,255,255,0.06)'}`,
      display: 'flex', alignItems: 'center', gap: 12,
    }}>
      {/* Rank */}
      <div style={{ width: 26, textAlign: 'center', flexShrink: 0 }}>
        {member.rank <= 3 ? (
          <span style={{ fontSize: 18 }}>{['🥇','🥈','🥉'][member.rank - 1]}</span>
        ) : (
          <span style={{ fontFamily: "'Cinzel',serif", fontSize: 11, fontWeight: 700, color: rankColor }}>#{member.rank}</span>
        )}
      </div>

      {/* Avatar */}
      <div style={{
        width: 38, height: 38, borderRadius: 10, flexShrink: 0,
        background: `${member.accent_color}22`, border: `1.5px solid ${member.accent_color}44`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
      }}>{member.avatar_emoji}</div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: isMe ? '#f0f0ff' : '#d0d0e8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.display_name}
          </span>
          {member.role === 'owner' && <Crown size={11} color="#f59e0b" />}
          {isMe && <span style={{ fontSize: 8, padding: '1px 5px', borderRadius: 8, background: `${groupColor}25`, color: groupColor, fontWeight: 700, letterSpacing: '0.08em' }}>ТЫ</span>}
          {member.streak > 0 && (
            <span style={{ fontSize: 9, color: '#fb923c', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Flame size={9} />{member.streak}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 9, color: current.color, fontWeight: 700, letterSpacing: '0.06em' }}>Lv.{current.level} {current.titleRu}</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.3)' }}>·</span>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.35)' }}>{member.completed_tasks} задан.</span>
        </div>
        {/* Direction progress bar */}
        {dp && dp.total_tasks > 0 && (
          <div style={{ marginTop: 5 }}>
            <div style={{ height: 2.5, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${dp.pct}%`, borderRadius: 2, background: `linear-gradient(90deg,${member.accent_color},${member.accent_color}aa)`, transition: 'width 0.6s ease' }} />
            </div>
          </div>
        )}
      </div>

      {/* XP */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700, color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 3 }}>
          <Zap size={10} color="#f59e0b" />{member.total_xp.toLocaleString('ru')}
        </div>
        {dp && <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.25)', marginTop: 1 }}>{dp.pct}% прогресс</div>}
      </div>
    </div>
  );
}

function Btn({ onClick, children, variant }: { onClick: () => void; children: React.ReactNode; variant: 'primary' | 'ghost' }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 14px', borderRadius: 7, cursor: 'pointer',
      background: variant === 'primary' ? 'linear-gradient(135deg,#7c3aed,#e8003d)' : 'rgba(255,255,255,0.05)',
      border: variant === 'primary' ? 'none' : '1px solid rgba(255,255,255,0.1)',
      color: variant === 'primary' ? '#fff' : 'rgba(255,255,255,0.6)',
      fontFamily: "'Rajdhani',sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    }}>{children}</button>
  );
}
