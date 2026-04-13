export interface Task {
  id: string;
  checkpoint: string;
  title: string;
  content_md: string;
  xp_reward: number;
  difficulty_rating: 1 | 2 | 3;
  order: number;
  hardcore_xp_multiplier: number;
  hardcore_description: string;
}

export interface Checkpoint {
  id: string;
  branch: string;
  title: string;
  description: string;
  icon_type: string;
  xp_reward: number;
  order: number;
  pos_x: number;
  pos_y: number;
  prerequisites: string[];
  prerequisites_ids: string[];
  achievement_name: string;
  achievement_description: string;
  achievement_icon: string;
  tasks: Task[];
}

export interface Branch {
  id: string;
  direction: string;
  title: string;
  description: string;
  color_hex: string;
  order: number;
  is_hardcore: boolean;
  hardcore_variant: string | null;
  checkpoints: Checkpoint[];
}

export interface Direction {
  id: string;
  name: string;
  slug: string;
  icon_type: string;
  description: string;
  color_hex: string;
  is_active: boolean;
  order: number;
  branches: Branch[];
}

export interface DirectionList {
  id: string;
  name: string;
  slug: string;
  icon_type: string;
  description: string;
  color_hex: string;
  is_active: boolean;
  order: number;
  branch_count: number;
}

export type NodeState = 'locked' | 'available' | 'completed';

// ── Groups ────────────────────────────────────────────────────────────────

export interface DirectionProgress {
  done_checkpoints: number;
  total_checkpoints: number;
  done_tasks: number;
  total_tasks: number;
  pct: number;
}

export interface GroupMember {
  id: string;
  username: string;
  display_name: string;
  avatar_emoji: string;
  accent_color: string;
  streak: number;
  role: 'owner' | 'member';
  joined_at: string;
  total_xp: number;
  completed_checkpoints: number;
  completed_tasks: number;
  rank: number;
  direction_progress: DirectionProgress | null;
}

export interface Group {
  id: string;
  name: string;
  description: string;
  emoji: string;
  color_hex: string;
  invite_code: string;
  owner_id: string;
  direction: { id: string; name: string; color_hex: string; icon_type: string } | null;
  member_count: number;
  members: GroupMember[];
  created_at: string;
  is_owner: boolean;
}
