export type ElementId = 'health' | 'finance' | 'habit' | 'learn' | 'work' | 'social';
export type StatAbbr = 'STR' | 'WIS' | 'CON' | 'INT' | 'DEX' | 'CHA';
export type QuestBucket = 'daily' | 'weekly' | 'epic';
export type Rarity = 'common' | 'rare' | 'epic' | 'legendary';

export interface Category {
  id: ElementId;
  element: string;
  rune: string;
  stat: StatAbbr;
  xp: number;
  level: number;
  xp_in_level: number;
  xp_to_next: number;
}

export interface Character {
  id: number;
  name: string;
  class: string;
  total_xp: number;
  level: number;
  xp_in_level: number;
  xp_to_next: number;
  categories: Category[];
}

export interface Quest {
  id: number;
  title: string;
  bucket: QuestBucket;
  cat_id: ElementId;
  xp_reward: number;
  rarity: Rarity;
  done: boolean;
  created_at: string;
}

export interface CreateQuestPayload {
  title: string;
  bucket: QuestBucket;
  cat_id: ElementId;
  xp_reward: number;
  rarity: Rarity;
}

export interface ToggleQuestResult {
  quest: Quest;
  xp_delta: number;
  category_after: Category;
  character_after: Character;
  level_up: boolean;
}

export interface Habit {
  id: number;
  name: string;
  cat_id: ElementId;
  xp_per_check: number;
  streak: number;
  logged_today: boolean;
}

export interface CreateHabitPayload {
  name: string;
  cat_id: ElementId;
  xp_per_check: number;
}

export interface ToggleHabitResult {
  habit: Habit;
  xp_delta: number;
  category_after: Category;
  character_after: Character;
}

export interface HabitLogDay {
  date: string;
  habit_ids: number[];
}

export interface LogLine {
  id: number;
  time: string;
  message: string;
  xp: number | null;
  source: 'quest' | 'habit' | 'system' | null;
}

export interface Toast {
  id: string;
  type: 'xp' | 'lvlup' | 'blocked' | 'penalty';
  message: string;
  xp?: number;
}

// ── Negative Habits (Shadow Habits) ─────────────────────────────────────────

export interface NegativeHabit {
  id: number;
  name: string;
  cat_id: ElementId;
  xp_block: number;
  penalty_xp: number;
  created_at: string;
}

export interface NegativeHabitWithStatus extends NegativeHabit {
  logged_today: boolean;
  bad_streak: number;
  penalty_active: boolean; // bad_streak >= 3
}

export interface CreateNegativeHabitPayload {
  name: string;
  cat_id: ElementId;
  xp_block: number;   // default 15
  penalty_xp: number; // default 30
}

export interface ToggleNegativeHabitResult {
  habit: NegativeHabitWithStatus;
  penalty_applied: boolean;
  bonus_blocked: boolean;
  bonus_unblocked: boolean;
  penalty_reversed: boolean;
  xp_delta: number;
  category_after: Category;
  character_after: Character;
}
