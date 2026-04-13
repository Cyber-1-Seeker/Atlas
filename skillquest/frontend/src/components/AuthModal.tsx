import React, { useState } from 'react';
import { authApi } from '../api/client';
import { useStore } from '../store/useStore';
import { X, Eye, EyeOff } from 'lucide-react';

const AVATARS = ['⚔','🧠','🎯','🔥','⚡','🏆','🌟','💀','🎨','🚀','🦾','🎭'];
const COLORS  = ['#7c3aed','#e8003d','#f59e0b','#10b981','#06b6d4','#ec4899','#6366f1','#f97316'];

interface Props { onClose: () => void; }

export default function AuthModal({ onClose }: Props) {
  const { setUser, completedNodes, completedTasks, loadServerProgress } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [avatar, setAvatar]     = useState('⚔');
  const [color, setColor]       = useState('#7c3aed');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading]   = useState(false);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  const parseErrors = (data: any) => {
    const out: Record<string, string> = {};
    if (typeof data === 'object') {
      Object.entries(data).forEach(([k, v]) => {
        out[k] = Array.isArray(v) ? (v[0] as string) : String(v);
      });
    } else {
      out.general = String(data);
    }
    return out;
  };

  const submit = async () => {
    setErrors({}); setLoading(true);
    try {
      let data: any;
      if (mode === 'register') {
        data = await authApi.register({ username, email, password, display_name: displayName });
        // Update avatar/color
        await authApi.updateMe({ avatar_emoji: avatar, accent_color: color });
        data.user.avatar_emoji = avatar;
        data.user.accent_color = color;
      } else {
        data = await authApi.login({ username, password });
      }

      localStorage.setItem('sq_access_token',  data.tokens.access);
      localStorage.setItem('sq_refresh_token', data.tokens.refresh);
      setUser(data.user);

      // Sync any offline progress to server
      const nodeIds = Array.from(completedNodes);
      const taskIds = Object.values(completedTasks).flatMap(s => Array.from(s));
      if (nodeIds.length > 0 || taskIds.length > 0) {
        await authApi.syncProgress({
          completed_checkpoints: nodeIds,
          completed_tasks: taskIds,
        }).catch(() => {});
      }

      // Load fresh server progress
      await loadServerProgress();
      onClose();
    } catch (e: any) {
      setErrors(parseErrors(e?.response?.data ?? 'Ошибка соединения'));
    } finally { setLoading(false); }
  };

  const inp: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)', borderRadius: 8,
    color: '#f0f0ff', fontFamily: "'Rajdhani',sans-serif",
    fontSize: 14, padding: '10px 12px', outline: 'none',
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 700,
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: "'Rajdhani',sans-serif", padding: 20,
    }}>
      <div style={{
        background: '#08080f', border: '1px solid rgba(255,255,255,0.12)',
        borderRadius: 18, width: '100%', maxWidth: 420,
        boxShadow: '0 40px 80px rgba(0,0,0,0.9)',
        overflow: 'hidden',
      }}>
        {/* Header */}
        <div style={{
          padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(232,0,61,0.06))',
        }}>
          <div>
            <div style={{ fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 900, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#f0f0ff' }}>
              {mode === 'login' ? 'Войти' : 'Создать аккаунт'}
            </div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 2 }}>
              {mode === 'login' ? 'Прогресс синхронизируется с сервером' : 'Присоединись к SkillQuest'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer' }}>
            <X size={18} />
          </button>
        </div>

        {/* Mode tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          {(['login', 'register'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setErrors({}); }} style={{
              flex: 1, padding: '11px', background: 'none', border: 'none',
              fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
              cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif",
              color: mode === m ? '#a855f7' : 'rgba(255,255,255,0.35)',
              borderBottom: mode === m ? '2px solid #a855f7' : '2px solid transparent',
            }}>{m === 'login' ? 'Войти' : 'Регистрация'}</button>
          ))}
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Avatar + color (register only) */}
          {mode === 'register' && (
            <div style={{
              background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
              borderRadius: 10, padding: '14px',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: `${color}25`, border: `2px solid ${color}55`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26,
                }}>{avatar}</div>
                <div>
                  <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Аватар</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                    {AVATARS.map(a => (
                      <button key={a} onClick={() => setAvatar(a)} style={{
                        width: 30, height: 30, borderRadius: 7, fontSize: 16, cursor: 'pointer',
                        background: avatar === a ? `${color}25` : 'rgba(255,255,255,0.03)',
                        border: `1.5px solid ${avatar === a ? color : 'rgba(255,255,255,0.08)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>{a}</button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 6 }}>Цвет акцента</div>
              <div style={{ display: 'flex', gap: 7 }}>
                {COLORS.map(c => (
                  <button key={c} onClick={() => setColor(c)} style={{
                    width: 24, height: 24, borderRadius: '50%', background: c, cursor: 'pointer',
                    border: `2.5px solid ${color === c ? '#fff' : 'transparent'}`,
                    boxShadow: color === c ? `0 0 8px ${c}` : 'none',
                  }} />
                ))}
              </div>
            </div>
          )}

          {mode === 'register' && (
            <Field label="Отображаемое имя" error={errors.display_name}>
              <input style={inp} placeholder="Как тебя зовут?" value={displayName} onChange={e => setDisplayName(e.target.value)} />
            </Field>
          )}

          <Field label="Имя пользователя" error={errors.username}>
            <input style={inp} placeholder="username" value={username}
              onChange={e => setUsername(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && submit()} autoFocus />
          </Field>

          {mode === 'register' && (
            <Field label="Email" error={errors.email}>
              <input style={inp} type="email" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
            </Field>
          )}

          <Field label="Пароль" error={errors.password}>
            <div style={{ position: 'relative' }}>
              <input style={{ ...inp, paddingRight: 40 }} type={showPass ? 'text' : 'password'}
                placeholder="••••••" value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && submit()} />
              <button onClick={() => setShowPass(v => !v)} style={{
                position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer',
              }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </Field>

          {errors.general && (
            <div style={{ padding: '8px 12px', background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.25)', borderRadius: 7, fontSize: 12, color: '#ff7070' }}>
              {errors.general}
            </div>
          )}

          <button onClick={submit} disabled={loading || !username || !password} style={{
            width: '100%', padding: '12px', borderRadius: 9, border: 'none',
            background: username && password ? 'linear-gradient(135deg,#7c3aed,#e8003d)' : 'rgba(255,255,255,0.05)',
            color: username && password ? '#fff' : 'rgba(255,255,255,0.25)',
            fontFamily: "'Cinzel',serif", fontSize: 12, fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: loading || !username || !password ? 'not-allowed' : 'pointer',
            boxShadow: username && password ? '0 4px 24px rgba(124,58,237,0.35)' : 'none',
            transition: 'all 0.2s',
          }}>
            {loading ? 'Загрузка...' : mode === 'login' ? 'Войти' : 'Создать аккаунт'}
          </button>

          <div style={{ textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>
            или{' '}
            <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(168,85,247,0.7)', cursor: 'pointer', fontSize: 11, fontFamily: "'Rajdhani',sans-serif" }}>
              продолжить без аккаунта
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <div style={{ fontSize: 9, fontWeight: 600, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>{label}</div>
      {children}
      {error && <div style={{ fontSize: 11, color: '#ff7070', marginTop: 4 }}>{error}</div>}
    </div>
  );
}
