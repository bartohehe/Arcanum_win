import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getNegativeHabits,
  createNegativeHabit,
  toggleNegativeHabit,
  deleteNegativeHabit,
  getBlockedCats,
} from '../lib/tauri';
import { useUiStore } from '../store/uiStore';
import type { CreateNegativeHabitPayload } from '../types';

export function useNegativeHabits() {
  return useQuery({ queryKey: ['negative_habits'], queryFn: getNegativeHabits });
}

export function useBlockedCats() {
  return useQuery({
    queryKey: ['blocked_cats'],
    queryFn: () => getBlockedCats(),
    // Refetch often — shadow block state changes when habits are toggled
    staleTime: 0,
  });
}

export function useCreateNegativeHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNegativeHabitPayload) => createNegativeHabit(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['negative_habits'] });
    },
  });
}

export function useToggleNegativeHabit() {
  const qc = useQueryClient();
  const addToast = useUiStore((s) => s.addToast);
  return useMutation({
    mutationFn: ({ habitId, date }: { habitId: number; date?: string }) =>
      toggleNegativeHabit(habitId, date),
    onSuccess: (result) => {
      qc.setQueryData(['character'], result.character_after);
      qc.invalidateQueries({ queryKey: ['negative_habits'] });
      qc.invalidateQueries({ queryKey: ['blocked_cats'] });
      qc.invalidateQueries({ queryKey: ['habits'] }); // positive habits may unblock
      qc.invalidateQueries({ queryKey: ['activity_log'] });

      if (result.penalty_applied) {
        addToast({
          type: 'penalty',
          message: `${result.habit.name} — dzień ${result.habit.bad_streak} — ${result.xp_delta} XP`,
          xp: result.xp_delta,
        });
      } else if (result.bonus_blocked) {
        addToast({
          type: 'blocked',
          message: `${result.habit.name} — bonus nawyków zablokowany`,
        });
      }
    },
  });
}

export function useDeleteNegativeHabit() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: deleteNegativeHabit,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['negative_habits'] });
      qc.invalidateQueries({ queryKey: ['blocked_cats'] });
      qc.invalidateQueries({ queryKey: ['habits'] });
    },
  });
}
