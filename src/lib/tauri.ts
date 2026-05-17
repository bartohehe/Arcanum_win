import { invoke } from '@tauri-apps/api/core';
import type {
  Character,
  Quest,
  CreateQuestPayload,
  ToggleQuestResult,
  Habit,
  CreateHabitPayload,
  ToggleHabitResult,
  HabitLogDay,
  LogLine,
  QuestBucket,
} from '../types';

export const getCharacter = () =>
  invoke<Character>('get_character');

export const updateName = (name: string) =>
  invoke<Character>('update_name', { name });

export const getQuests = (bucket: QuestBucket) =>
  invoke<Quest[]>('get_quests', { bucket });

export const createQuest = (payload: CreateQuestPayload) =>
  invoke<Quest>('create_quest', { payload });

export const toggleQuest = (questId: number) =>
  invoke<ToggleQuestResult>('toggle_quest', { questId });

export const deleteQuest = (questId: number) =>
  invoke<void>('delete_quest', { questId });

export const getHabits = () =>
  invoke<Habit[]>('get_habits');

export const createHabit = (payload: CreateHabitPayload) =>
  invoke<Habit>('create_habit', { payload });

export const toggleHabit = (habitId: number, date?: string) =>
  invoke<ToggleHabitResult>('toggle_habit', { habitId, date: date ?? null });

export const deleteHabit = (habitId: number) =>
  invoke<void>('delete_habit', { habitId });

export const getHabitLog = (days: number) =>
  invoke<HabitLogDay[]>('get_habit_log', { days });

export const getActivityLog = (limit: number) =>
  invoke<LogLine[]>('get_activity_log', { limit });

export const resetData = () =>
  invoke<void>('reset_data');

export const exportJson = () =>
  invoke<string>('export_json');
