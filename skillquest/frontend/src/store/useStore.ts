import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Direction, DirectionList, Branch } from '../types';
import { authApi } from '../api/client';

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  display_name: string;
  avatar_emoji: string;
  accent_color: string;
  streak: number;
  last_activity_date: string | null;
  total_xp: number;
  completed_checkpoints: number;
  completed_tasks_count: number;
}

interface AppState {
  // Auth
  user: UserProfile | null;
  isLoggedIn: boolean;
  setUser: (user: UserProfile | null) => void;
  logout: () => void;

  // Data
  directions: DirectionList[];
  currentDirection: Direction | null;
  currentBranch: Branch | null;
  hardcoreMode: boolean;
  selectedNodeId: string | null;
  panelOpen: boolean;

  // Progress — local cache (source of truth = server when logged in)
  totalXP: number;
  completedNodes: Set<string>;
  completedTasks: Record<string, Set<string>>;

  setDirections: (dirs: DirectionList[]) => void;
  setCurrentDirection: (dir: Direction | null) => void;
  refreshDirection: (dir: Direction) => void;
  setCurrentBranch: (branch: Branch | null) => void;
  toggleHardcore: () => void;
  selectNode: (id: string | null) => void;
  setPanelOpen: (open: boolean) => void;

  // Progress actions — call API if logged in, else local only
  completeNode:   (nodeId: string, xp: number) => void;
  completeTask:   (nodeId: string, taskId: string, xp: number) => void;
  uncompleteTask: (nodeId: string, taskId: string, xp: number) => void;
  isNodeComplete:  (id: string) => boolean;
  isTaskComplete:  (nodeId: string, taskId: string) => boolean;

  // Load server progress into local cache
  loadServerProgress: () => Promise<void>;
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoggedIn: false,

      setUser: (user) => set({ user, isLoggedIn: !!user }),
      logout: () => {
        localStorage.removeItem('sq_access_token');
        localStorage.removeItem('sq_refresh_token');
        set({ user: null, isLoggedIn: false });
      },

      directions: [],
      currentDirection: null,
      currentBranch: null,
      hardcoreMode: false,
      selectedNodeId: null,
      panelOpen: false,
      totalXP: 0,
      completedNodes: new Set(),
      completedTasks: {},

      setDirections: (dirs) => set({ directions: dirs }),

      setCurrentDirection: (dir) => set({
        currentDirection: dir,
        currentBranch: dir?.branches?.[0] ?? null,
      }),

      refreshDirection: (dir) => set(s => {
        const prevId = s.currentBranch?.id;
        const fresh = prevId
          ? (dir.branches.find(b => b.id === prevId) ?? dir.branches[0] ?? null)
          : (dir.branches[0] ?? null);
        const prevNodeId = s.selectedNodeId;
        const nodeOk = prevNodeId ? fresh?.checkpoints.some(c => c.id === prevNodeId) : false;
        return {
          currentDirection: dir,
          currentBranch: fresh,
          selectedNodeId: nodeOk ? prevNodeId : s.selectedNodeId,
        };
      }),

      setCurrentBranch: (branch) => set({ currentBranch: branch }),
      toggleHardcore: () => set(s => ({ hardcoreMode: !s.hardcoreMode })),
      selectNode: (id) => set({ selectedNodeId: id, panelOpen: !!id }),
      setPanelOpen: (open) => set({ panelOpen: open }),

      completeNode: (nodeId, xp) => {
        const s = get();
        if (s.completedNodes.has(nodeId)) return;
        const nodes = new Set(s.completedNodes);
        nodes.add(nodeId);
        set({ completedNodes: nodes, totalXP: s.totalXP + xp });
        if (s.isLoggedIn) {
          authApi.completeCheckpoint(nodeId).catch(() => {});
        }
      },

      completeTask: (nodeId, taskId, xp) => {
        const s = get();
        const tasks = { ...s.completedTasks };
        const nodeSet = new Set(tasks[nodeId] ?? []);
        if (nodeSet.has(taskId)) return;
        nodeSet.add(taskId);
        tasks[nodeId] = nodeSet;
        set({ completedTasks: tasks, totalXP: s.totalXP + xp });
        if (s.isLoggedIn) {
          authApi.completeTask(taskId).catch(() => {});
        }
      },

      uncompleteTask: (nodeId, taskId, xp) => {
        const s = get();
        const tasks = { ...s.completedTasks };
        const nodeSet = new Set(tasks[nodeId] ?? []);
        if (!nodeSet.has(taskId)) return;
        nodeSet.delete(taskId);
        tasks[nodeId] = nodeSet;
        set({ completedTasks: tasks, totalXP: Math.max(0, s.totalXP - xp) });
        if (s.isLoggedIn) {
          authApi.completeTask(taskId, true).catch(() => {});
        }
      },

      isNodeComplete:  (id) => get().completedNodes.has(id),
      isTaskComplete:  (nodeId, taskId) => get().completedTasks[nodeId]?.has(taskId) ?? false,

      loadServerProgress: async () => {
        try {
          const { completed_checkpoints, completed_tasks } = await authApi.getProgress();
          // Rebuild local state from server data
          // We need to compute XP from the actual checkpoint/task objects
          // For now rebuild sets; XP is computed from user.total_xp
          const nodes = new Set<string>(completed_checkpoints as string[]);
          const tasksMap: Record<string, Set<string>> = {};
          // Group tasks by checkpoint — we'll do a best-effort mapping
          // The server returns task IDs; we match them to local branch data
          const dir = get().currentDirection;
          if (dir) {
            dir.branches.forEach(b => b.checkpoints.forEach(cp => {
              const cpTasks = (completed_tasks as string[]).filter(tid =>
                cp.tasks.some(t => t.id === tid)
              );
              if (cpTasks.length > 0) {
                tasksMap[cp.id] = new Set(cpTasks);
              }
            }));
          }
          // Also load fresh user for XP
          const userFresh = await authApi.me();
          set({
            completedNodes: nodes,
            completedTasks: tasksMap,
            totalXP: userFresh.total_xp,
            user: userFresh,
          });
        } catch (e) {
          console.warn('Could not load server progress:', e);
        }
      },
    }),
    {
      name: 'skillquest-v4',
      partialize: (s) => ({
        hardcoreMode: s.hardcoreMode,
        // Guest progress only — logged in users use server
        totalXP: s.isLoggedIn ? 0 : s.totalXP,
        completedNodes: s.isLoggedIn ? [] : Array.from(s.completedNodes),
        completedTasks: s.isLoggedIn ? {} : Object.fromEntries(
          Object.entries(s.completedTasks).map(([k, v]) => [k, Array.from(v)])
        ),
      }),
      merge: (persisted: any, current) => ({
        ...current,
        hardcoreMode: persisted.hardcoreMode ?? false,
        totalXP: persisted.totalXP ?? 0,
        completedNodes: new Set(persisted.completedNodes ?? []),
        completedTasks: Object.fromEntries(
          Object.entries(persisted.completedTasks ?? {}).map(([k, v]) => [k, new Set(v as string[])])
        ),
      }),
    }
  )
);
