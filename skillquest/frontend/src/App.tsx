import React, { useEffect, useState, useCallback, useRef } from 'react';
import { directionsApi, branchesApi } from './api/client';
import { useStore } from './store/useStore';
import type { Checkpoint, DirectionList } from './types';
import SkillTree from './components/SkillTree';
import TaskPanel from './components/TaskPanel';
import Builder from './components/Builder';
import JsonImport from './components/JsonImport';
import DirectionPicker from './components/DirectionPicker';
import DirectionManager from './components/DirectionManager';
import { Plus, Upload, Download, Skull, Zap, GitBranch, Trash2, Settings, Edit2, Users } from 'lucide-react';
import BranchEditor from './components/BranchEditor';
import ProfilePage from './components/ProfilePage';
import AuthModal from './components/AuthModal';
import GroupsPage from './components/GroupsPage';
import { getStreak, recordActivity } from './lib/streak';
import { debounce } from './lib/debounce';
import XPBadge from './components/XPBadge';
import ToastSystem from './components/ToastSystem';

export default function App() {
  const {
    directions, setDirections,
    currentDirection, setCurrentDirection, refreshDirection,
    currentBranch, setCurrentBranch,
    hardcoreMode, toggleHardcore,
    selectedNodeId,
    totalXP,
    user, isLoggedIn, logout, setUser, loadServerProgress,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [showBuilder, setShowBuilder] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showDirManager, setShowDirManager] = useState(false);
  const [editingBranch, setEditingBranch] = useState<import('./types').Branch | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showAuth, setShowAuth] = useState(false);
  const [showGroups, setShowGroups] = useState(false);
  const [streak, setStreak] = React.useState(() => getStreak().streak);
  const completedTasksCount = useStore(s => Object.values(s.completedTasks).reduce((a, v) => a + v.size, 0));

  // ── silent refresh: reload direction data without touching UI state ────
  const _doRefresh = useCallback(async (dirId?: string) => {
    const id = dirId ?? currentDirection?.id;
    if (!id) return;
    const full = await directionsApi.get(id);
    refreshDirection(full);
  }, [currentDirection?.id, refreshDirection]);

  // Debounced: collapses rapid successive calls into one request
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const silentRefresh = useCallback(debounce(_doRefresh, 400), [_doRefresh]);

  // ── initial load ───────────────────────────────────────────────────────
  const loadDirections = useCallback(async (keepCurrent = false) => {
    try {
      const list: DirectionList[] = await directionsApi.list();
      setDirections(list);
      if (list.length > 0) {
        const targetId = keepCurrent && currentDirection ? currentDirection.id : list[0].id;
        const full = await directionsApi.get(targetId);
        if (keepCurrent) refreshDirection(full);
        else setCurrentDirection(full);
      } else {
        setCurrentDirection(null);
      }
    } finally { setLoading(false); }
  }, [currentDirection?.id]);

  // ── switch direction (hard reset, resets branch) ───────────────────────
  const switchDirection = useCallback(async (id: string) => {
    setLoading(true);
    hcInitRef.current = false; // reset so HC effect won't fire again on new direction
    try {
      const full = await directionsApi.get(id);
      setCurrentDirection(full);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    loadDirections();
    // Try to restore session from stored token
    const token = localStorage.getItem('sq_access_token');
    if (token && !isLoggedIn) {
      import('./api/client').then(({ authApi }) => {
        authApi.me().then(u => { setUser(u); }).catch(() => {
          localStorage.removeItem('sq_access_token');
          localStorage.removeItem('sq_refresh_token');
        });
      });
    }
  }, []);

  // Load server progress after direction loads when logged in
  useEffect(() => {
    if (isLoggedIn && currentDirection) loadServerProgress();
  }, [isLoggedIn, currentDirection?.id]);
  // Refresh streak whenever a task is completed (completedTasksCount changes)
  useEffect(() => { setStreak(getStreak().streak); }, [completedTasksCount]);

  // Auto-switch branch when hardcore toggles.
  // Guard: skip on mount. After that, run whenever hardcoreMode changes.
  const hcInitRef = useRef(false);
  useEffect(() => {
    // Skip the very first render — we don't want to switch on load
    if (!hcInitRef.current) { hcInitRef.current = true; return; }
    if (!currentDirection) return;

    const allBranches = currentDirection.branches;
    const normalBranches = allBranches.filter(b => !b.is_hardcore);
    const hcBranches = allBranches.filter(b => b.is_hardcore);

    if (hardcoreMode) {
      // We're switching INTO hardcore
      // 1. If current branch is normal and has a HC variant → switch to it
      if (currentBranch && !currentBranch.is_hardcore && currentBranch.hardcore_variant) {
        const hc = hcBranches.find(b => b.id === currentBranch!.hardcore_variant);
        if (hc) { setCurrentBranch(hc); return; }
      }
      // 2. We're already on a HC branch → stay
      if (currentBranch?.is_hardcore) return;
      // 3. No current branch or current has no HC variant →
      //    find any normal branch that has a HC variant and switch to that HC
      const normalWithHC = normalBranches.find(b => !!b.hardcore_variant);
      if (normalWithHC) {
        const hc = hcBranches.find(b => b.id === normalWithHC.hardcore_variant);
        if (hc) { setCurrentBranch(hc); return; }
      }
      // 4. Standalone HC branches (not linked to any normal) → pick first
      if (hcBranches.length > 0) setCurrentBranch(hcBranches[0]);
    } else {
      // We're switching OUT of hardcore
      // 1. If current branch is HC → find the normal branch that owns it
      if (currentBranch?.is_hardcore) {
        const owner = normalBranches.find(b => b.hardcore_variant === currentBranch!.id);
        if (owner) { setCurrentBranch(owner); return; }
        // No owner found → fall back to first normal branch
        if (normalBranches.length > 0) { setCurrentBranch(normalBranches[0]); return; }
      }
      // 2. Already on a normal branch → stay, nothing to do
    }
  }, [hardcoreMode]);

  // ── selected node (reads from current branch live) ────────────────────
  const selectedNode: Checkpoint | null =
    selectedNodeId && currentBranch
      ? currentBranch.checkpoints.find(c => c.id === selectedNodeId) ?? null
      : null;

  const handleExport = async () => {
    if (!currentDirection) return;
    const data = await directionsApi.export(currentDirection.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${currentDirection.slug}.json`;
    a.click();
  };

  const deleteBranch = async (branchId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Удалить ветку?')) return;
    await branchesApi.delete(branchId);
    if (currentDirection) await silentRefresh();
  };

  const regularBranches = currentDirection?.branches.filter(b => !b.is_hardcore) ?? [];
  const hardcoreBranches = currentDirection?.branches.filter(b => b.is_hardcore) ?? [];

  return (
    <div style={{
      position: 'fixed', inset: 0, background: '#060608',
      color: '#e8e8f0', fontFamily: "'Rajdhani', sans-serif",
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
    }}>
      {/* Grain */}
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9998, opacity: 0.35,
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.05'/%3E%3C/svg%3E")`,
      }} />
      <div style={{
        position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0,
        background: 'radial-gradient(ellipse 80% 50% at 50% 0%, rgba(124,58,237,0.09) 0%, transparent 70%)',
      }} />
      {/* Hardcore red overlay */}
      {hardcoreMode && (
        <div style={{
          position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 1,
          background: 'radial-gradient(ellipse 100% 100% at 50% 100%, rgba(180,0,0,0.12) 0%, transparent 60%)',
          boxShadow: 'inset 0 0 120px rgba(200,0,0,0.08)',
        }} />
      )}

      {/* ── NAVBAR ── */}
      <nav style={{
        height: 52, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 20px', borderBottom: '1px solid rgba(255,255,255,0.07)',
        background: 'rgba(6,6,8,0.95)', backdropFilter: 'blur(20px)',
        flexShrink: 0, zIndex: 100, position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            fontFamily: "'Cinzel',serif", fontSize: 15, fontWeight: 900, letterSpacing: '0.2em',
            textTransform: 'uppercase',
            background: 'linear-gradient(135deg,#e8003d,#7c3aed)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>SkillQuest</div>
          <div style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.1)' }} />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.15em', textTransform: 'uppercase' }}>
            Skill Tree
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <button onClick={toggleHardcore} style={{
            display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 5,
            background: hardcoreMode ? 'rgba(255,0,0,0.1)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${hardcoreMode ? 'rgba(255,0,0,0.4)' : 'rgba(255,255,255,0.09)'}`,
            color: hardcoreMode ? '#ff4040' : 'rgba(255,255,255,0.4)',
            fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase',
            cursor: 'pointer', transition: 'all 0.2s',
          }}>
            <Skull size={12} /> Hardcore {hardcoreMode ? 'ON' : 'OFF'}
          </button>

          <XPBadge xp={totalXP} />

          {/* Streak counter */}
          {streak > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '4px 9px', borderRadius: 5,
              background: 'rgba(251,146,60,0.08)', border: '1px solid rgba(251,146,60,0.2)',
              fontSize: 11, fontWeight: 700, color: '#fb923c',
            }}>
              🔥 {streak}
            </div>
          )}
          {/* Auth / Profile button */}
          {isLoggedIn && user ? (
            <button onClick={() => setShowProfile(true)} style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '4px 10px 4px 6px',
              borderRadius: 8, cursor: 'pointer', transition: 'all 0.15s',
              background: `${user.accent_color}18`,
              border: `1px solid ${user.accent_color}44`,
            }}
            onMouseEnter={e => e.currentTarget.style.background = `${user.accent_color}28`}
            onMouseLeave={e => e.currentTarget.style.background = `${user.accent_color}18`}
            title="Профиль">
              <div style={{
                width: 24, height: 24, borderRadius: 6, fontSize: 14,
                background: `${user.accent_color}30`, border: `1px solid ${user.accent_color}55`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>{user.avatar_emoji}</div>
              <span style={{ fontSize: 11, fontWeight: 600, color: user.accent_color, letterSpacing: '0.05em', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user.display_name || user.username}
              </span>
            </button>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px',
              borderRadius: 7, cursor: 'pointer', transition: 'all 0.15s',
              background: 'rgba(124,58,237,0.12)', border: '1px solid rgba(124,58,237,0.35)',
              color: '#a855f7', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
              fontFamily: "'Rajdhani',sans-serif",
            }}>
              ⚔ Войти
            </button>
          )}
          {isLoggedIn && (
            <NBtn icon={<Users size={13} />} label="Группы" onClick={() => setShowGroups(true)} />
          )}
          <NBtn icon={<Plus size={13} />} label="Ветка" onClick={() => setShowBuilder(true)} />
          <NBtn icon={<Upload size={13} />} label="AI Import" onClick={() => setShowImport(true)} />
          {currentDirection && <NBtn icon={<Download size={13} />} label="Export" onClick={handleExport} dim />}
          <NBtn icon={<Settings size={13} />} label="Направления" onClick={() => setShowDirManager(true)} />
        </div>
      </nav>

      {/* ── DIRECTION TABS ── */}
      <div style={{
        flexShrink: 0, zIndex: 90, position: 'relative',
        background: 'rgba(6,6,8,0.9)', backdropFilter: 'blur(10px)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
      }}>
        <DirectionPicker
          directions={directions}
          selected={currentDirection?.id ?? null}
          currentDirection={currentDirection}
          onSelect={switchDirection}
        />
      </div>

      {/* ── BRANCH TABS ── */}
      {currentDirection && (
        <div style={{
          flexShrink: 0, zIndex: 80, position: 'relative',
          display: 'flex', alignItems: 'center', gap: 5, padding: '7px 16px',
          background: 'rgba(0,0,0,0.35)', borderBottom: '1px solid rgba(255,255,255,0.04)',
          overflowX: 'auto',
        }}>
          {/* Only show normal branches — HC branches are accessed via HC toggle */}
          {regularBranches.map(branch => {
            const active = currentBranch?.id === branch.id ||
              (hardcoreMode && hardcoreBranches.some(hc => hc.id === currentBranch?.id && regularBranches.some(nb => nb.hardcore_variant === hc.id && nb.id === branch.id)));
            const isShowingHC = hardcoreMode && branch.hardcore_variant &&
              currentBranch?.id === branch.hardcore_variant;
            const hasHC = !!branch.hardcore_variant;
            const effectiveActive = active || isShowingHC;
            const displayBranch = (hardcoreMode && branch.hardcore_variant)
              ? (hardcoreBranches.find(h => h.id === branch.hardcore_variant) ?? branch)
              : branch;
            const isHCActive = isShowingHC || (hardcoreMode && branch.hardcore_variant && currentBranch?.id === branch.hardcore_variant);
            return (
              <div key={branch.id} style={{ display: 'flex', alignItems: 'center', flexShrink: 0, position: 'relative' }}>
                {/* Tiny red dot if branch has HC variant */}
                {hasHC && !hardcoreMode && (
                  <div style={{
                    position: 'absolute', top: -2, right: effectiveActive ? 58 : 2, zIndex: 5,
                    width: 5, height: 5, borderRadius: '50%',
                    background: '#ff2020', boxShadow: '0 0 4px #ff2020',
                  }} />
                )}
                <button onClick={() => {
                  if (hardcoreMode && branch.hardcore_variant) {
                    const hc = hardcoreBranches.find(h => h.id === branch.hardcore_variant);
                    if (hc) { setCurrentBranch(hc); return; }
                  }
                  setCurrentBranch(branch);
                }} style={{
                  padding: '5px 13px', borderRadius: effectiveActive ? '5px 0 0 5px' : 5,
                  background: isHCActive ? 'rgba(255,0,0,0.12)' : effectiveActive ? `${branch.color_hex}20` : 'transparent',
                  border: `1px solid ${isHCActive ? 'rgba(255,0,0,0.5)' : effectiveActive ? branch.color_hex + '66' : 'rgba(255,255,255,0.1)'}`,
                  borderRight: effectiveActive ? 'none' : undefined,
                  color: isHCActive ? '#ff5050' : effectiveActive ? branch.color_hex : 'rgba(255,255,255,0.5)',
                  fontSize: 10, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase',
                  cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif",
                  boxShadow: isHCActive ? '0 0 12px rgba(255,0,0,0.2)' : effectiveActive ? `0 0 10px ${branch.color_hex}25` : 'none',
                }}>
                  {isHCActive && <span style={{ marginRight: 4, fontSize: 9 }}>☠</span>}
                  {branch.title}
                </button>
                {effectiveActive && (
                  <>
                    <button onClick={() => setEditingBranch(isHCActive ? displayBranch : branch)} style={{
                      padding: '5px 6px',
                      background: isHCActive ? 'rgba(255,0,0,0.08)' : `${branch.color_hex}10`,
                      border: `1px solid ${isHCActive ? 'rgba(255,0,0,0.4)' : branch.color_hex + '55'}`, borderLeft: 'none', borderRight: 'none',
                      color: isHCActive ? 'rgba(255,60,60,0.7)' : `${branch.color_hex}99`, cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}><Edit2 size={10} /></button>
                    <button onClick={e => deleteBranch(isHCActive ? displayBranch.id : branch.id, e)} style={{
                      padding: '5px 6px', borderRadius: '0 5px 5px 0',
                      background: isHCActive ? 'rgba(255,0,0,0.08)' : `${branch.color_hex}10`,
                      border: `1px solid ${isHCActive ? 'rgba(255,0,0,0.4)' : branch.color_hex + '55'}`, borderLeft: 'none',
                      color: isHCActive ? 'rgba(255,60,60,0.7)' : `${branch.color_hex}99`, cursor: 'pointer', display: 'flex', alignItems: 'center',
                    }}><Trash2 size={10} /></button>
                  </>
                )}
              </div>
            );
          })}

          <button onClick={() => setShowBuilder(true)} style={{
            marginLeft: 'auto', padding: '4px 9px', borderRadius: 5, flexShrink: 0,
            background: 'transparent', border: '1px dashed rgba(255,255,255,0.1)',
            color: 'rgba(255,255,255,0.35)', fontSize: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 3, fontFamily: "'Rajdhani',sans-serif",
          }}><Plus size={11} /> Ветка</button>
        </div>
      )}

      {/* ── CANVAS ── */}
      <div style={{ flex: 1, position: 'relative', overflow: 'hidden', zIndex: 1 }}>
        {loading ? (
          <Center><LoadingSpinner /><Muted>Загрузка...</Muted></Center>
        ) : !currentDirection ? (
          <EmptyState onImport={() => setShowImport(true)} onCreate={() => setShowDirManager(true)} />
        ) : !currentBranch ? (
          <Center>
            <GitBranch size={36} color="rgba(255,255,255,0.08)" />
            <Muted>Нет веток</Muted>
            <SmallBtn onClick={() => setShowBuilder(true)}>Создать ветку</SmallBtn>
          </Center>
        ) : (
          <>
            <SkillTree
              branch={currentBranch}
              onChanged={() => silentRefresh()}
            />
            <TaskPanel
              checkpoint={selectedNode}
              onTaskAdded={() => silentRefresh()}
            />
          </>
        )}
      </div>

      {/* ── MODALS ── */}
      {showBuilder && currentDirection && (
        <Builder
          directionId={currentDirection.id}
          existingBranches={currentDirection.branches}
          onSaved={async (newBranch) => {
            setShowBuilder(false);
            // Reload direction data, then switch to the newly created branch
            const full = await directionsApi.get(currentDirection.id);
            refreshDirection(full);
            // Find the fresh branch by id and activate it
            const fresh = full.branches.find((b: any) => b.id === newBranch.id);
            if (fresh) setCurrentBranch(fresh);
          }}
          onClose={() => setShowBuilder(false)}
        />
      )}
      {showImport && (
        <JsonImport
          onImported={async () => { setShowImport(false); await loadDirections(true); }}
          onClose={() => setShowImport(false)}
        />
      )}
      {showDirManager && (
        <DirectionManager
          directions={directions}
          onClose={() => setShowDirManager(false)}
          onChanged={() => loadDirections(false)}
        />
      )}
      <ToastSystem />
      {showProfile && <ProfilePage onClose={() => setShowProfile(false)} onLogout={() => { logout(); setShowProfile(false); }} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />
      }
      {showGroups && <GroupsPage onClose={() => setShowGroups(false)} />}
      {editingBranch && (
        <BranchEditor
          branch={editingBranch}
          onSaved={async () => { setEditingBranch(null); await silentRefresh(); }}
          onClose={() => setEditingBranch(null)}
        />
      )}
    </div>
  );
}

// ── Small helpers ──────────────────────────────────────────────────────────
function NBtn({ icon, label, onClick, dim }: { icon: React.ReactNode; label: string; onClick: () => void; dim?: boolean }) {
  return (
    <button onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 4, padding: '5px 9px', borderRadius: 5,
      background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
      color: dim ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)',
      fontSize: 10, fontWeight: 600, letterSpacing: '0.07em',
      cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", transition: 'border-color 0.15s',
    }}
    onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'}
    onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
    >{icon}{label}</button>
  );
}

function Center({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
      {children}
    </div>
  );
}
function Muted({ children }: { children: React.ReactNode }) {
  return <div style={{ fontFamily: "'Cinzel',serif", fontSize: 11, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.2)', textTransform: 'uppercase' }}>{children}</div>;
}
function SmallBtn({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} style={{
      padding: '7px 18px', borderRadius: 7, border: '1px solid rgba(124,58,237,0.4)',
      background: 'rgba(124,58,237,0.1)', color: '#a855f7', fontSize: 11, fontWeight: 600,
      cursor: 'pointer', fontFamily: "'Rajdhani',sans-serif", letterSpacing: '0.1em',
    }}>{children}</button>
  );
}

function LoadingSpinner() {
  return (
    <svg viewBox="0 0 32 32" width={28} height={28} style={{ animation: 'spin 1.2s linear infinite' }}>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
      <circle cx={16} cy={16} r={12} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={2} />
      <path d="M16 4 A12 12 0 0 1 28 16" fill="none" stroke="#7c3aed" strokeWidth={2} strokeLinecap="round" />
    </svg>
  );
}

function EmptyState({ onImport, onCreate }: { onImport: () => void; onCreate: () => void }) {
  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 18 }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontFamily: "'Cinzel',serif", fontSize: 24, fontWeight: 900, letterSpacing: '0.1em',
          textTransform: 'uppercase', marginBottom: 8,
          background: 'linear-gradient(135deg,#e8003d,#7c3aed)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
        }}>Древо пусто</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', maxWidth: 340 }}>
          Создай направление и первую ветку — вручную или через ИИ
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onCreate} style={{
          padding: '10px 20px', borderRadius: 7, border: '1px solid rgba(124,58,237,0.45)',
          background: 'rgba(124,58,237,0.1)', color: '#a855f7',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', fontFamily: "'Cinzel',serif", cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7,
        }}><Plus size={14} /> Создать направление</button>
        <button onClick={onImport} style={{
          padding: '10px 20px', borderRadius: 7,
          background: 'linear-gradient(135deg,rgba(124,58,237,0.25),rgba(232,0,61,0.15))',
          border: '1px solid rgba(124,58,237,0.45)', color: '#e0e0f0',
          fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', fontFamily: "'Cinzel',serif", cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 7,
        }}><Zap size={14} /> AI · Импорт</button>
      </div>
    </div>
  );
}
