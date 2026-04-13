import {create} from 'zustand/react';
import type {Node, Edge, Viewport} from '@xyflow/react';
import client from '../../api/client.ts';

export interface BoardMeta {
    id:         number;
    title:      string;
    created_at: string;
    updated_at: string;
}

interface BoardState {
    boards:       BoardMeta[];
    activeBoard:  BoardMeta | null;
    nodes:        Node[];
    edges:        Edge[];
    isLoading:    boolean;
    isSaving:     boolean;
    lastSaved:    Date | null;

    // Board list
    fetchBoards:  () => Promise<void>;
    createBoard:  (title?: string) => Promise<BoardMeta>;
    deleteBoard:  (id: number) => Promise<void>;
    renameBoard:  (id: number, title: string) => Promise<void>;

    // Active board
    openBoard:    (id: number) => Promise<void>;
    closeBoard:   () => void;

    // Canvas state (обновляется локально, сохраняется на сервер)
    setNodes:     (nodes: Node[]) => void;
    setEdges:     (edges: Edge[]) => void;
    saveBoard:    (viewport: Viewport) => Promise<void>;
}

export const useBoardStore = create<BoardState>((set, get) => ({
    boards:      [],
    activeBoard: null,
    nodes:       [],
    edges:       [],
    isLoading:   false,
    isSaving:    false,
    lastSaved:   null,

    fetchBoards: async () => {
        set({isLoading: true});
        try {
            const {data} = await client.get<BoardMeta[]>('/board/boards/');
            set({boards: data});
        } finally {
            set({isLoading: false});
        }
    },

    createBoard: async (title = 'Новая доска') => {
        const {data} = await client.post<BoardMeta>('/board/boards/', {title});
        set(s => ({boards: [data, ...s.boards]}));
        return data;
    },

    deleteBoard: async (id) => {
        await client.delete(`/board/boards/${id}/`);
        set(s => ({
            boards:      s.boards.filter(b => b.id !== id),
            activeBoard: s.activeBoard?.id === id ? null : s.activeBoard,
        }));
    },

    renameBoard: async (id, title) => {
        await client.patch(`/board/boards/${id}/`, {title});
        set(s => ({
            boards:      s.boards.map(b => b.id === id ? {...b, title} : b),
            activeBoard: s.activeBoard?.id === id ? {...s.activeBoard, title} : s.activeBoard,
        }));
    },

    openBoard: async (id) => {
        set({isLoading: true});
        try {
            const [metaRes, snapshotRes] = await Promise.all([
                client.get<BoardMeta>(`/board/boards/${id}/`),
                client.get<{nodes: Node[]; edges: Edge[]; viewport: Viewport}>(
                    `/board/boards/${id}/load/`
                ),
            ]);
            set({
                activeBoard: metaRes.data,
                nodes:       snapshotRes.data.nodes ?? [],
                edges:       snapshotRes.data.edges ?? [],
            });
        } finally {
            set({isLoading: false});
        }
    },

    closeBoard: () => set({activeBoard: null, nodes: [], edges: []}),

    setNodes: (nodes) => set({nodes}),
    setEdges: (edges) => set({edges}),

    saveBoard: async (viewport) => {
        const {activeBoard, nodes, edges} = get();
        if (!activeBoard) return;
        set({isSaving: true});
        try {
            await client.post(`/board/boards/${activeBoard.id}/save/`, {
                nodes, edges, viewport,
            });
            set({lastSaved: new Date()});
        } finally {
            set({isSaving: false});
        }
    },
}));
