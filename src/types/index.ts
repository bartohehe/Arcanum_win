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
  type: 'xp' | 'lvlup';
  message: string;
  xp?: number;
}
